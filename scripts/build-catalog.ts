/**
 * For each category, joins data/<category>/raw/*.json into data/<category>/catalog.json
 * (one entry per product, variants by storage/size/connectivity, offers by retailer),
 * records today's best prices in data/<category>/history/<date>.json, and writes the
 * price-chart series.
 *
 *   npx tsx scripts/build-catalog.ts            # every category with raw data
 *   npx tsx scripts/build-catalog.ts tvs        # one category
 */
import { dataPath, REGIONS, type RegionId } from "../src/lib/region";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { CATEGORIES } from "../src/lib/categories";
import { categorySpecs, conflicts, mergeTarget, parseProduct, type Parsed } from "../src/lib/match";
import { parseTitle, slugify, storageLabel } from "../src/lib/normalize";
import { RETAILERS } from "../src/lib/retailers";
import type { Catalog, CategoryId, HistoryDay, StoreSeries, Offer, Phone, RawOffer, RetailerId, Specs, Variant } from "../src/lib/types";

/** Shopify CDN images first: clean white backgrounds and resizable. */
const IMAGE_PREFERENCE: RetailerId[] = ["jbhifi", "thegoodguys", "harveynorman", "digidirect", "betta", "mwave", "apple", "samsung", "dell", "costco", "ple", "mobileciti", "umart", "msy"];
const imageRank = (r: RetailerId) => (IMAGE_PREFERENCE.indexOf(r) + 100) % 100;

interface Group {
  key: string;
  brand: string;
  models: string[];
  raws: RawOffer[];
  byVariant: Map<string, { label: string; storageGb: number; offers: Offer[] }>;
  code?: string;
  size?: number;
  disc?: string[];
  aliases?: Set<string>;
}

/** Phones keep their original parser; every other category uses src/lib/match.ts. */
function parse(o: RawOffer, category: CategoryId): Parsed | null {
  if (category !== "phones") return parseProduct(o, category);
  const p = parseTitle(o.title, { allowNoStorage: o.fromPrice });
  if (!p) return null;
  const label = storageLabel(p.storageGb);
  return { brand: p.brand, model: p.model, key: p.key, colour: p.colour, variant: { id: p.storageGb ? label.toLowerCase() : "", label, storageGb: p.storageGb } };
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function mostCommon(xs: string[]): string {
  const c = new Map<string, number>();
  for (const x of xs) c.set(x, (c.get(x) ?? 0) + 1);
  return [...c].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0];
}

function extractSpecs(model: string, texts: string[]): Specs {
  const all = texts.join(" \n ");
  const num = (re: RegExp, pick: (xs: number[]) => number) => {
    const xs = [...all.matchAll(re)].map((m) => Number(m[1])).filter((n) => n > 0);
    return xs.length ? pick(xs) : undefined;
  };
  const screen = num(/(\d\.\d{1,2})\s*(?:''|"|”|’’|-?\s?inch)/gi, (xs) => Number(mostCommon(xs.map(String))));
  const battery = num(/(\d{4,5})\s?mAh/gi, (xs) => Math.max(...xs));
  const camera = num(/(\d{2,3})\s?MP\b/gi, (xs) => Math.max(...xs));
  const chip = all.match(/\b(A\d{2}(?: Pro| Bionic)?(?= chip)|Snapdragon[ ®]*(?:8 Elite(?: Gen \d)?|\d+s?\+? Gen \d|\d{3}\w?)|Tensor G\d|Dimensity \d{3,4}\w*|Exynos \d{4}|Helio [A-Z]\d+)/)?.[1];
  const has5g = /\b5G\b/.test(all);
  const has4g = /\b4G\b/.test(all);
  return {
    screenInches: screen && screen > 4 && screen < 9 ? screen : undefined,
    batteryMah: battery && battery < 12000 ? battery : undefined,
    mainCameraMp: camera && camera <= 200 ? camera : undefined,
    chip: chip?.replace(/[ ®]+/g, " ").trim(),
    network: has4g && !has5g ? "4G" : "5G",
    foldable: /\b(fold|flip|razr|magic v|iphone duo)/i.test(model),
    esimOnly: /esim only/i.test(all) || undefined,
  };
}

/** Rough "how new" score from the first number in a model name. */
function generation(brand: string, model: string): number {
  const n = Number(model.match(/\d+/)?.[0] ?? 0);
  return n;
}

// --region us|uk builds data/<region>/<category>; the default is Australia (data/<category>).
const regionArg = process.argv.indexOf("--region");
const REGION = (regionArg >= 0 ? process.argv.splice(regionArg, 2)[1] : "au") as RegionId;
if (!REGIONS[REGION]) throw new Error(`unknown region ${REGION}`);
const ROOT = dataPath(REGION);

function today(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: REGIONS[REGION].timeZone });
}

