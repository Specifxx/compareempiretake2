/**
 * Samsung US (samsung.com/us): phones, tablets, watches, TVs and monitors from the schema.org ItemList that every
 * server-rendered listing page carries (one Product per card: name, USD price, availability, a URL ending in
 * "-sku-<model code>"). A page holds ~24 cards, so each category unions its sub-listings. Written 2026-11-06 from
 * GitHub Actions probes (the listing pages answer 200 with the JSON-LD in the HTML; no key, no API).
 * Unlocked full-price only: carrier models ("(Verizon)", "-verizon-sku-"), Certified Re-Newed, trade-in and bundle
 * cards are left out; a phone's storage is in its name ("Galaxy S26 Ultra 512GB (Unlocked)").
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

const CARRIER = /\((?:verizon|at&t|at&amp;t|t-mobile|us cellular|uscellular|xfinity|spectrum|visible|boost|cricket|metro)[^)]*\)|-(?:verizon|att|t-mobile|tmobile|us-cellular|uscellular|xfinity|spectrum|boost)-sku-/i;
const SKIP = /re-?newed|refurb|bundle|trade-?in|\bkit\b|\+\s*(?:galaxy|buds|watch|case)|voucher|gift|cover|case\b|keyboard|s pen|stand\b|mount|bracket|remote|cable|adapter|charger|warranty|care\+/i;

/** Every Product card (url → node) on the given listing pages, kept only when its URL is under one of `under`. */
async function crawl(pages: string[], under: RegExp): Promise<{ node: Record<string, unknown>; url: string }[]> {
  const byUrl = new Map<string, Record<string, unknown>>();
  for (const p of pages) {
    let html: string;
    try {
      html = await get(`${BASE}/us/${p}/`);
    } catch {
      continue;
    }
    for (const node of walk(jsonLd(html))) {
      if (String(node["@type"]).toLowerCase() !== "product") continue;
      const url = String(node.url ?? "").replace(/\/$/, "");
      if (!url || !under.test(url) || byUrl.has(url)) continue;
      byUrl.set(url, node);
    }
    await sleep(900);
  }
  return [...byUrl].map(([url, node]) => ({ url, node }));
}

const name = (n: Record<string, unknown>) => decodeEntities(String(n.name ?? "")).replace(/[™®]/g, "").replace(/\s+/g, " ").trim();
const code = (url: string) => url.match(/-sku-([a-z0-9-]+)$/i)?.[1]?.toUpperCase();

function toOffer(node: Record<string, unknown>, url: string, title: string): RawOffer | undefined {
  const offer = (Array.isArray(node.offers) ? node.offers[0] : node.offers) as Record<string, unknown> | undefined;
  if (offer && offer.priceCurrency && offer.priceCurrency !== "USD") return undefined;
  const price = Number(String(offer?.price ?? "").replace(/[^0-9.]/g, ""));
  if (!price) return undefined;
  const mpn = code(url);
  // Carrier models end in the carrier's code (SM-S938UZBAVZW Verizon, …ATT, …TMB, …USC); unlocked ones in XAA/XAR.
  if (mpn && /(?:VZW|ATT|TMB|USC|SPR|DSH)$/.test(mpn)) return undefined;
  const image = typeof node.image === "string" ? node.image.replace(/\?\$.*$/, "") : undefined;
  return {
    retailer: "us-samsung",
    sku: mpn ?? url,
    mpn,
    brand: "Samsung",
    title,
    url,
    price,
    image,
    inStock: !/OutOfStock|SoldOut|PreOrder/i.test(String(offer?.availability ?? "")),
  };
}

