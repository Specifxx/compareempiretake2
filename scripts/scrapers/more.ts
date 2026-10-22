/**
 * Scrapers for the stores added after launch. Each reads only what a browser
 * loads anonymously (server-rendered HTML, JSON-LD or public JSON feeds).
 * docs/stores/survey.md records how each page was found.
 */
import type { RawOffer } from "../../src/lib/types";
import { decodeEntities, get, getJson, sleep } from "../lib/http";
import { looksLikePhone } from "./filter";
import { scrapeShopify } from "./shopify";

const num = (s: string | undefined) => Number(String(s ?? "").replace(/[^0-9.]/g, ""));
const abs = (base: string, u?: string) => (!u ? undefined : u.startsWith("http") ? u : `${base}${u.startsWith("/") ? "" : "/"}${u}`);

function jsonLd(html: string): unknown[] {
  const out: unknown[] = [];
  for (const [, body] of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      out.push(JSON.parse(body));
    } catch {}
  }
  return out;
}
function* walk(o: unknown): Generator<Record<string, unknown>> {
  if (Array.isArray(o)) for (const x of o) yield* walk(x);
  else if (o && typeof o === "object") {
    yield o as Record<string, unknown>;
    for (const v of Object.values(o)) yield* walk(v);
  }
}

// ---- Official stores -------------------------------------------------------

export async function scrapeApple(): Promise<RawOffer[]> {
  const BASE = "https://www.apple.com";
  const index = await get(`${BASE}/au/shop/buy-iphone`);
  const models = [...new Set([...index.matchAll(/\/au\/shop\/buy-iphone\/(iphone-[a-z0-9-]+)/g)].map((m) => m[1]))];
  const out: RawOffer[] = [];
  for (const m of models) {
    const html = await get(`${BASE}/au/shop/buy-iphone/${m}`);
    const block = html.match(/"products":(\[\{"sku".*?\}\])/)?.[1];
    if (!block) continue;
    const products = JSON.parse(block) as { sku: string; partNumber: string; name: string; price: { fullPrice: number } }[];
    const image = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    for (const p of products) {
      const title = `Apple ${p.name}`;
      if (!looksLikePhone(title) || !p.price?.fullPrice) continue;
      out.push({ retailer: "apple", sku: p.partNumber, title, url: `${BASE}/au/shop/buy-iphone/${m}`, price: p.price.fullPrice, image, inStock: true });
    }
    await sleep(800);
  }
  return out;
}

/** Samsung's grid only gives a "from" price per model, which is its base storage. */
export async function scrapeSamsung(): Promise<RawOffer[]> {
  const html = await get("https://www.samsung.com/au/smartphones/all-smartphones/");
  const out: RawOffer[] = [];
  for (const node of walk(jsonLd(html))) {
    if (String(node["@type"]).toLowerCase() !== "product") continue;
    const offer = (Array.isArray(node.offers) ? node.offers[0] : node.offers) as Record<string, unknown> | undefined;
    const price = num(offer?.price as string);
    const name = String(node.name ?? "").replace(/\s*\(.*?\)\s*/g, " ").trim();
    if (!price || !name || /tab|watch|buds|ring/i.test(name)) continue;
    const image = Array.isArray(node.image) ? node.image[0] : node.image;
    out.push({
      retailer: "samsung",
      sku: String(node.sku ?? name),
      title: `Samsung ${name.replace(/^Samsung\s+/i, "")}`,
      url: abs("https://www.samsung.com", String(node.url ?? offer?.url ?? "/au/smartphones/all-smartphones/"))!,
      price,
      image: abs("https:", typeof image === "string" && image.startsWith("//") ? image : undefined) ?? (typeof image === "string" ? image : undefined),
      inStock: !/OutOfStock/i.test(String(offer?.availability ?? "")),
      fromPrice: true,
    });
  }
  return out;
}

// ---- Carriers: phones paid off monthly ---------------------------------------

