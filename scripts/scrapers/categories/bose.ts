/**
 * Bose AU (bose.com.au, Salesforce Commerce Cloud): headphones, earbuds, speakers and soundbars.
 * Each category page (/c/…) carries a JSON-LD CollectionPage whose ItemList links every product page;
 * product pages carry a JSON-LD ProductGroup with one Product per colour (sku = Bose part number, e.g. 783342-0100),
 * price and availability. Newer product pages have no ProductGroup; they push a GA `view_item` dataLayer item
 * (item_name, item_variant colour, item_variant_id = Bose SKU, price, in_stock) for the selected colour, so we fetch
 * each `?dwvar_<id>_color=<COLOUR>` page. Several regional SKUs share a colour; we keep one per colour (in stock first).
 * Installed (in-wall/in-ceiling/outdoor wired), PA, amplifiers and accessories are skipped.
 */
import type { CategoryId, RawOffer, RetailerId } from "../../../src/lib/types";
import { decodeEntities, get, pool, sleep } from "../../lib/http";

const BASE = "https://www.bose.com.au";

function ld(html: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const [, body] of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const d = JSON.parse(body);
      out.push(...(Array.isArray(d) ? d : [d]));
    } catch {}
  }
  return out;
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
const JUNK = /refurb|renewed|cushion|ear ?tips|case|cable|adapter|charg|mount|bracket|stand|remote|battery|cover|kit|transmitter|amplifier|\bamp\b|in-?ceiling|in-?wall|environmental|virtually invisible|\bS1 Pro|L1 |\bF1\b|gift|bundle|\+/i;

async function crawl(paths: string[], keep: (name: string) => boolean): Promise<RawOffer[]> {
  const urls = new Set<string>();
  for (const p of paths) {
    const html = await get(`${BASE}/c/${p}?sz=96`);
    for (const n of ld(html)) {
      const items = ((n.mainEntity as Record<string, unknown> | undefined)?.itemListElement ?? []) as { url?: string }[];
      for (const it of items) if (it.url && !/refurb/i.test(it.url)) urls.add(it.url.split("?")[0]);
    }
    await sleep(900);
  }
  const res = await pool([...urls], 2, async (url) => {
    const out: RawOffer[] = [];
    try {
      const html = await get(url);
      await sleep(700);
      let grouped = false;
      for (const g of ld(html)) {
        if (g["@type"] !== "ProductGroup" && g["@type"] !== "Product") continue;
        grouped = true;
        const name = decodeEntities(String(g.name ?? "")).replace(/\s+/g, " ").trim();
        if (!name || JUNK.test(name) || !keep(name)) continue;
        const variants = (g["@type"] === "ProductGroup" ? g.hasVariant : [g]) as Record<string, unknown>[];
        for (const v of variants ?? []) {
          const o = (Array.isArray(v.offers) ? v.offers[0] : v.offers) as Record<string, unknown> | undefined;
          const price = Number(o?.price);
          if (!price || !v.sku) continue;
          const img = Array.isArray(v.image) ? v.image[0] : v.image;
          out.push(offer(name, v.color ? String(v.color) : undefined, String(v.sku), String(o?.url ?? url), price, typeof img === "string" ? img : undefined, /InStock|PreOrder|BackOrder/i.test(String(o?.availability ?? ""))));
        }
      }
      if (grouped) return out;
      const first = viewItem(html);
      if (!first || JUNK.test(first.item_name) || !keep(first.item_name)) return out;
      const colours = new Set([...html.matchAll(new RegExp(`dwvar_${first.item_id}_color=([A-Z0-9%]+)`, "g"))].map((m) => m[1]));
      const items = [{ it: first, url }];
      for (const c of colours) {
        if (decodeURIComponent(c) === first.item_variant) continue;
        const u = `${url}?dwvar_${first.item_id}_color=${c}`;
        try {
          const it = viewItem(await get(u));
          if (it) items.push({ it, url: u });
        } catch {}
        await sleep(600);
      }
      for (const { it, url: u } of items)
        if (it.price) out.push(offer(it.item_name, it.item_variant, it.item_variant_id, u, it.price, it.image_url, it.in_stock !== false));
    } catch {}
    return out;
  });
  // One offer per product+colour: regional/legacy SKUs repeat a colour; prefer the in-stock one.
  const best = new Map<string, RawOffer>();
  for (const o of res.flat()) {
    const k = o.title.toLowerCase();
    const cur = best.get(k);
    if (!cur || (!cur.inStock && o.inStock)) best.set(k, o);
  }
  return [...best.values()];
}

type ViewItem = { item_id: string; item_name: string; item_variant?: string; item_variant_id: string; price?: number; in_stock?: boolean; image_url?: string };
function viewItem(html: string): ViewItem | undefined {
  const m = html.match(/var dataLayers = (\[[\s\S]*?\]);\s/);
  if (!m) return undefined;
  try {
    const d = JSON.parse(m[1]) as { event?: string; ecommerce?: { items?: ViewItem[] } }[];
    return d.find((x) => x.event === "view_item")?.ecommerce?.items?.[0];
  } catch {
    return undefined;
  }
}

function offer(name: string, colour: string | undefined, sku: string, url: string, price: number, image: string | undefined, inStock: boolean): RawOffer {
  name = decodeEntities(name).replace(/\s+/g, " ").trim();
  return {
    retailer: "bose" as RetailerId,
    sku,
    mpn: sku,
    brand: "Bose",
    title: `${/^bose/i.test(name) ? name : `Bose ${name}`}${colour ? ` - ${titleCase(colour)}` : ""}`,
    url,
    price,
    image,
    inStock,
  };
}

export const scrapers: Partial<Record<Exclude<CategoryId, "phones">, () => Promise<RawOffer[]>>> = {
  headphones: () => crawl(["headphones", "earbuds"], (n) => /headphone|earbud|ultra open|quietcomfort|soundsport/i.test(n)),
  speakers: () => crawl(["speakers"], (n) => /speaker|soundlink|home speaker|lifestyle|portable/i.test(n) && !/soundbar/i.test(n)),
  soundbars: () => crawl(["home-theater/soundbars"], (n) => /soundbar|smart ultra|bass module|surround/i.test(n)),
};
