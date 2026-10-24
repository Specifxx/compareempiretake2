/**
 * HP US store (Magento): laptops, monitors, desktops and printers from JSON-LD Products on listing pages (?p=N).
 * Each Product carries sku = mpn = HP's product number (e.g. C0DE0PA); refurbished units end in "R" and say so.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../../lib/http";

function* walk(o: unknown): Generator<Record<string, unknown>> {
  if (Array.isArray(o)) for (const x of o) yield* walk(x);
  else if (o && typeof o === "object") {
    yield o as Record<string, unknown>;
    for (const v of Object.values(o)) yield* walk(v);
  }
}

async function crawl(listing: string, keep: (name: string) => boolean): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (let page = 1; page <= 30; page++) {
    let html: string;
    try {
      html = await get(`${listing}?p=${page}&product_list_limit=36`);
    } catch (e) {
      if (page === 1) throw e;
      break;
    }
    const before = out.size;
    for (const [, body] of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
      let d: unknown;
      try {
        d = JSON.parse(body);
      } catch {
        continue;
      }
      for (const n of walk(d)) {
        if (n["@type"] !== "Product" || !n.sku) continue;
        const sku = String(n.sku);
        const name = decodeEntities(String(n.name ?? "")).replace(/\s+/g, " ").trim();
        const offer = n.offers as Record<string, unknown> | undefined;
        const price = Number(offer?.price);
        if (!name || !price || out.has(sku)) continue;
        if (/refurb|renewed|open.?box/i.test(name) || /\dR$|-/.test(sku) || / \+ /.test(name) || !keep(name)) continue;
        const href = html.match(new RegExp(`href="(https://www\\.hp\\.com/us-en/shop/[a-z0-9-]*${sku.toLowerCase()}[a-z0-9-]*\\.html)"`))?.[1];
        const img = Array.isArray(n.image) ? (n.image.flat() as string[])[0] : (n.image as string | undefined);
        out.set(sku, {
          retailer: "us-hp",
          sku,
          mpn: String(n.mpn ?? sku),
          brand: "HP",
          title: name,
          url: href ?? listing,
          price,
          image: img,
          inStock: !/OutOfStock|SoldOut/i.test(String(offer?.availability ?? "")),
        });
      }
    }
    if (out.size === before && page > 1) break;
    await sleep(1200);
  }
  return [...out.values()];
}

const ACCESSORY = /\b(bag|backpack|sleeve|case|mouse|keyboard|dock|adapter|charger|pen|stand|arm|mount|cable|headset|speaker)\b/i;

export const scrapers: Partial<Record<Exclude<CategoryId, "phones">, () => Promise<RawOffer[]>>> = {
  laptops: () =>
    crawl("https://www.hp.com/us-en/shop/laptops-tablets.html", (n) => /laptop|chromebook|notebook|omnibook|omnipad|elitebook|probook|zbook|omen|victus|spectre|envy|pavilion|detachable/i.test(n) && !ACCESSORY.test(n)),
  desktops: () =>
    crawl("https://www.hp.com/us-en/shop/desktops.html", (n) => /desktop|all-in-one|\baio\b|tower|mini|omen|envy|pavilion|elitedesk|prodesk|z2|z4|z6|z8|elite|pro\b/i.test(n) && !ACCESSORY.test(n) && !/\bmonitor\b(?!.*(desktop|all-in-one))/i.test(n)),
  printers: () =>
    crawl("https://www.hp.com/us-en/shop/printers.html", (n) => /printer|laserjet|deskjet|officejet|envy|smart tank|designjet|sprocket|scanjet|scanner/i.test(n) && !/\b(ink|toner|cartridge|paper|drum|tray|bottle|maintenance|fuser|carepack|care pack)\b/i.test(n)),
  monitors: () => crawl("https://www.hp.com/us-en/shop/monitors.html", (n) => /monitor|display/i.test(n) && !/\b(arm|mount|stand|cable|adapter|speaker|webcam)\b/i.test(n.replace(/monitor arm/i, "arm"))),
};