function build(category: CategoryId) {
  const dir = `${ROOT}/${category}`;
  const groups = new Map<string, Group>();
  const scrapedAt: string[] = [];
  const baseOnly: { o: RawOffer; key: string; colour: string }[] = [];
  const toOffer = (o: RawOffer, colour: string): Offer => ({
    retailer: o.retailer,
    sku: o.sku,
    title: o.title,
    url: o.url,
    price: o.price,
    wasPrice: o.wasPrice,
    colour,
    inStock: o.inStock,
    image: o.image,
    kind: o.kind ?? "outright",
    monthly: o.monthly,
    months: o.months,
  });
  for (const f of readdirSync(`${dir}/raw`).filter((x) => x.endsWith(".json"))) {
    const id = f.replace(/\.json$/, "") as RetailerId;
    if (!RETAILERS[id]) continue;
    const { offers, scrapedAt: at } = JSON.parse(readFileSync(`${dir}/raw/${f}`, "utf8")) as { offers: RawOffer[]; scrapedAt: string };
    scrapedAt.push(at);
    for (const o of offers) {
      const p = parse(o, category);
      if (!p) continue;
      if (category === "phones" && p.variant.storageGb === 0) {
        baseOnly.push({ o, key: p.key, colour: p.colour });
        continue;
      }
      // A listing that contradicts its group's stated specs starts a sibling group.
      let key = p.key;
      if (p.discriminator) {
        for (let n = 2; groups.has(key) && (groups.get(key)!.disc ?? []).some((d) => conflicts(d, p.discriminator!)); n++) key = `${p.key}~${n}`;
      }
      let g = groups.get(key);
      if (!g) groups.set(key, (g = { key, brand: p.brand, models: [], raws: [], byVariant: new Map(), code: p.code, size: p.size, disc: [] }));
      if (p.discriminator) g.disc!.push(p.discriminator);
      if (p.alias) (g.aliases ??= new Set()).add(p.alias);
      g.models.push(p.model);
      g.raws.push(o);
      const v = g.byVariant.get(p.variant.id) ?? { label: p.variant.label, storageGb: p.variant.storageGb, offers: [] };
      v.offers.push(toOffer(o, p.colour));
      g.byVariant.set(p.variant.id, v);
    }
  }
  // A "from" price with no storage is the base model's: pin it to the smallest
  // storage other stores sell. A model nobody else lists is skipped.
  for (const { o, key, colour } of baseOnly) {
    const g = groups.get(key);
    if (!g) continue;
    const base = [...g.byVariant.values()].sort((x, y) => x.storageGb - y.storageGb)[0];
    g.raws.push(o);
    base.offers.push(toOffer(o, colour));
  }
  // TVs: a store that only gives the full part number (QA65QN90FAWXXY)
  // joins the group with the series code it contains (QN90F), same brand and size.
  if (category === "tvs") {
    const all = [...groups.values()];
    for (const g of all) {
      if (!g.code || !groups.has(g.key)) continue;
      const peers = all.filter((x) => x !== g && x.brand === g.brand && x.size === g.size && x.code && groups.has(x.key)).map((x) => ({ key: x.key, code: x.code! }));
      const target = mergeTarget(g.code, peers);
      if (!target) continue;
      const t = groups.get(target)!;
      t.models.push(...g.models);
      t.raws.push(...g.raws);
      for (const [vid, v] of g.byVariant) {
        const tv = t.byVariant.get(vid);
        if (tv) tv.offers.push(...v.offers);
        else t.byVariant.set(vid, v);
      }
      groups.delete(g.key);
    }
  }

  // Code-first categories: a group with no model code (a store that prints none) joins the one coded
  // group of the same brand whose listings use exactly its words. Two or more candidates: left alone.
  {
    const all = [...groups.values()];
    for (const g of all) {
      if (g.code || !g.aliases?.size) continue;
      const targets = all.filter((x) => x.code && x.brand === g.brand && groups.has(x.key) && [...g.aliases!].some((a) => x.aliases?.has(a)));
      if (targets.length !== 1) continue;
      const t = targets[0];
      t.models.push(...g.models);
      t.raws.push(...g.raws);
      for (const [vid, v] of g.byVariant) {
        const tv = t.byVariant.get(vid);
        if (tv) tv.offers.push(...v.offers);
        else t.byVariant.set(vid, v);
      }
      groups.delete(g.key);
    }
  }

  // History: today's best price per retailer for every variant.
  const day = today();
  const todayHistory: HistoryDay = {};
  const phones: Phone[] = [];
  const usedSlugs = new Set<string>();
  for (const g of groups.values()) {
    const model = mostCommon(g.models);
    const name = `${g.brand} ${model}`;
    // File names can't exceed 255 bytes; Australia's longest slug is 162, so 170 changes no existing URL.
    const cap = (x: string) => (x.length <= 170 ? x : x.slice(0, 170).replace(/-[^-]*$/, ""));
    let slug = cap(slugify(name));
    // Two listings with the same display name but different keys (codes) must not share a URL.
    for (let n = 2; usedSlugs.has(slug); n++) {
      const suffix = slugify(g.code ?? String(usedSlugs.size)) + (n > 2 ? `-${n}` : "");
      slug = `${cap(slugify(name)).slice(0, 168 - suffix.length)}-${suffix}`;
    }
    usedSlugs.add(slug);
    const variants: Variant[] = [];
    for (const [vid, { label, storageGb, offers: raw }] of [...g.byVariant].sort((a, b) => a[1].storageGb - b[1].storageGb || a[0].localeCompare(b[0]))) {
      // Drop listings far below the others: bundles, trade-in prices, mis-tagged refurbs.
      const outright = raw.filter((o) => o.kind !== "plan");
      const plans = raw.filter((o) => o.kind === "plan").sort((a, b) => a.price - b.price);
      const med = outright.length ? median(outright.map((o) => o.price)) : 0;
      // ...and far above: a marketplace seller's bundle, or a listing for a bigger model under the same code.
      const kept = (outright.length >= 3 ? outright.filter((o) => o.price >= med * 0.55 && o.price <= med * 2.2) : outright).sort((a, b) => a.price - b.price);
      const offers = [...kept, ...plans];
      if (!offers.length) continue;
      const pool = kept.length ? kept : plans;
      const inStock = pool.filter((o) => o.inStock);
      const bestPrice = (inStock.length ? inStock : pool)[0].price;
      const id = vid;
      variants.push({ id, label, storageGb, offers, bestPrice });
      const perRetailer: Partial<Record<RetailerId, number>> = {};
      for (const o of inStock.length ? inStock : pool) perRetailer[o.retailer] = Math.min(perRetailer[o.retailer] ?? Infinity, o.price);
      (todayHistory[slug] ??= {})[id] = perRetailer;
    }
    if (!variants.length) continue;
    const offersAll = variants.flatMap((v) => v.offers);
    const byPref = [...offersAll].filter((o) => o.image).sort(
      (a, b) => imageRank(a.retailer) - imageRank(b.retailer),
    );
    const images = [...new Set(byPref.map((o) => o.image!))].slice(0, 8);
    const colours = [...new Set(offersAll.map((o) => o.colour).filter(Boolean))].sort();
    const blurb = g.raws.find((r) => r.blurb)?.blurb;
    phones.push({
      slug,
      category,
      brand: g.brand,
      model,
      name,
      image: images[0],
      images,
      colours,
      variants,
      bestPrice: Math.min(...variants.map((v) => v.bestPrice)),
      retailerCount: new Set(offersAll.map((o) => o.retailer)).size,
      offerCount: offersAll.length,
      blurb: blurb ? blurb.replace(/\s\d{1,2}\s+(?=[,.;])/g, "").replace(/(?<=[.!])\s\d{1,2}(?=\s[A-Z])/g, "").replace(/\s+([,.])/g, "$1").split(/(?<=\.)\s/).slice(0, 3).join(" ").slice(0, 320) : undefined,
      specs: category === "phones" ? extractSpecs(model, [...g.raws.map((r) => r.title), ...(blurb ? [blurb] : [])]) : categorySpecs(category, g.raws.map((r) => r.title)),
      generation: generation(g.brand, model),
      firstSeen: day,
    });
  }

  mkdirSync(`${dir}/history`, { recursive: true });
  writeFileSync(`${dir}/history/${day}.json`, JSON.stringify(todayHistory) + "\n");

  // Fold every history day into per-variant series: the best price, and each store's own.
  const days = readdirSync(`${dir}/history`).filter((f) => f.endsWith(".json")).sort();
  const series: Record<string, Record<string, [string, number][]>> = {};
  const storeSeries: StoreSeries = {};
  const firstSeen: Record<string, string> = {};
  const addStore = (slug: string, vid: string, r: RetailerId, date: string, price: number) => {
    const list = (((storeSeries[slug] ??= {})[vid] ??= {})[r] ??= []);
    const same = list.find(([d]) => d === date);
    if (same) same[1] = Math.min(same[1], price);
    else list.push([date, price]);
  };
  for (const f of days) {
    const date = f.replace(".json", "");
    const h = JSON.parse(readFileSync(`${dir}/history/${f}`, "utf8")) as HistoryDay;
    for (const [slug, vs] of Object.entries(h)) {
      firstSeen[slug] ??= date;
      for (const [vid, prices] of Object.entries(vs)) {
        const best = Math.min(...(Object.values(prices) as number[]));
        if (Number.isFinite(best)) ((series[slug] ??= {})[vid] ??= []).push([date, best]);
        for (const [r, price] of Object.entries(prices)) addStore(slug, vid, r as RetailerId, date, price as number);
      }
    }
  }
  // Older prices from Internet Archive snapshots of the same product pages
  // (scripts/backfill-archive.ts). They are per store and sparse, so they feed
  // each store's own history, never the "best price" line.
  const byUrl = new Map<string, { slug: string; vid: string; r: RetailerId }>();
  for (const p of phones) for (const v of p.variants) for (const o of v.offers) if (o.kind !== "plan") byUrl.set(o.url, { slug: p.slug, vid: v.id, r: o.retailer });
  let archived = 0;
  if (existsSync(`${dir}/archive`)) {
    for (const f of readdirSync(`${dir}/archive`).filter((x) => x.endsWith(".json"))) {
      const points = JSON.parse(readFileSync(`${dir}/archive/${f}`, "utf8")) as Record<string, [string, number][]>;
      for (const [url, pts] of Object.entries(points)) {
        const hit = byUrl.get(url);
        if (!hit) continue;
        for (const [d, price] of pts) if (d < day) {
          addStore(hit.slug, hit.vid, hit.r, d, price);
          archived++;
          if (!firstSeen[hit.slug] || d < firstSeen[hit.slug]) firstSeen[hit.slug] = d;
        }
      }
    }
  }
  for (const vs of Object.values(storeSeries)) for (const rs of Object.values(vs)) for (const list of Object.values(rs)) list!.sort((a, b) => a[0].localeCompare(b[0]));
  const weekAgo = new Date(Date.parse(day) - 7 * 864e5).toISOString().slice(0, 10);
  for (const p of phones) {
    p.firstSeen = firstSeen[p.slug] ?? day;
    for (const v of p.variants) {
      const s = series[p.slug]?.[v.id] ?? [];
      v.lowestEver = Math.min(v.bestPrice, ...s.map(([, x]) => x));
      const past = s.filter(([d]) => d < day);
      const ref = past.filter(([d]) => d <= weekAgo).at(-1) ?? past[0];
      if (ref) v.previousBest = ref[1];
    }
  }

  phones.sort((a, b) => b.retailerCount - a.retailerCount || b.bestPrice - a.bestPrice);
  const catalog: Catalog = {
    category,
    updatedAt: scrapedAt.sort().at(-1) ?? new Date().toISOString(),
    retailers: Object.values(RETAILERS),
    phones,
  };
  writeFileSync(`${dir}/catalog.json`, JSON.stringify(catalog) + "\n");
  writeFileSync(`${dir}/series.json`, JSON.stringify(series) + "\n");
  writeFileSync(`${dir}/store-series.json`, JSON.stringify(storeSeries) + "\n");
  const offers = phones.reduce((n, p) => n + p.offerCount, 0);
  console.log(`${category}: ${phones.length} products, ${offers} offers, ${days.length} history days, ${archived} archived store prices`);
}

const asked = process.argv.slice(2) as CategoryId[];
for (const c of CATEGORIES.map((x) => x.id as CategoryId)) {
  if (asked.length ? !asked.includes(c) : !existsSync(`${ROOT}/${c}/raw`)) continue;
  build(c);
}

// Scraper health for /admin: when each store/category was last scraped and how many listings it gave.
const status: { category: string; retailer: string; offers: number; scrapedAt: string }[] = [];
for (const c of CATEGORIES) {
  const dir = `${ROOT}/${c.id}/raw`;
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const raw = JSON.parse(readFileSync(`${dir}/${f}`, "utf8")) as { scrapedAt: string; offers: unknown[] };
    status.push({ category: c.id, retailer: f.replace(/\.json$/, ""), offers: raw.offers.length, scrapedAt: raw.scrapedAt });
  }
}
writeFileSync(`${ROOT}/status.json`, JSON.stringify({ builtAt: new Date().toISOString(), scrapes: status }) + "\n");
