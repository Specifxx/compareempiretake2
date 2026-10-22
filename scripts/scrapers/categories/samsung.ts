/**
 * Samsung AU: TVs, monitors and Galaxy Tab tablets from the JSON-LD on server-rendered listing pages.
 * A listing page only carries its first ~24-36 cards, so we union the size and type sub-listings.
 * Each card is one variant whose model code sits at the end of its URL (…-qa65qn90fawxxy/).
 */
import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../lib/http";

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
      html = await get(`${BASE}/au/${section}/${p}/`);
    } catch {
      continue;
    }
    for (const node of walk(jsonLd(html))) {
      if (String(node["@type"]).toLowerCase() !== "product") continue;
      const url = String(node.url ?? node["@id"] ?? "");
      if (!url.includes(`/au/${section}/`) || !keep(url) || byUrl.has(url)) continue;
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
    retailer: "samsung",
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

export const scrapers: Partial<Record<Exclude<CategoryId, "phones">, () => Promise<RawOffer[]>>> = { tvs, monitors, tablets };
