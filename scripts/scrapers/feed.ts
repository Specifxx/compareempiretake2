/**
 * Affiliate-network product feeds: the only door into the big chains that wall off every request from a server
 * (Officeworks, Big W, Kogan, Bing Lee, Currys, Argos, AO, John Lewis, Walmart, Target US…: see docs/stores/big-stores.md).
 * Every network (Commission Factory, Awin, Impact, CJ, Partnerize, Rakuten, FlexOffers) hands an approved
 * publisher a daily product file (CSV, TSV or Google Shopping XML, often gzipped) with title, link, price, brand,
 * MPN, GTIN, stock and condition. A store file is one line: `feedStore({ retailer, env: "FEED_URL_OFFICEWORKS",
 * currency: "AUD", cats })`. The URL lives in a GitHub secret named by `env` and passed by refresh-prices.yml; until it
 * exists the store exports no scrapers, so the runner skips it (no FAILED line, no yesterday's file to keep).
 *
 * Rows are streamed (a chain's feed can be hundreds of thousands of rows) and go through the SAME title checks as every
 * scraped store (`classify` from auto-shopify.ts), one offer per row; a feed priced in another currency is refused,
 * never converted. Links are the network's tracking links, used as given.
 */
import { Readable } from "node:stream";
import { createGunzip } from "node:zlib";
import type { CategoryId, RawOffer, RetailerId } from "../../src/lib/types";
import { decodeEntities } from "../lib/http";
import { classify } from "./auto-shopify";
import { setFromTitle } from "./lego";

/** Header spellings across Google Shopping, Commission Factory, Awin, Impact, CJ, Partnerize and Rakuten feeds. */
const FIELDS = {
  id: ["id", "sku", "product id", "product_id", "productid", "unique merchant sku", "aw_product_id", "merchant_product_id", "catalog item id", "product sku", "offer id"],
  title: ["title", "product name", "product_name", "name", "productname", "item name"],
  link: ["link", "product url", "url", "aw_deep_link", "merchant_deep_link", "buy url", "producturl", "tracking url", "deeplink", "deep link", "click url", "buyurl"],
  price: ["price", "current price", "search_price", "retail price", "original price", "rrp", "regular price", "store_price", "product price", "base price"],
  salePrice: ["sale_price", "sale price", "saleprice", "discount price", "special price", "promo price"],
  availability: ["availability", "stock availability", "in_stock", "stock status", "stock", "instock", "stock_status", "stockavailability", "in stock"],
  condition: ["condition", "product condition", "productcondition"],
  gtin: ["gtin", "upc", "ean", "product_gtin", "upc or ean", "barcode", "isbn"],
  mpn: ["mpn", "manufacturer part number", "model_number", "mfr part number", "model", "model number", "product_model", "part number", "manufacturer model number"],
  currency: ["currency", "currency_code", "currencycode", "price currency", "currency code"],
  image: ["image_link", "image link", "image url", "image_url", "aw_image_url", "merchant_image_url", "imageurl", "large_image", "image", "product image"],
  brand: ["brand", "brand_name", "manufacturer", "brandname", "product brand"],
} as const;
type Field = keyof typeof FIELDS;
export type FeedRow = Partial<Record<Field, string>>;

export function headerMap(header: string[]): Map<number, Field> {
  const m = new Map<number, Field>();
  const taken = new Set<Field>();
  header.forEach((h, i) => {
    const key = h.trim().toLowerCase().replace(/^g:/, "").replace(/^"|"$/g, "");
    for (const [field, names] of Object.entries(FIELDS) as [Field, readonly string[]][]) {
      if (names.includes(key) && !taken.has(field)) {
        m.set(i, field);
        taken.add(field);
        break;
      }
    }
  });
  return m;
}

/** One delimited line → cells, with "quoted, cells" and "" escapes; `open` when the text ends inside a quoted cell. */
export function scanDelimited(line: string, delim: string): { cells: string[]; open: boolean } {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') (cur += '"'), i++;
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"' && cur === "") q = true;
    else if (ch === delim) out.push(cur), (cur = "");
    else cur += ch;
  }
  out.push(cur);
  return { cells: out, open: q };
}

