/**
 * Harris Scarfe (harrisscarfe.com.au): a department store with a small-appliance floor. SAP Commerce: each category
 * page server-renders 18 product cards (`class="product-card item itemcontainer"`), each carrying the product's JSON
 * (name, url ending in its code, `price` with `fromPrice`/`regPrice`/`fromRegPrice` and the members-only `vipPrice`,
 * `inStock`) and `itemprop` image/name tags; `?page=N` (0-based) for the next page. The price compared is the one
 * every shopper pays, never the "Friends" club price. Probed from GitHub Actions 2026-11-04.
 */
import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../lib/http";
import { classify } from "../auto-shopify";

const BASE = "https://www.harrisscarfe.com.au";

const PATHS: Partial<Record<CategoryId, string[]>> = {
  "air-fryers": ["/en-au/c/air-fryers"],
  "coffee-machines": ["/en-au/c/coffee-machines-accessories"],
  "small-kitchen": ["/en-au/c/kitchen-appliances"],
  vacuums: ["/en-au/c/vacuums", "/en-au/c/stick-vacuums"],
  "robot-vacuums": ["/en-au/c/vacuums"],
  speakers: ["/en-au/c/audiovisual"],
  headphones: ["/en-au/c/audiovisual"],
  "hair-care": ["/en-au/c/hair-care", "/en-au/c/hair-styling-tools"],
};
const CATS = Object.keys(PATHS) as CategoryId[];

const money = (s: string | undefined) => {
  const n = Number((s ?? "").replace(/[^0-9.]/g, ""));
  return n > 0 ? n : undefined;
};

function cards(html: string): RawOffer[] {
  const out: RawOffer[] = [];
  for (const card of html.split(/class="product-card item itemcontainer"/).slice(1)) {
    const url = card.match(/"variantUrl":"([^"]+)"/)?.[1] ?? card.match(/data-bv-redirect-url="([^"]+)"/)?.[1] ?? card.match(/href="([^"]*\/p\/[^"]+)"/)?.[1];
    const name = card.match(/data-product-name="([^"]+)"/)?.[1] ?? card.match(/"name":"((?:[^"\\]|\\.)+)"/)?.[1];
    const priceBlock = card.match(/"price":\{([^}]*)\}/)?.[1] ?? "";
    const f = (k: string) => money(priceBlock.match(new RegExp(`"${k}":"([^"]*)"`))?.[1]);
    const reg = f("regPrice") ?? f("fromRegPrice");
    const sale = f("fromPrice");
    const price = sale ?? reg;
    const code = url?.match(/\/([A-Z]{1,3}\d{4,}[A-Za-z0-9-]*)$/)?.[1];
    if (!url || !name || !price || !code) continue;
    out.push({
      retailer: "harrisscarfe",
      sku: code,
      title: decodeEntities(name.replace(/\\"/g, '"').replace(/\\\//g, "/")).replace(/\s+/g, " ").trim(),
      url: new URL(url, BASE).href,
      price,
      wasPrice: reg && reg > price ? reg : undefined,
      image: card.match(/itemprop="image"[^>]*content="([^"]+)"/)?.[1],
      inStock: !/"inStock":false/.test(priceBlock),
    });
  }
  return out;
}

async function crawl(path: string, maxPages = 6): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (let p = 0; p < maxPages; p++) {
    let html: string;
    try {
      html = await get(`${BASE}${path}${p > 0 ? `?page=${p}` : ""}`);
    } catch {
      break;
    }
    let fresh = 0;
    for (const o of cards(html)) if (!out.has(o.sku)) (out.set(o.sku, o), fresh++);
    if (!fresh) break;
    await sleep(1200);
  }
  return [...out.values()];
}

async function scrape(cat: CategoryId): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (const path of PATHS[cat] ?? []) {
    for (const o of await crawl(path)) {
      const t = o.title;
      if (classify(CATS, t, o.price) === cat) out.set(o.sku, { ...o, mpn: t.match(/\b([A-Z]{1,4}[- ]?\d{3,5}[A-Z0-9]{0,4})\s*$/)?.[1]?.replace(/\s/g, "") });
    }
  }
  return [...out.values()];
}

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = Object.fromEntries(CATS.map((c) => [c, () => scrape(c)]));