export async function scrapeTelstra(): Promise<RawOffer[]> {
  const BASE = "https://www.telstra.com.au";
  const html = await get(`${BASE}/mobile-phones/mobiles-on-a-plan`);
  const out: RawOffer[] = [];
  for (const card of html.split('<li class="tcom-device-grid__product-card').slice(1)) {
    const c = card.slice(0, card.indexOf("</li>") > 0 ? card.indexOf("</li>") : 8000);
    const a = (k: string) => c.match(new RegExp(`data-mobile-device-${k}="([^"]*)"`))?.[1];
    const [name, brand, storage, colour] = [a("name"), a("brand"), a("storage"), a("colour")];
    const monthly = num(a("price"));
    const months = num(a("repayment-term")) || 36;
    const total = num(a("price-total")) || Math.round(monthly * months * 100) / 100;
    if (!name || !monthly || !storage) continue;
    const title = `${brand ?? ""} ${name} ${storage} - ${colour ?? ""}`.trim();
    if (!looksLikePhone(title.replace(/telstra/i, ""))) continue;
    const href = c.match(/href="(\/mobile-phones\/mobiles-on-a-plan\/[^"]+)"/)?.[1];
    const img = c.match(/(\/content\/dam\/tcom\/devices\/mobile\/[^"]+\/front\.png)/)?.[1];
    out.push({ retailer: "telstra", sku: `${name}-${storage}-${colour}`, title, url: BASE + (href ?? "/mobile-phones/mobiles-on-a-plan"), price: total, image: img ? BASE + img : undefined, inStock: true, kind: "plan", monthly, months });
  }
  return out;
}

/** Optus lists one card per model: the base storage's repayment ("from"). */
export async function scrapeOptus(): Promise<RawOffer[]> {
  const BASE = "https://www.optus.com.au";
  const html = await get(`${BASE}/mobile/phones`);
  const out = new Map<string, RawOffer>();
  for (const node of walk(jsonLd(html))) {
    if (String(node["@type"]).toLowerCase() !== "product" || !node.offers) continue;
    const offer = (node.offers as Record<string, unknown>[])[0];
    const spec = offer?.priceSpecification as Record<string, unknown> | undefined;
    const monthly = num(spec?.price as string);
    const months = num((spec?.eligibleQuantity as Record<string, string>)?.value) || 36;
    const total = num(offer?.price as string) || Math.round(monthly * months * 100) / 100;
    const name = String(node.name ?? "");
    if (!monthly || !name || /watch|tab|ipad|modem|router/i.test(name)) continue;
    const url = String(node.url ?? `${BASE}/mobile/phones`);
    out.set(url, { retailer: "optus", sku: url, title: name, url, price: total, image: abs(BASE, node.image as string), inStock: !/OutOfStock/i.test(String(offer.availability)), kind: "plan", monthly, months, fromPrice: true });
  }
  return [...out.values()];
}

/** Vodafone: listing gives product links; each product page's JSON-LD has the device price. */
export async function scrapeVodafone(): Promise<RawOffer[]> {
  const BASE = "https://www.vodafone.com.au";
  // The listing renders client-side; the product sitemap has every phone.
  const xml = await get(`${BASE}/sitemap-product-details.xml`);
  const links = [...new Set([...xml.matchAll(/vodafone\.com\.au(\/mobile\/mobile-phones\/[a-z0-9-]+\/[a-z0-9-]+)<\/loc>/g)].map((m) => m[1]))];
  const out: RawOffer[] = [];
  for (const path of links.slice(0, 60)) {
    try {
      const page = await get(BASE + path);
      for (const node of walk(jsonLd(page))) {
        if (String(node["@type"]).toLowerCase() !== "product") continue;
        const offer = (Array.isArray(node.offers) ? node.offers[0] : node.offers) as Record<string, unknown> | undefined;
        const price = num(offer?.price as string);
        const name = String(node.name ?? "");
        if (!price || !name) continue;
        const brand = typeof node.brand === "object" ? String((node.brand as Record<string, string>).name ?? "") : String(node.brand ?? "");
        const img0 = Array.isArray(node.image) ? node.image[0] : node.image;
        const image = typeof img0 === "string" ? img0 : (img0 as Record<string, string> | undefined)?.["@id"] ?? (img0 as Record<string, string> | undefined)?.url;
        const months = 36;
        out.push({ retailer: "vodafone", sku: path, title: /^(apple|samsung|google|oppo|motorola|nokia|honor|xiaomi|tcl|nothing|iphone|galaxy|pixel|moto|razr)\b/i.test(name) ? name : `${typeof node.manufacturer === "string" ? node.manufacturer : brand} ${name}`, url: BASE + path, price, image: abs(BASE, image), inStock: !/OutOfStock/i.test(String(offer?.availability ?? "")), kind: "plan", monthly: Math.round((price / months) * 100) / 100, months, fromPrice: true });
        break;
      }
    } catch {}
    await sleep(500);
  }
  return out;
}

export async function scrapeAmaysim(): Promise<RawOffer[]> {
  const BASE = "https://www.amaysim.com.au";
  const html = await get(`${BASE}/devices/phones`);
  const out: RawOffer[] = [];
  for (const card of html.split(/<article\b/).slice(1)) {
    const c = card.slice(0, 6000);
    const a = (k: string) => c.match(new RegExp(`data-${k}="([^"]*)"`))?.[1];
    // data-discount-price can depend on taking a plan, so we compare the full price.
    const price = num(a("price"));
    const rrp = 0;
    const href = a("href");
    const name = decodeEntities(c.match(/<h[23][^>]*>([^<]+)</)?.[1] ?? c.match(/alt="([^"]+)"/)?.[1] ?? "").trim();
    if (!price || !href || !name) continue;
    const img = c.match(/<img[^>]*src="([^"]+)"/)?.[1];
    // Cards carry no storage: the price is the base model's.
    out.push({ retailer: "amaysim", sku: href, title: name, url: abs(BASE, href)!, price, wasPrice: rrp > price ? rrp : undefined, image: abs(BASE, img), inStock: true, fromPrice: true });
  }
  return out;
}

// ---- Retailers ---------------------------------------------------------------

export async function scrapeTeleChoice(): Promise<RawOffer[]> {
  const out: RawOffer[] = [];
  for (let page = 1; page <= 5; page++) {
    const items = await getJson<{ name: string; permalink: string; id: number; is_in_stock: boolean; images: { src: string }[]; prices: { price: string; regular_price: string; minor_unit: number } }[]>(
      `https://telechoice.com.au/wp-json/wc/store/v1/products?category=32&per_page=100&page=${page}`,
    );
    for (const p of items) {
      const div = 10 ** (p.prices.minor_unit ?? 2);
      const price = Number(p.prices.price) / div;
      const reg = Number(p.prices.regular_price) / div;
      const title = decodeEntities(p.name).replace(/\b([A-Z])([A-Z]+)\b/g, (w, a, b) => (/^(\d|GB|TB|5G|4G|SE|FE|XL)/.test(w) ? w : a + b.toLowerCase()));
      if (!price || !looksLikePhone(title)) continue;
      out.push({ retailer: "telechoice", sku: String(p.id), title, url: p.permalink, price, wasPrice: reg > price ? reg : undefined, image: p.images[0]?.src, inStock: p.is_in_stock });
    }
    if (items.length < 100) break;
    await sleep(600);
  }
  return out;
}

/** Umart and MSY share a platform and category id. */
async function scrapeUmartLike(retailer: "umart" | "msy", BASE: string): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (let page = 1; page <= 15; page++) {
    const html = await get(`${BASE}/mobile-phones-digital/mobile-phone-1406?page=${page}`);
    let added = 0;
    for (const tile of html.split('class="goods_name"').slice(1)) {
      const t = tile.slice(0, 5000);
      const link = t.match(/<a href="([^"]+)" title="([^"]+)"/);
      // Member-deal carousels can carry a masked price ("XX.60") before the real one.
      const price = num(t.match(/goods_price_section[\s\S]*?itemprop="price" content="([^"]+)"/)?.[1] ?? t.match(/itemprop="price" content="([^"]+)"/)?.[1]);
      if (!link || !price || price < 20) continue;
      const title = decodeEntities(link[2]).replace(/\s*\([A-Z0-9/-]{5,}\)\s*$/, "");
      if (out.has(link[1]) || !looksLikePhone(title)) continue;
      const before = html.slice(Math.max(0, html.indexOf(tile) - 2500), html.indexOf(tile));
      const img = [...before.matchAll(/<img[^>]*src="([^"]+)"/g)].at(-1)?.[1];
      out.set(link[1], { retailer, sku: link[1], title, url: abs(BASE, link[1])!, price, image: img, inStock: /In Stock/i.test(t) });
      added++;
    }
    if (!added) break;
    await sleep(700);
  }
  return [...out.values()];
}
export const scrapeUmart = () => scrapeUmartLike("umart", "https://www.umart.com.au");
export const scrapeMsy = () => scrapeUmartLike("msy", "https://www.msy.com.au");

