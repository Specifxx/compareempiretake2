/**
 * ECOVACS AU (ecovacs.com/au): DEEBOT robot vacuums.
 * The shop listing (/au/shop/deebot-robotic-vacuum-cleaner?page=N) server-renders `"productData":{"page_data":…,
 * "list":[{name, price, origin_price, goods_type, model, alias, store_num, can_add_cart, image}]}`.
 * Bundles (goods_type "package", "… & Accessories Bundle", "+ …") are skipped; mpn = ECOVACS model (e.g. "T50 PRO").
 */
import type { CategoryId, RawOffer, RetailerId } from "../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../lib/http";

const LISTING = "https://www.ecovacs.com/au/shop/deebot-robotic-vacuum-cleaner";

type Item = {
  name: string;
  price?: number;
  origin_price?: number | null;
  goods_type?: string;
  model?: string;
  sku?: string;
  alias?: string;
  store_num?: number;
  can_add_cart?: string | boolean;
  image?: string;
};

async function robotVacuums(): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (let page = 1; page <= 20; page++) {
    const html = await get(`${LISTING}?page=${page}`);
    const i = html.indexOf('"productData":');
    if (i < 0) break;
    let data: { page_data: { total_page: number }; list: Item[] };
    try {
      data = JSON.parse(extractObject(html, i + 14)) as typeof data;
    } catch {
      break;
    }
    for (const x of data.list) {
      const name = decodeEntities(x.name ?? "").replace(/\s+/g, " ").trim();
      if (!x.price || !x.alias || x.goods_type === "package" || /bundle| \+ |&|kit\b|accessor|mop(ping)? pad|filter|brush|solution|bag|refurb/i.test(name)) continue;
      if (!/deebot/i.test(name)) continue;
      const model = x.model?.split(",")[0]?.trim();
      out.set(x.alias, {
        retailer: "ecovacs" as RetailerId,
        sku: x.sku || x.alias,
        mpn: model || undefined,
        brand: "ECOVACS",
        title: /^ecovacs/i.test(name) ? name : `ECOVACS ${name}`,
        url: `${LISTING}/${x.alias}`,
        price: x.price,
        wasPrice: x.origin_price && x.origin_price > x.price ? x.origin_price : undefined,
        image: x.image,
        inStock: (x.store_num ?? 0) > 0 && x.can_add_cart !== "N" && x.can_add_cart !== false,
      });
    }
    if (page >= data.page_data.total_page) break;
    await sleep(1000);
  }
  return [...out.values()];
}

/** Returns the JSON object text starting at `from` (brace matching, strings respected). */
function extractObject(s: string, from: number): string {
  let depth = 0, inStr = false;
  for (let j = from; j < s.length; j++) {
    const c = s[j];
    if (inStr) {
      if (c === "\\") j++;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return s.slice(from, j + 1);
  }
  throw new Error("unterminated object");
}

export const scrapers: Partial<Record<Exclude<CategoryId, "phones">, () => Promise<RawOffer[]>>> = {
  "robot-vacuums": robotVacuums,
};
