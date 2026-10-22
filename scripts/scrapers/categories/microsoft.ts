/**
 * Microsoft Store AU: Surface devices. The Surface store page lists products in a JSON-LD itemList; each
 * product page (/en-au/d/<slug>/<id>) has a JSON-LD AggregateOffer with one offer per configuration
 * ("Snapdragon X2 Plus (6 Core), Black, 16 GB RAM, 256 GB UFS"). Surface Laptop -> laptops, Surface Pro -> tablets.
 */
import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../lib/http";

function jsonLd(html: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const [, body] of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      out.push(JSON.parse(body));
    } catch {}
  }
  return out;
}

let cache: Promise<{ kind: "laptops" | "tablets"; offer: RawOffer }[]> | undefined;

async function all() {
  const index = await get("https://www.microsoft.com/en-au/store/b/surface");
  const items = new Map<string, string>();
  for (const n of jsonLd(index)) {
    if (String(n["@type"]).toLowerCase() !== "itemlist") continue;
    for (const li of (n.itemListElement as { name: string; url: string }[]) ?? []) items.set(li.url, li.name);
  }
  const out: { kind: "laptops" | "tablets"; offer: RawOffer }[] = [];
  for (const [url, listName] of items) {
    const kind = /surface laptop/i.test(listName) ? "laptops" : /surface pro|surface go/i.test(listName) ? "tablets" : undefined;
    if (!kind || /keyboard|pen|mouse|dock|case|charger|adapter|refurb/i.test(listName)) continue;
    let html: string;
    try {
      html = await get(url);
    } catch {
      continue;
    }
    const p = jsonLd(html).find((n) => n["@type"] === "Product");
    const agg = p?.offers as { offers?: { price?: number; disambiguatingDescription?: string; availability?: string }[] } | undefined;
    const name = decodeEntities(String(p?.name ?? listName)).replace(/\s+/g, " ").trim();
    for (const o of agg?.offers ?? []) {
      const desc = decodeEntities(o.disambiguatingDescription ?? "").replace(/[®™]/g, "").replace(/\s+/g, " ").trim();
      if (!o.price || !desc) continue;
      out.push({
        kind,
        offer: {
          retailer: "microsoft",
          sku: `${url.split("/").pop()}:${desc}`,
          brand: "Microsoft",
          title: `Microsoft ${name} - ${desc}`,
          url,
          price: o.price,
          image: typeof p?.image === "string" ? p.image : undefined,
          inStock: !/OutOfStock|SoldOut/i.test(o.availability ?? ""),
        },
      });
    }
    await sleep(1000);
  }
  return out;
}

const pick = (kind: "laptops" | "tablets") => async () => (await (cache ??= all())).filter((x) => x.kind === kind).map((x) => x.offer);

export const scrapers: Partial<Record<Exclude<CategoryId, "phones">, () => Promise<RawOffer[]>>> = {
  laptops: pick("laptops"),
  tablets: pick("tablets"),
};