/** Costco (SAP storefront): server-rendered tiles, image link then price. */
export async function scrapeCostco(): Promise<RawOffer[]> {
  const BASE = "https://www.costco.com.au";
  const out = new Map<string, RawOffer>();
  for (let page = 0; page < 6; page++) {
    const html = await get(`${BASE}/Electronics/Mobile-Phones/c/cos_22.10?currentPage=${page}`);
    let added = 0;
    for (const tile of html.split(/(?=<a[^>]*href="\/Electronics\/Mobile-Phones\/[^"]*\/p\/\d+"><sip-primary-image)/).slice(1)) {
      const t = tile.slice(0, 15000);
      const url = t.match(/href="([^"]+)"/)?.[1];
      const title = decodeEntities(t.match(/alt="([^"]+)"/)?.[1] ?? "").replace(/\s+SM-?[A-Z0-9]{6,}$/i, "");
      const price = num(t.match(/\$\s*([\d,]+\.\d\d)/)?.[1]);
      if (!url || !price || out.has(url) || !looksLikePhone(title)) continue;
      const img = t.match(/<img[^>]*src="([^"]+)"/)?.[1];
      out.set(url, { retailer: "costco", sku: url.split("/p/")[1] ?? url, title, url: BASE + url, price, image: abs(BASE, img), inStock: !/out of stock/i.test(t) });
      added++;
    }
    if (!added) break;
    await sleep(800);
  }
  return [...out.values()];
}

export const scrapeDigiDirect = () => scrapeShopify("digidirect", "https://www.digidirect.com.au", ["apple-iphones", "android-phones"]);
export const scrapeBetta = () =>
  scrapeShopify("betta", "https://betta.com.au", ["mobile-devices", "iphone"], (t) => !/modem|home phone|cordless|senior/i.test(t));
export const scrapeMwave = () => scrapeShopify("mwave", "https://www.mwave.com.au", ["audio-and-electronics-mobile-phones"]);
