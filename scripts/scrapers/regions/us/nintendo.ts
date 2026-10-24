/**
 * My Nintendo Store US (nintendo.com/us/store) — official store. The hardware pages server-render `__NEXT_DATA__` with
 * store products (name, sku, prices.finalPrice/regularPrice in USD, isSalableQty, hardwareType, artPath). Only
 * "Nintendo Switch systems" (consoles and console bundles) are kept; Nintendo shows no part number, so mpn stays empty.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { get, sleep } from "../../../lib/http";

const BASE = "https://www.nintendo.com/us/store";
type P = {
  name?: string;
  sku?: string;
  urlKey?: string;
  hardwareType?: string;
  isSalableQty?: boolean;
  artPath?: string;
  prices?: { currency?: string; finalPrice?: number; regularPrice?: number };
};

function* walk(o: unknown): Generator<Record<string, unknown>> {
  if (Array.isArray(o)) for (const x of o) yield* walk(x);
  else if (o && typeof o === "object") {
    yield o as Record<string, unknown>;
    for (const v of Object.values(o)) yield* walk(v);
  }
}

async function consoles(): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (const path of ["/hardware/", "/hardware/nintendo-switch-systems/"]) {
    let html: string;
    try {
      html = await get(`${BASE}${path}`);
    } catch {
      continue;
    }
    const i = html.indexOf('id="__NEXT_DATA__"');
    if (i < 0) continue;
    const data = JSON.parse(html.slice(html.indexOf(">", i) + 1, html.indexOf("</script>", i)));
    for (const n of walk(data) as Generator<P>) {
      if (!n.sku || !n.prices?.finalPrice || n.prices.currency !== "USD" || n.hardwareType !== "Nintendo Switch systems") continue;
      const title = (n.name ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
      if (!title || /refurb|controller|case|dock|stand/i.test(title)) continue;
      const was = n.prices.regularPrice ?? 0;
      out.set(n.sku, {
        retailer: "us-nintendo",
        sku: n.sku,
        brand: "Nintendo",
        title,
        url: `${BASE}/products/${n.urlKey}/`,
        price: n.prices.finalPrice,
        wasPrice: was > n.prices.finalPrice ? was : undefined,
        image: n.artPath ? `https://assets.nintendo.com/image/upload/f_auto/q_auto/w_960/${encodeURI(n.artPath)}` : undefined,
        inStock: n.isSalableQty !== false,
      });
    }
    await sleep(800);
  }
  return [...out.values()];
}

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = { consoles };