async function phones(): Promise<RawOffer[]> {
  const out: RawOffer[] = [];
  const cards = await crawl(["smartphones/all-smartphones", "smartphones/galaxy-s", "smartphones/galaxy-z", "smartphones/galaxy-a"], /\/us\/smartphones\//);
  for (const { node, url } of cards) {
    const n = name(node);
    if (!/galaxy/i.test(n) || CARRIER.test(n) || CARRIER.test(url) || SKIP.test(n) || /re-newed/.test(url)) continue;
    if (!/\(unlocked\)/i.test(n) && !/-unlocked-sku-/.test(url)) continue;
    const storage = n.match(/\b(\d+)\s?(GB|TB)\b/i);
    if (!storage) continue;
    const model = n.replace(/\s*\(unlocked\)\s*/i, " ").replace(/^Samsung\s+/i, "").trim();
    const t = toOffer(node, url, `Samsung ${model}`);
    if (t) out.push(t);
  }
  return out;
}

async function tablets(): Promise<RawOffer[]> {
  const out: RawOffer[] = [];
  for (const { node, url } of await crawl(["tablets/all-tablets", "tablets/galaxy-tab-s", "tablets/galaxy-tab-a"], /\/us\/tablets\//)) {
    const n = name(node);
    if (!/galaxy tab/i.test(n) || SKIP.test(n) || CARRIER.test(url)) continue;
    // Storage and connectivity live in the URL: …/galaxy-tab-s12-ultra-256gb-gray-wi-fi-sku-sm-x940nzaaxar
    const slug = url.split("/").pop()!;
    const storage = slug.match(/-(\d+(?:gb|tb))-/)?.[1]?.toUpperCase();
    if (!storage) continue;
    // Some cards read "Galaxy Tab A11+ , 128GB, Gray (Unlocked)": keep the model, put the URL's storage after it.
    const model = n.split(/\s*,\s*/)[0].replace(/^Samsung\s+/i, "").replace(/\s*\((?:unlocked|wi-?fi|5g)[^)]*\)/gi, "").replace(/\b\d+\s?(?:GB|TB)\b/i, "").replace(/\s+/g, " ").trim();
    const t = toOffer(node, url, `Samsung ${model} ${storage}`);
    if (t) out.push(t);
  }
  return out;
}

async function smartwatches(): Promise<RawOffer[]> {
  const out: RawOffer[] = [];
  for (const { node, url } of await crawl(["watches/all-watches", "watches/galaxy-watch"], /\/us\/watches\//)) {
    const n = name(node);
    if (!/watch/i.test(n) || SKIP.test(n) || /band|strap/i.test(n)) continue;
    // "Galaxy Watch9, 44mm, LTE, Graphite"
    const parts = n.split(/\s*,\s*/);
    const model = parts[0].replace(/^Samsung\s+/i, "");
    const size = n.match(/(\d+)\s?mm/i)?.[1] ?? url.match(/-(\d+)mm-/)?.[1] ?? (/ultra/i.test(n) ? "47" : undefined);
    const lte = /\bLTE\b/i.test(n) || /-lte-/.test(url) || /ultra/i.test(n);
    const t = toOffer(node, url, `Samsung ${model} ${size ? `${size}mm ` : ""}${lte ? "GPS + Cellular (LTE)" : "GPS (Bluetooth)"}`);
    if (t) out.push(t);
  }
  return out;
}

async function tvs(): Promise<RawOffer[]> {
  const pages = [
    "televisions-home-theater/tvs/all-tvs", "tvs/all-tvs", "tvs/micro-rgb", "tvs/oled-tv", "tvs/neo-qled-tvs", "tvs/mini-led-tvs",
    "tvs/crystal-uhd", "tvs/qled-4k-tvs", "tvs/98-inch-tvs", "tvs/4k-tvs", "tvs/vision-ai-tv", "lifestyle-tvs/the-frame",
    "lifestyle-tvs/all-lifestyle-tvs",
  ];
  const out: RawOffer[] = [];
  for (const { node, url } of await crawl(pages, /\/us\/(?:tvs|lifestyle-tvs)\//)) {
    const n = name(node);
    if (!/\d+(\.\d+)?["”]?\s*(?:inch|class)|\d+-inch/i.test(n) || SKIP.test(n) || /projector|soundbar|terrace/i.test(n)) continue;
    const mpn = code(url);
    const t = toOffer(node, url, `Samsung ${n.replace(/^Samsung\s+/i, "")}${mpn ? ` ${mpn}` : ""}`);
    if (t) out.push(t);
  }
  return out;
}

async function monitors(): Promise<RawOffer[]> {
  const pages = [
    "computing/monitors/all-monitors", "monitors/all-monitors", "monitors/gaming", "monitors/high-resolution", "monitors/smart-monitors",
    "monitors/ultra-wide", "monitors/odyssey-gaming-monitor", "monitors/oled-monitor", "monitors/curved", "monitors/4k-uhd",
    "monitors/full-hd-1080p", "monitors/5k-computer-monitors", "monitors/large-computer-monitors",
  ];
  const out: RawOffer[] = [];
  for (const { node, url } of await crawl(pages, /\/us\/(?:monitors|computing\/monitors)\//)) {
    const n = name(node);
    // "32 Inch The Movingstyle … 27 Inch M5 … Bundle" is two monitors at one price.
    if (!/\d+(\.\d+)?\s*(?:inch|")/i.test(n) || SKIP.test(n) || (n.match(/inch/gi)?.length ?? 0) > 1 || /movingstyle/i.test(n)) continue;
    const mpn = code(url);
    const t = toOffer(node, url, `Samsung ${n.replace(/^Samsung\s+/i, "")}${mpn ? ` ${mpn}` : ""}`);
    if (t) out.push(t);
  }
  return out;
}

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  phones,
  tablets,
  smartwatches,
  tvs,
  monitors,
};
