/**
 * Joins data/phones/raw/*.json into data/phones/catalog.json (one entry per phone model,
 * variants by storage, offers by retailer), records today's best prices in
 * data/phones/history/<date>.json, and writes data/phones/series.json for the price charts.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseTitle, slugify, storageLabel } from "../src/lib/normalize";
import { RETAILERS } from "../src/lib/retailers";
import type { Catalog, HistoryDay, StoreSeries, Offer, Phone, RawOffer, RetailerId, Specs, Variant } from "../src/lib/types";

/** Shopify CDN images first: clean white backgrounds and resizable. */
const IMAGE_PREFERENCE: RetailerId[] = ["jbhifi", "thegoodguys", "harveynorman", "mobileciti"];

interface Group {
  key: string;
  brand: string;
  models: string[];
  raws: RawOffer[];
  byStorage: Map<number, Offer[]>;
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
    foldable: /\b(fold|flip|razr|magic v)/i.test(model),
    esimOnly: /esim only/i.test(all) || undefined,
  };
}

/** Rough "how new" score from the first number in a model name. */
function generation(brand: string, model: string): number {
  const n = Number(model.match(/\d+/)?.[0] ?? 0);
  return n;
}

function today(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
}

function main() {
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
  for (const id of Object.keys(RETAILERS) as RetailerId[]) {
    const f = `data/phones/raw/${id}.json`;
    if (!existsSync(f)) continue;
    const { offers, scrapedAt: at } = JSON.parse(readFileSync(f, "utf8")) as { offers: RawOffer[]; scrapedAt: string };
    scrapedAt.push(at);
    for (const o of offers) {
      const p = parseTitle(o.title, { allowNoStorage: o.fromPrice });
      if (!p) continue;
      if (p.storageGb === 0) {
        baseOnly.push({ o, key: p.key, colour: p.colour });
        continue;
      }
      let g = groups.get(p.key);
      if (!g) groups.set(p.key, (g = { key: p.key, brand: p.brand, models: [], raws: [], byStorage: new Map() }));
      g.models.push(p.model);
      g.raws.push(o);
      const list = g.byStorage.get(p.storageGb) ?? [];
      list.push(toOffer(o, p.colour));
      g.byStorage.set(p.storageGb, list);
    }
  }
  // A "from" price with no storage is the base model's: pin it to the smallest
  // storage other stores sell. A model nobody else lists is skipped.
  for (const { o, key, colour } of baseOnly) {
    const g = groups.get(key);
    if (!g) continue;
    const base = Math.min(...g.byStorage.keys());
    g.raws.push(o);
    g.byStorage.get(base)!.push(toOffer(o, colour));
  }

  // History: today's best price per retailer for every variant.
  const day = today();
  const todayHistory: HistoryDay = {};
  const phones: Phone[] = [];
  for (const g of groups.values()) {
    const model = mostCommon(g.models);
    const name = `${g.brand} ${model}`;
    const slug = slugify(name);
    const variants: Variant[] = [];
    for (const [storageGb, raw] of [...g.byStorage].sort((a, b) => a[0] - b[0])) {
      // Drop listings far below the others: bundles, trade-in prices, mis-tagged refurbs.
      const outright = raw.filter((o) => o.kind !== "plan");
      const plans = raw.filter((o) => o.kind === "plan").sort((a, b) => a.price - b.price);
      const med = outright.length ? median(outright.map((o) => o.price)) : 0;
      const kept = (outright.length >= 3 ? outright.filter((o) => o.price >= med * 0.55) : outright).sort((a, b) => a.price - b.price);
      const offers = [...kept, ...plans];
      if (!offers.length) continue;
      const pool = kept.length ? kept : plans;
      const inStock = pool.filter((o) => o.inStock);
      const bestPrice = (inStock.length ? inStock : pool)[0].price;
      const id = storageLabel(storageGb).toLowerCase();
      variants.push({ id, storageGb, offers, bestPrice });
      const perRetailer: Partial<Record<RetailerId, number>> = {};
      for (const o of inStock.length ? inStock : pool) perRetailer[o.retailer] = Math.min(perRetailer[o.retailer] ?? Infinity, o.price);
      (todayHistory[slug] ??= {})[id] = perRetailer;
    }
    if (!variants.length) continue;
    const offersAll = variants.flatMap((v) => v.offers);
    const byPref = [...offersAll].filter((o) => o.image).sort(
      (a, b) => IMAGE_PREFERENCE.indexOf(a.retailer) - IMAGE_PREFERENCE.indexOf(b.retailer),
    );
    const images = [...new Set(byPref.map((o) => o.image!))].slice(0, 8);
    const colours = [...new Set(offersAll.map((o) => o.colour).filter(Boolean))].sort();
    const blurb = g.raws.find((r) => r.blurb)?.blurb;
    phones.push({
      slug,
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
      specs: extractSpecs(model, [...g.raws.map((r) => r.title), ...(blurb ? [blurb] : [])]),
      generation: generation(g.brand, model),
      firstSeen: day,
    });
  }

  writeFileSync(`data/phones/history/${day}.json`, JSON.stringify(todayHistory) + "\n");

  // Fold every history day into per-variant series: the best price, and each store's own.
  const days = readdirSync("data/phones/history").filter((f) => f.endsWith(".json")).sort();
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
    const h = JSON.parse(readFileSync(`data/phones/history/${f}`, "utf8")) as HistoryDay;
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
  if (existsSync("data/phones/archive")) {
    for (const f of readdirSync("data/phones/archive").filter((x) => x.endsWith(".json"))) {
      const points = JSON.parse(readFileSync(`data/phones/archive/${f}`, "utf8")) as Record<string, [string, number][]>;
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
    updatedAt: scrapedAt.sort().at(-1) ?? new Date().toISOString(),
    retailers: Object.values(RETAILERS),
    phones,
  };
  writeFileSync("data/phones/catalog.json", JSON.stringify(catalog) + "\n");
  writeFileSync("data/phones/series.json", JSON.stringify(series) + "\n");
  writeFileSync("data/phones/store-series.json", JSON.stringify(storeSeries) + "\n");
  const offers = phones.reduce((n, p) => n + p.offerCount, 0);
  console.log(`catalog: ${phones.length} phones, ${offers} offers, ${days.length} history days, ${archived} archived store prices`);
}

main();
