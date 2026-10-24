/**
 * HP UK store (hp.com/gb-en/shop, Magento PWA): laptops, desktops, monitors and printers.
 * The storefront's own public GraphQL endpoint (GET /gb-en/shop/graphql, no key) lists each top-level category
 * (Laptops "Mw==", Desktops "NA==", Monitors "Ng==", Printers "Nw==") with sku = HP product number (e.g. D37HYEA#ABU),
 * name, url_key, stock_status and price_range (GBP; final_price is the "Incl. VAT" price the product page shows).
 * Refurbished units, accessories and care packs are dropped by name.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../../lib/http";

const GQL = "https://www.hp.com/gb-en/shop/graphql";

type Item = {
  sku: string;
  name: string;
  url_key: string;
  stock_status?: string;
  small_image?: { url?: string };
  price_range?: { minimum_price?: { final_price?: { value?: number }; regular_price?: { value?: number } } };
};

async function category(uid: string): Promise<Item[]> {
  const out: Item[] = [];
  for (let page = 1; page <= 20; page++) {
    const q = `{products(filter:{category_uid:{eq:"${uid}"}},pageSize:100,currentPage:${page}){total_count items{sku name url_key stock_status small_image{url} price_range{minimum_price{final_price{value} regular_price{value}}}}}}`;
    const d = JSON.parse(await get(`${GQL}?query=${encodeURIComponent(q)}`)) as { data?: { products?: { total_count: number; items: Item[] } } };
    const p = d.data?.products;
    if (!p) throw new Error("HP GraphQL: no products");
    out.push(...p.items);
    if (page * 100 >= p.total_count || !p.items.length) break;
    await sleep(1000);
  }
  return out;
}

const ACCESSORY = /\b(bag|backpack|sleeve|case|mouse|keyboard|dock|adapter|charger|pen|stand|arm|mount|cable|headset|speaker|care ?pack|warranty|ink|toner|cartridge|paper)\b/i;

async function scrape(uid: string, keep: (n: string) => boolean): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (const it of await category(uid)) {
    const name = decodeEntities(it.name ?? "").replace(/[™®]/g, "").replace(/\s+/g, " ").replace(/ ,/g, ",").trim();
    const price = it.price_range?.minimum_price?.final_price?.value;
    const was = it.price_range?.minimum_price?.regular_price?.value;
    if (!name || !price || out.has(it.sku) || /refurb|renewed|open.?box/i.test(name) || /R(#|$)/.test(it.sku) || !keep(name)) continue;
    out.set(it.sku, {
      retailer: "uk-hp",
      sku: it.sku,
      mpn: it.sku,
      brand: "HP",
      title: name,
      url: `https://www.hp.com/gb-en/shop/${it.url_key}`,
      price,
      wasPrice: was && was > price ? was : undefined,
      image: it.small_image?.url,
      inStock: it.stock_status === "IN_STOCK",
    });
  }
  return [...out.values()];
}

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  laptops: () => scrape("Mw==", (n) => /laptop|chromebook|notebook|omnibook|elitebook|probook|zbook|omen|victus|spectre|envy|pavilion|2-in-1/i.test(n) && !ACCESSORY.test(n)),
  desktops: () => scrape("NA==", (n) => !ACCESSORY.test(n) && !/\bmonitor\b(?!.*(desktop|all-in-one))/i.test(n)),
  monitors: () => scrape("Ng==", (n) => /monitor|display/i.test(n) && !/\b(arm|mount|stand|cable|adapter|speaker|webcam)\b/i.test(n.replace(/height.adjustable stand|stand-?alone/gi, ""))),
  printers: () => scrape("Nw==", (n) => /printer|laserjet|deskjet|officejet|envy|smart tank|designjet|scanjet|scanner|all-in-one/i.test(n) && !ACCESSORY.test(n)),
};