/** The body as text pieces: the lines of a CSV/TSV, or one piece per <item>/<entry> of a Google Shopping XML. */
async function* pieces(stream: Readable): AsyncGenerator<{ xml: boolean; text: string }> {
  let buf = "";
  let xml: boolean | null = null;
  for await (const chunk of stream.setEncoding("utf8")) {
    buf += chunk;
    if (xml === null) {
      if (buf.trimStart().length < 5) continue;
      xml = /^\s*<(\?xml|rss|feed|products)/.test(buf);
    }
    let from = 0;
    for (const m of buf.matchAll(xml ? /<\/(?:item|entry|product)>/g : /\r?\n|\r(?!\n|$)/g)) {
      yield { xml, text: buf.slice(from, xml ? m.index + m[0].length : m.index) };
      from = m.index + m[0].length;
    }
    buf = buf.slice(from);
  }
  if (buf.trim()) yield { xml: xml ?? false, text: buf };
}

/** A feed body → rows, whatever its format (gzip is sniffed from the magic bytes). Exported for tests. */
export async function* feedRows(input: ReadableStream<Uint8Array>): AsyncGenerator<FeedRow> {
  const [probe, body] = input.tee();
  const reader = probe.getReader();
  const { value: head } = await reader.read();
  void reader.cancel();
  let stream = Readable.fromWeb(body as import("node:stream/web").ReadableStream);
  if (head?.[0] === 0x1f && head[1] === 0x8b) stream = stream.pipe(createGunzip());

  let header: Map<number, Field> | null = null;
  let delim = ",";
  let pending = "";
  for await (const { xml, text: raw } of pieces(stream)) {
    if (xml) {
      const start = raw.search(/<(item|entry|product)\b/);
      if (start < 0) continue;
      const item: FeedRow = {};
      for (const m of raw.slice(raw.indexOf(">", start) + 1).matchAll(/<(?:g:)?([a-z_]+)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:g:)?\1>/g)) {
        const field = (Object.entries(FIELDS) as [Field, readonly string[]][]).find(([, names]) => names.includes(m[1]))?.[0];
        if (field && !item[field]) item[field] = decodeEntities(m[2]).trim();
      }
      yield item;
      continue;
    }
    if (header === null) {
      if (!raw.trim()) continue;
      delim = raw.includes("\t") ? "\t" : raw.includes("|") && !raw.includes(",") ? "|" : ",";
      header = headerMap(scanDelimited(raw, delim).cells);
      continue;
    }
    pending = pending ? `${pending}\n${raw}` : raw;
    const { cells, open } = scanDelimited(pending, delim);
    if (open) continue;
    pending = "";
    const row: FeedRow = {};
    for (const [i, field] of header) row[field] = cells[i]?.trim();
    yield row;
  }
}

/** "1299.00 AUD" → "AUD"; "£1,299" → "GBP"; null when the price names no currency. */
export function priceCurrency(v: string | undefined): string | null {
  if (!v) return null;
  const m = v.match(/(?:^|[\d\s])([A-Z]{3})\b/) ?? v.match(/\b([A-Z]{3})\s*\d/);
  if (m) return m[1];
  if (v.includes("£")) return "GBP";
  if (v.includes("€")) return "EUR";
  return null;
}

