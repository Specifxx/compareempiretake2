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
import { readFileSync } from "node:fs";
import { Readable } from "node:stream";
import { createGunzip } from "node:zlib";
import type { CategoryId, RawOffer, RetailerId } from "../../src/lib/types";
import { RETAILERS } from "../../src/lib/retailers";
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
  // Per field, the column whose name comes FIRST in that field's list wins, whatever the column order: an Awin feed
  // carries both aw_deep_link (tracked, pays) and merchant_deep_link (the bare store page), and the bare one must
  // never win because the advertiser's columns happened to come in another order (2026-11-06).
  const keys = header.map((h) => h.trim().toLowerCase().replace(/^g:/, "").replace(/^"|"$/g, ""));
  const best = new Map<Field, { col: number; rank: number }>();
  keys.forEach((key, col) => {
    for (const [field, names] of Object.entries(FIELDS) as [Field, readonly string[]][]) {
      const rank = names.indexOf(key);
      if (rank < 0) continue;
      const cur = best.get(field);
      if (!cur || rank < cur.rank) best.set(field, { col, rank });
    }
  });
  const pick = new Map<number, Field>();
  // One field per column: a column claimed by an earlier field in FIELDS keeps that field.
  for (const field of Object.keys(FIELDS) as Field[]) {
    const b = best.get(field);
    if (b && !pick.has(b.col)) pick.set(b.col, field);
  }
  return new Map([...pick].sort((a, b) => a[0] - b[0]));
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

// ---- Awin: one key, every joined chain's feed (2026-11-06) ----
//
// Awin publishes a joined advertiser's product feed under the publisher's ONE datafeed key (Toolbox → Create-a-Feed
// shows it inside every feed link: .../datafeed/download/apikey/<key>/...). With that key as the secret
// AWIN_DATAFEED_KEY, a feed-gated store whose site is a JOINED advertiser in data/awin/programmes.json (written daily
// by the Awin programmes job) reads its feed with no secret of its own: an approval switches the store on the next
// morning, with no step by hand. A FEED_URL_* secret still wins when it exists.

const AWIN_COLUMNS = [
  "aw_deep_link", "product_name", "aw_product_id", "merchant_product_id", "merchant_image_url", "search_price",
  "rrp_price", "currency", "brand_name", "ean", "mpn", "model_number", "in_stock", "condition",
].join(",");

const bare = (h: string) => h.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");

/** The joined Awin advertiser whose domains include `site` (data/awin/programmes.json), or undefined. Exported for tests. */
export function awinAdvertiser(site: string | undefined, joined?: { id: number; domains: string[] }[]): number | undefined {
  if (!site) return undefined;
  let list = joined;
  if (!list) {
    try {
      list = (JSON.parse(readFileSync(`${process.cwd()}/data/awin/programmes.json`, "utf8")) as { joined?: { id: number; domains: string[] }[] }).joined ?? [];
    } catch {
      list = [];
    }
  }
  const want = bare(site);
  return list.find((p) => p.domains.some((d) => bare(d) === want || bare(d).endsWith(`.${want}`)))?.id;
}

/**
 * The download link for an advertiser's feed, from Awin's feed list (CSV, one row per feed of the publisher's joined
 * advertisers, with a ready download URL). The largest feed wins; our columns replace the list's default ones so
 * brand, EAN, MPN, stock and currency come with every row. Exported for tests.
 */
export function awinFeedLink(listCsv: string, advertiser: number, key: string): string | undefined {
  const lines = listCsv.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return undefined;
  const head = scanDelimited(lines[0], ",").cells.map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => head.findIndex((h) => names.includes(h));
  const [adv, fid, count, url, status] = [col("advertiser id"), col("feed id"), col("no of products", "number of products", "products"), col("url"), col("membership status")];
  if (adv < 0 || fid < 0) return undefined;
  const feeds = lines
    .slice(1)
    .map((l) => scanDelimited(l, ",").cells)
    .filter((c) => Number(c[adv]) === advertiser && (status < 0 || /^\s*(active|joined)\s*$/i.test(c[status] ?? "")))
    .sort((a, b) => Number(b[count] ?? 0) - Number(a[count] ?? 0));
  const best = feeds[0];
  if (!best) return undefined;
  const ready = url >= 0 ? best[url]?.trim() : "";
  if (ready && /^https:\/\/productdata\.awin\.com\//.test(ready)) {
    return /\/columns\/[^/]+/.test(ready) ? ready.replace(/\/columns\/[^/]+/, `/columns/${AWIN_COLUMNS}`) : ready.replace(/\/format\//, `/columns/${AWIN_COLUMNS}/format/`);
  }
  return `https://productdata.awin.com/datafeed/download/apikey/${key}/language/en/fid/${best[fid]}/columns/${AWIN_COLUMNS}/format/csv/delimiter/%2C/compression/gzip/`;
}

let awinList: Promise<string> | undefined;
async function awinUrl(key: string, advertiser: number): Promise<string> {
  awinList ??= fetch(`https://productdata.awin.com/datafeed/list/apikey/${key}`, { signal: AbortSignal.timeout(60_000) }).then((r) => {
    if (!r.ok) throw new Error(`Awin feed list ${r.status}`);
    return r.text();
  });
  const link = awinFeedLink(await awinList, advertiser, key);
  if (!link) throw new Error(`Awin advertiser ${advertiser}: joined, but no feed in the feed list yet`);
  return link;
}

/** The `scrapers` export of a feed-fed store file: empty until its secret exists, or its chain has joined us on Awin. */
export function feedStore(s: FeedStore): Partial<Record<CategoryId, () => Promise<RawOffer[]>>> {
  const direct = process.env[s.env];
  const key = process.env.AWIN_DATAFEED_KEY;
  const advertiser = !direct && key ? awinAdvertiser(RETAILERS[s.retailer]?.site) : undefined;
  if (!direct && !advertiser) return {};
  const url = direct ? Promise.resolve(direct) : awinUrl(key!, advertiser!);
  let all: Promise<Map<CategoryId, RawOffer[]>> | undefined;
  return Object.fromEntries(s.cats.map((c) => [c, async () => (await (all ??= url.then((u) => readFeed(s, u)))).get(c) ?? []]));
}
