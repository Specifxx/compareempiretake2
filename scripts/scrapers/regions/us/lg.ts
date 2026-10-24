/**
 * LG US (lg.com/us) — official store. Each listing page server-renders a JSON-LD CollectionPage whose ItemList holds up
 * to 48 Products (name, sku = LG model code e.g. OLED65C6PUA, image, Offer price in USD + availability). One page shows
 * only 48, so we also read every sub-listing the page's `__NEXT_DATA__` categoryData links ("/us/oled-tvs", …) and union
 * by sku. Bundle SKUs ("A_B") and refurbished/open-box items are skipped.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../../lib/http";
import { NOT_NEW } from "./_shopify";

const BASE = "https://www.lg.com";
type LdProduct = { name?: string; sku?: string; image?: string; offers?: { url?: string; price?: string; availability?: string; itemCondition?: string } };

function parse(html: string): { products: LdProduct[]; subs: string[] } {
  const products: LdProduct[] = [];
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const d = JSON.parse(m[1]);
      for (const li of d?.mainEntity?.itemListElement ?? []) if (li?.item?.sku) products.push(li.item);
    } catch {
      /* not JSON */
    }
  }
  const subs: string[] = [];
  const i = html.indexOf('id="__NEXT_DATA__"');
  if (i >= 0) {
    try {
      const nd = JSON.parse(html.slice(html.indexOf(">", i) + 1, html.indexOf("</script>", i)));
      for (const v of nd?.props?.pageProps?.categoryData?.value ?? []) if (typeof v?.url === "string" && v.url.startsWith("/us/")) subs.push(v.url);
    } catch {
      /* ignore */
    }
  }
  return { products, subs };
}

async function listing(path: string, keep: (name: string) => boolean): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  const seen = new Set<string>();
  const queue = [path];
  while (queue.length) {
    const p = queue.shift()!;
    if (seen.has(p) || seen.size > 15) continue;
    seen.add(p);
    let html: string;
    try {
      html = await get(`${BASE}${p}`);
    } catch {
      continue;
    }
    const { products, subs } = parse(html);
    if (p === path) queue.push(...subs);
    for (const x of products) {
      const name = decodeEntities(x.name ?? "").replace(/\s+/g, " ").trim();
      const price = Number(x.offers?.price);
      if (!x.sku || x.sku.includes("_") || !name || !price || NOT_NEW.test(name) || !keep(name)) continue;
      if (x.offers?.itemCondition && !/NewCondition/.test(x.offers.itemCondition)) continue;
      out.set(x.sku, {
        retailer: "us-lg",
        sku: x.sku,
        mpn: x.sku,
        brand: "LG",
        title: name,
        url: x.offers?.url ?? `${BASE}${p}`,
        price,
        image: x.image,
        inStock: /InStock/i.test(x.offers?.availability ?? ""),
      });
    }
    await sleep(700);
  }
  return [...out.values()];
}

const NOT_ACC = (n: string) => !/\b(mount|bracket|stand|remote|cable|adapter|sleeve|case|bundle|kit)\b/i.test(n);

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  tvs: () => listing("/us/tvs", (n) => NOT_ACC(n) && /\btv\b/i.test(n) && !/projector/i.test(n)),
  monitors: () => listing("/us/monitors", (n) => NOT_ACC(n) && /monitor|ultra|display/i.test(n)),
  laptops: () => listing("/us/laptops", (n) => NOT_ACC(n) && /gram|laptop/i.test(n) && !/view|monitor/i.test(n)),
  soundbars: () => listing("/us/soundbars", (n) => NOT_ACC(n) && /sound ?bar/i.test(n) && !/subwoofer only|rear speaker kit/i.test(n)),
  speakers: () => listing("/us/speakers", (n) => NOT_ACC(n) && /speaker|xboom/i.test(n)),
};
