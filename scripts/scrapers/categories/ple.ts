/**
 * PLE Computers: the React storefront server-renders each category's full item list into
 * `window._initialDataContext` (URL-encoded JSON, key `*_category2_<id>_*` → data.data.ItemList.Items).
 * One request per category; no API keys.
 */
import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { get, sleep } from "../../lib/http";
import { KEEP } from "./umart";

type Cat = Exclude<CategoryId, "phones">;
const BASE = "https://www.ple.com.au";

interface Item {
  InventoryItemId: number;
  ItemDescription: string;
  CustomerPriceIncTax?: number;
  RetailPriceIncTax?: number;
  RRPPriceIncTax?: number;
  ManufacturerName?: string;
  ManufacturerModel?: string;
  InStock?: boolean;
  ItemUrl: string;
  PrimaryImageId?: number;
  HidePriceFromCategoryListing?: boolean;
  AvailableOnline?: boolean;
}

const NOT_NEW = /refurb|renewed|open[- ]?box|ex[- ]?demo|b[- ]?grade|pre[- ]?owned|second[- ]?hand|\bused\b/i;

const TABLET = /\btablet\b|\bipad\b|\btab\b/i;
const ACCESSORY = /\bbag\b|backpack|sleeve|\bcase\b|cover|folio|dock|charger|adapter|\bstand\b|keyboard|mouse|pen\b|stylus|pencil|warranty|screen protector/i;

const CATS: Record<string, { paths: string[]; keep: (t: string) => boolean }> = {
  "graphics-cards": {
    paths: ["259/graphics-cards"],
    keep: (t) =>
      /\b(geforce|rtx|gtx|radeon|rx\s?\d{3,4}|arc\s?[ab]\d{3}|quadro)\b/i.test(t) &&
      !/bracket|riser|cable|support|holder|mining|water ?block|backplate|extension|adapter/i.test(t),
  },
  monitors: {
    paths: ["296/monitors"],
    keep: (t) => /monitor|display|\d{2}(\.\d)?"/i.test(t) && !/\barm\b|\barms\b|mount|\bstand\b|bracket|cable|adapter|hood|kvm|privacy filter/i.test(t),
  },
  laptops: {
    paths: ["312/notebooks-portable"],
    keep: (t) =>
      !TABLET.test(t) &&
      !/\bbag\b|backpack|sleeve|\bcase\b|dock|charger|adapter|power supply|\bstand\b|cooling|cooler|keyboard|mouse|warranty|battery|\bram\b|sodimm|ddr\d/i.test(t),
  },
  tablets: {
    paths: ["312/notebooks-portable", "409/notebooks-portable/2-in-1-tablets"],
    keep: (t) => TABLET.test(t) && !ACCESSORY.test(t),
  },
  // Newer categories reuse the Umart/MSY title filters (same PC-specialist naming conventions).
  cpus: { paths: ["235/cpus"], keep: KEEP.cpus! },
  ssds: { paths: ["828/hard-drives-ssds/m2-ssd", "355/hard-drives-ssds/25-ssd", "1025/hard-drives-ssds-external/external-portable-ssd"], keep: KEEP.ssds! },
  ram: { paths: ["728/memory-ram/desktop-memory", "729/memory-ram/notebook-memory"], keep: KEEP.ram! },
  motherboards: { paths: ["302/motherboards"], keep: KEEP.motherboards! },
  // desktops: PLE's prebuilt range is configure-to-order (category lists render empty) plus a handful of house builds; skipped.
  routers: { paths: ["624/networking/routers", "511/networking/adslvdsl-modem-routers", "307/networking/modems", "944/networking/4g5g"], keep: KEEP.routers! },
  printers: { paths: ["339/printers-consumables"], keep: KEEP.printers! },
  headphones: { paths: ["930/headphones-microphones/headphones", "568/headphones-microphones/headset", "569/headphones-microphones/earphones"], keep: KEEP.headphones! },
  speakers: { paths: ["380/speakers"], keep: KEEP.speakers! },
  soundbars: { paths: ["1310/speakers/soundbar"], keep: KEEP.soundbars! },
};

async function scrape(cat: string): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (const p of CATS[cat].paths) {
    const html = await get(`${BASE}/categories/${p}`);
    const enc = html.match(/window\._initialDataContext\s*=\s*"([^"]*)"/)?.[1];
    if (!enc) throw new Error(`PLE: no initial data for ${p}`);
    const ctx = JSON.parse(decodeURIComponent(enc)) as Record<string, { data?: { data?: { ItemList?: { Items?: Item[] } } } }>;
    const key = Object.keys(ctx).find((k) => /_category2_/.test(k));
    const items = (key && ctx[key].data?.data?.ItemList?.Items) || [];
    if (!items.length) throw new Error(`PLE: empty item list for ${p}`);
    for (const it of items) {
      const title = it.ItemDescription?.trim();
      const price = it.CustomerPriceIncTax ?? it.RetailPriceIncTax;
      if (!title || !price || it.HidePriceFromCategoryListing || it.AvailableOnline === false) continue;
      if (NOT_NEW.test(title) || !CATS[cat].keep(title)) continue;
      const sku = String(it.InventoryItemId);
      if (out.has(sku)) continue;
      out.set(sku, {
        retailer: "ple",
        sku,
        title,
        brand: it.ManufacturerName || title.split(/\s+/)[0],
        mpn: it.ManufacturerModel || undefined,
        url: BASE + it.ItemUrl,
        price,
        wasPrice: it.RRPPriceIncTax && it.RRPPriceIncTax > price ? it.RRPPriceIncTax : undefined,
        image: it.PrimaryImageId ? `https://plecom.imgix.net/iil-${it.PrimaryImageId}-${sku}.jpg?w=600&h=600` : undefined,
        inStock: !!it.InStock,
      } as RawOffer);
    }
    await sleep(700);
  }
  return [...out.values()];
}

export const scrapers: Partial<Record<Cat, () => Promise<RawOffer[]>>> = Object.fromEntries(
  Object.keys(CATS).map((c) => [c, () => scrape(c)]),
);
