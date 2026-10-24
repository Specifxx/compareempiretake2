/**
 * Samsung UK: TVs, monitors and Galaxy Tab tablets from the JSON-LD on server-rendered listing pages.
 * A listing page only carries its first ~24-36 cards, so we union the size and type sub-listings.
 * Each card is one variant whose model code sits at the end of its URL (…-qa65qn90fawxxy/).
 * Phones and watches use the same listing JSON-LD; storage / case size come from the URL slug.
 * The UK product-finder JSON (searchapi.samsung.com, siteCode=uk) carries no prices, so Buds, soundbars, speakers and
 * SSDs (finder-only in the AU scraper) are not scraped here. "Certified Re-Newed" listings are skipped.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../../lib/http";

const BASE = "https://www.samsung.com";

function* walk(o: unknown): Generator<Record<string, unknown>> {
  if (Array.isArray(o)) for (const x of o) yield* walk(x);
  else if (o && typeof o === "object") {
    yield o as Record<string, unknown>;
    for (const v of Object.values(o)) yield* walk(v);
  }
}
function jsonLd(html: string): unknown[] {
  const out: unknown[] = [];
  for (const [, body] of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      out.push(JSON.parse(body));
    } catch {}
  }
  return out;
}

const ACCESSORY = /voucher|gift|cover|case|keyboard|pen\b|s pen|stand|mount|bracket|remote|cable|adapter|soundbar|speaker|warranty|care\+|bundle/i;

async function crawl(section: string, pages: string[], keep: (url: string) => boolean): Promise<{ node: Record<string, unknown>; url: string }[]> {
  const byUrl = new Map<string, Record<string, unknown>>();
  for (const p of pages) {
    let html: string;
    try {
      html = await get(`${BASE}/uk/${section}/${p}/`);
    } catch {
      continue;
    }
    for (const node of walk(jsonLd(html))) {
      if (String(node["@type"]).toLowerCase() !== "product") continue;
      const url = String(node.url ?? node["@id"] ?? "");
      if (!url.includes(`/uk/${section}/`) || !keep(url) || byUrl.has(url)) continue;
      byUrl.set(url, node);
    }
    await sleep(900);
  }
  return [...byUrl].map(([url, node]) => ({ url, node }));
}

function toOffer(node: Record<string, unknown>, url: string, title: string): RawOffer | undefined {
  const offer = (Array.isArray(node.offers) ? node.offers[0] : node.offers) as Record<string, unknown> | undefined;
  const price = Number(String(offer?.price ?? "").replace(/[^0-9.]/g, ""));
  if (!price) return undefined;
  const code = url.replace(/\/$/, "").split("-").pop()!.toUpperCase();
  const mpn = String(node.sku ?? node.mpn ?? "") || (/^[A-Z]{2}[A-Z0-9]{6,}$/.test(code) ? code : undefined);
  let image = Array.isArray(node.image) ? node.image[0] : node.image;
  if (typeof image === "string" && image.startsWith("//")) image = `https:${image}`;
  return {
    retailer: "uk-samsung",
    sku: mpn || url,
    mpn: mpn || undefined,
    brand: "Samsung",
    title,
    url,
    price,
    image: typeof image === "string" ? image : undefined,
    inStock: !/OutOfStock|SoldOut/i.test(String(offer?.availability ?? "")),
  };
}

const name = (n: Record<string, unknown>) => decodeEntities(String(n.name ?? "")).replace(/\s+/g, " ").trim();

async function tvs(): Promise<RawOffer[]> {
  const pages = [
    "all-tvs", "32-inch-tvs", "43-inch-tvs", "50-inch-tvs", "55-inch-tvs", "65-inch-tvs", "75-inch-tvs", "85-inch-tvs",
    "98-inch-tvs", "art-tv", "crystal-uhd-tv", "full-hd-tv", "micro-rgb-tv", "mini-led-tv", "neo-qled-tv", "oled-tv",
    "qled-tv", "uhd-4k-tv", "uhd-8k-tv", "gaming-tv",
  ];
  const out: RawOffer[] = [];
  for (const { node, url } of await crawl("tvs", pages, (u) => !/accessor|projector|soundbar/.test(u))) {
    const n = name(node);
    if (!/\d+(\.\d+)?"|\d+-inch/i.test(n) || ACCESSORY.test(n)) continue;
    const t = toOffer(node, url, `Samsung ${n.replace(/^Samsung\s+/i, "")}`);
    if (t) out.push(t);
  }
  return out;
}

async function monitors(): Promise<RawOffer[]> {
  const pages = ["all-monitors", "4k-uhd", "curved", "full-hd-1080p", "gaming", "high-resolution", "odyssey-gaming-monitor", "oled", "smart-monitor", "smart", "ultra-wide", "viewfinity-high-resolution-monitor"];
  const out: RawOffer[] = [];
  for (const { node, url } of await crawl("monitors", pages, (u) => !/accessor/.test(u))) {
    const n = name(node);
    if (!/\d+(\.\d+)?"/.test(n) || ACCESSORY.test(n)) continue;
    const t = toOffer(node, url, `Samsung ${n.replace(/^Samsung\s+/i, "")}`);
    if (t) out.push(t);
  }
  return out;
}

async function tablets(): Promise<RawOffer[]> {
  const out: RawOffer[] = [];
  for (const { node, url } of await crawl("tablets", ["all-tablets", "galaxy-tab-s", "galaxy-tab-a"], () => true)) {
    const n = name(node);
    if (!/galaxy tab/i.test(n) || ACCESSORY.test(n)) continue;
    // Storage and colour live in the URL: …/galaxy-tab-s12-ultra-5g-gray-512gb-sm-x946bzaeats/
    const slug = url.replace(/\/$/, "").split("/").pop()!;
    const storage = slug.match(/-(\d+(?:gb|tb))-/)?.[1]?.toUpperCase();
    if (!storage) continue;
    const t = toOffer(node, url, `Samsung ${n.replace(/^Samsung\s+/i, "")} ${storage}`);
    if (t) {
      // URL code is SM-X946BZAEATS; Samsung's model code is the part before the colour/region suffix.
      const code = slug.match(/-(sm-[a-z0-9]+)$/)?.[1]?.toUpperCase();
      if (code && !node.sku) t.mpn = code;
      t.sku = code ?? t.sku;
      out.push(t);
    }
  }
  return out;
}

type FinderModel = {
  modelCode: string;
  displayName?: string;
  price?: string | null;
  promotionPrice?: string | null;
  stockStatusText?: string | null;
  pdpUrl?: string;
  thumbUrl?: string;
  fmyChipList?: { fmyChipType?: string; fmyChipName?: string; fmyChipLocalName?: string }[];
};
type FinderFamily = { fmyMarketingName: string; categorySubTypeEngName?: string; modelList: FinderModel[] };

async function finder(type: string): Promise<FinderFamily[]> {
  const out: FinderFamily[] = [];
  for (let start = 1; start < 500; start += 100) {
    const url = `https://searchapi.samsung.com/v6/front/b2c/product/finder/global?type=${type}&siteCode=uk&start=${start}&num=100&sort=newest&onlyFilterInfoYN=N&keySummaryYN=Y&shopSiteCode=uk`;
    const d = JSON.parse(await get(url)) as { response: { resultData: { common: { totalRecord: string }; productList: FinderFamily[] } } };
    const r = d.response.resultData;
    out.push(...r.productList);
    await sleep(900);
    if (start + 100 > Number(r.common.totalRecord)) break;
  }
  return out;
}

function finderOffer(m: FinderModel, title: string): RawOffer | undefined {
  const rrp = Number(m.price) || 0;
  const now = Number(m.promotionPrice) || rrp;
  if (!now || !m.pdpUrl) return undefined;
  const thumb = m.thumbUrl?.startsWith("//") ? `https:${m.thumbUrl}` : m.thumbUrl;
  return {
    retailer: "uk-samsung",
    sku: m.modelCode,
    mpn: m.modelCode,
    brand: "Samsung",
    title: title.replace(/[™®]/g, "").replace(/\s+/g, " ").trim(),
    url: `${BASE}${m.pdpUrl}`,
    price: now,
    wasPrice: rrp > now ? rrp : undefined,
    image: thumb,
    inStock: !/outOfStock|soldOut/i.test(String(m.stockStatusText ?? "")),
  };
}

const chip = (m: FinderModel, type: string) => m.fmyChipList?.find((c) => c.fmyChipType === type)?.fmyChipLocalName ?? m.fmyChipList?.find((c) => c.fmyChipType === type)?.fmyChipName;

async function smartwatches(): Promise<RawOffer[]> {
  const out: RawOffer[] = [];
  for (const f of await finder("01030000")) {
    if (!/watch/i.test(f.fmyMarketingName)) continue; // Galaxy Fit bands
    for (const m of f.modelList) {
      const n = decodeEntities(m.displayName ?? f.fmyMarketingName);
      const slug = m.pdpUrl ?? "";
      const size = n.match(/(\d+) ?mm/)?.[1] ?? slug.match(/-(\d+)mm-/)?.[1] ?? (/ultra/i.test(n) ? "47" : undefined);
      const lte = /\bLTE\b/i.test(n) || /-lte-/.test(slug) || /ultra/i.test(n);
      const model = n.replace(/\s*\((?:Bluetooth|LTE)[^)]*\)/i, "").trim();
      const colour = chip(m, "COLOR");
      const title = `Samsung ${model} ${size ? `${size}mm ` : ""}${lte ? "GPS + Cellular (LTE)" : "GPS (Bluetooth)"}${colour ? ` - ${colour}` : ""}`;
      const o = finderOffer(m, title);
      if (o) out.push(o);
    }
  }
  return out;
}

async function headphones(): Promise<RawOffer[]> {
  const out: RawOffer[] = [];
  for (const f of await finder("01040000"))
    for (const m of f.modelList) {
      const n = decodeEntities(m.displayName ?? f.fmyMarketingName);
      if (ACCESSORY.test(n.replace(/\bcase\b/i, ""))) continue;
      const colour = chip(m, "COLOR");
      const o = finderOffer(m, `Samsung ${n}${colour ? ` - ${colour}` : ""}`);
      if (o) out.push(o);
    }
  return out;
}

async function audioDevices(kind: "soundbars" | "speakers"): Promise<RawOffer[]> {
  const out: RawOffer[] = [];
  for (const f of await finder("05010000"))
    for (const m of f.modelList) {
      const n = decodeEntities(m.displayName ?? f.fmyMarketingName);
      const bar = /soundbar/i.test(n) || f.categorySubTypeEngName === "Soundbar";
      if ((kind === "soundbars") !== bar || /mount|bracket|cable|remote|stand\b/i.test(n)) continue;
      const o = finderOffer(m, `Samsung ${n}`);
      if (o) out.push(o);
    }
  return out;
}

async function ssds(): Promise<RawOffer[]> {
  const out: RawOffer[] = [];
  for (const f of await finder("09010000")) {
    if (!/SSD/i.test(f.categorySubTypeEngName ?? "")) continue; // memory cards, USB flash drives
    for (const m of f.modelList) {
      let n = decodeEntities(m.displayName ?? f.fmyMarketingName);
      const cap = chip(m, "CAPACITY") ?? m.fmyChipList?.find((c) => /^\d+ ?(GB|TB)$/i.test(c.fmyChipName ?? ""))?.fmyChipName;
      if (cap && !/\d+ ?(GB|TB)\b/i.test(n)) n = `${n} ${cap.replace(/ /g, "")}`;
      const o = finderOffer(m, `Samsung ${n}`);
      if (o) out.push(o);
    }
  }
  return out;
}


/** UK listing pages: storage/size and colour are in the URL slug (…/galaxy-a57-5g-awesome-navy-256gb-sm-a576bdbdeub/). "/buy/?modelCode=" cards carry no storage, so they are skipped. */
async function slugged(section: string, pages: string[], keep: (n: string) => boolean, fmt: (n: string, slug: string) => string | undefined): Promise<RawOffer[]> {
  const out: RawOffer[] = [];
  for (const { node, url } of await crawl(section, pages, (u) => !/\/buy\/|re-newed|refurb/.test(u))) {
    const n = name(node);
    if (!keep(n) || /re-?newed|refurb/i.test(n)) continue;
    const slug = url.replace(/\/$/, "").split("/").pop()!;
    const title = fmt(n, slug);
    if (!title) continue;
    const t = toOffer(node, url, title);
    const code = slug.match(/-(sm-[a-z0-9]+)$/)?.[1]?.toUpperCase();
    if (t) {
      if (code) t.mpn = t.sku = code;
      out.push(t);
    }
  }
  return out;
}

const phones = () =>
  slugged("smartphones", ["all-smartphones", "galaxy-s", "galaxy-z", "galaxy-a", "others"], (n) => /galaxy/i.test(n), (n, slug) => {
    const storage = slug.match(/-(\d+(?:gb|tb))-/)?.[1]?.toUpperCase();
    return storage ? `Samsung ${n.replace(/^Samsung\s+/i, "")} ${storage}` : undefined;
  });

const watches = () =>
  slugged("watches", ["all-watches", "galaxy-watch"], (n) => /watch/i.test(n), (n, slug) => {
    const size = n.match(/(\d+) ?mm/)?.[1] ?? slug.match(/-(\d+)mm-/)?.[1] ?? (/ultra/i.test(n) ? "47" : undefined);
    const lte = /\bLTE\b/i.test(n) || /-lte-/.test(slug) || /ultra/i.test(n);
    const model = n.replace(/\s*\((?:Bluetooth|LTE)[^)]*\)/i, "").trim();
    return `Samsung ${model} ${size ? `${size}mm ` : ""}${lte ? "GPS + Cellular (LTE)" : "GPS (Bluetooth)"}`;
  });

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  phones,
  tvs,
  monitors,
  tablets,
  smartwatches: watches,
};