const money = (v: string | undefined): number => {
  if (!v) return 0;
  const n = Number(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const NOT_NEW = /refurb|renewed|re-?certified|open[- ]?box|pre-?owned|\bused\b|ex-?demo|b-?stock|grade [abc]\b/i;
export const inStock = (v: string | undefined) => !v || /^(in.?stock|yes|true|y|1|available|limited|preorder|pre-order)/i.test(v.trim());

export interface FeedStore {
  retailer: RetailerId;
  /** The GitHub secret holding the feed URL (`FEED_URL_<STORE>`), passed to the job by refresh-prices.yml. */
  env: string;
  /** The region's currency; a row naming another is dropped. */
  currency: "AUD" | "USD" | "GBP" | "CAD" | "SGD";
  /** In priority order: a row goes to the first category whose checks it passes. */
  cats: readonly CategoryId[];
  /** Extra titles to refuse (marketplace sellers, a chain's own bundle wording). */
  exclude?: RegExp;
}

/** Exported for tests: rows → offers per category, with every title and price rule applied. */
export function rowsToOffers(s: FeedStore, rows: Iterable<FeedRow>): Map<CategoryId, RawOffer[]> {
  const out = new Map<CategoryId, Map<string, RawOffer>>();
  for (const r of rows) {
    const title = decodeEntities(r.title ?? "").replace(/[®™]/g, "").replace(/\s+/g, " ").trim();
    const link = r.link?.trim();
    if (!title || !link || !/^https?:\/\//.test(link)) continue;
    if (NOT_NEW.test(title) || (r.condition && !/^\s*(new|brand new)?\s*$/i.test(r.condition)) || s.exclude?.test(title)) continue;
    const named = r.currency?.trim().toUpperCase() || priceCurrency(r.salePrice || r.price);
    if (named && named !== s.currency) continue;
    const sale = money(r.salePrice);
    const full = money(r.price);
    const price = sale > 0 && (!full || sale < full) ? sale : full;
    if (!price || price >= 9999) continue;
    const brand = r.brand?.trim();
    const cat = classify(s.cats, title, price, brand);
    if (!cat) continue;
    const set = cat === "lego" ? setFromTitle(title) : undefined;
    if (cat === "lego" && !set) continue;
    const id = (r.id ?? "").trim() || link;
    const image = r.image?.trim();
    const offer: RawOffer = {
      retailer: s.retailer,
      sku: id,
      title: cat === "lego" && !/\blego\b/i.test(title) ? `LEGO ${title}` : title,
      url: link,
      price,
      wasPrice: full > price ? full : undefined,
      image: image && /^https?:\/\//.test(image) ? image : undefined,
      inStock: inStock(r.availability),
      preorder: /pre-?order/i.test(r.availability ?? "") || undefined,
      brand: cat === "lego" ? "LEGO" : brand && !/^(n\/a|none|unknown|-)$/i.test(brand) ? brand : undefined,
      mpn: set ?? (r.mpn?.trim() || undefined),
    };
    if (!out.has(cat)) out.set(cat, new Map());
    out.get(cat)!.set(id, offer);
  }
  return new Map([...out].map(([c, m]) => [c, [...m.values()]]));
}

async function readFeed(s: FeedStore, url: string): Promise<Map<CategoryId, RawOffer[]>> {
  const res = await fetch(url, { headers: { "user-agent": "CompareEmpire/1.0 (+https://compareempire.com)" }, signal: AbortSignal.timeout(300_000) });
  if (!res.ok || !res.body) throw new Error(`feed ${res.status}`);
  // Rows are kept only after the title checks, so a 400k-row chain feed never sits in memory whole.
  const out = new Map<CategoryId, RawOffer[]>();
  let batch: FeedRow[] = [];
  const flush = () => {
    for (const [c, offers] of rowsToOffers(s, batch)) out.set(c, [...(out.get(c) ?? []), ...offers]);
    batch = [];
  };
  for await (const r of feedRows(res.body)) {
    batch.push(r);
    if (batch.length >= 2000) flush();
  }
  flush();
  // Dedupe by id across batches (a feed may list a SKU twice).
  for (const [c, offers] of out) out.set(c, [...new Map(offers.map((o) => [o.sku, o])).values()]);
  return out;
}

/** The `scrapers` export of a feed-fed store file: empty until its secret exists. */
export function feedStore(s: FeedStore): Partial<Record<CategoryId, () => Promise<RawOffer[]>>> {
  const url = process.env[s.env];
  if (!url) return {};
  let all: Promise<Map<CategoryId, RawOffer[]>> | undefined;
  return Object.fromEntries(s.cats.map((c) => [c, async () => (await (all ??= readFeed(s, url))).get(c) ?? []]));
}
