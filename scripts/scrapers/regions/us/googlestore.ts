/**
 * Google Store US (store.google.com/us): Pixel phones, Pixel Tablet and Pixel Watch. Each product's config page
 * (/us/config/<slug>) is server-rendered with one schema.org AggregateOffer per colour × storage × carrier in its
 * microdata ("Pixel 10 Pro Moonstone 128GB (Unlocked)", lowPrice 999, USD, InStock). Written 2026-11-06 from GitHub
 * Actions probes (200, no key, no API). Unlocked only: "(AT&T)", "(Verizon)", "(Fi)" and other carrier variants are
 * left out; colours fold into one offer per model and storage (the lowest price, in stock if any colour is).
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../../lib/http";

const BASE = "https://store.google.com";

/** Config pages known on 2026-11-06, plus any /config/ link the category pages carry. A missing one is skipped. */
const SEED: Record<"phones" | "tablets" | "smartwatches", string[]> = {
  phones: [
    "pixel_11", "pixel_11_pro", "pixel_11_pro_xl", "pixel_11_pro_fold", "pixel_10", "pixel_10_pro", "pixel_10_pro_xl",
    "pixel_10_pro_fold", "pixel_10a", "pixel_9a",
  ],
  tablets: ["pixel_tablet", "pixel_tablet_2"],
  smartwatches: ["pixel_watch_5", "pixel_watch_4", "pixel_watch_3"],
};
const CATEGORY_PAGE: Record<keyof typeof SEED, string> = {
  phones: "category/phones",
  tablets: "category/tablets",
  smartwatches: "category/watches",
};

/** "pixel_10_pro_xl" → "Pixel 10 Pro XL" */
const modelOf = (slug: string) =>
  slug.split("_").map((w) => (w === "xl" ? "XL" : /^\d/.test(w) ? w : w[0].toUpperCase() + w.slice(1))).join(" ");

interface Variant { description: string; price: number; inStock: boolean }

/** Every AggregateOffer in the page's microdata. */
export function variants(html: string): Variant[] {
  const out: Variant[] = [];
  const blocks = html.split(/itemprop="offers"/).slice(1);
  for (const b of blocks) {
    const description = decodeEntities(b.match(/itemprop="description" content="([^"]+)"/)?.[1] ?? "").trim();
    const price = Number(b.match(/itemprop="(?:lowPrice|price)" content="([\d.]+)"/)?.[1]);
    const currency = b.match(/itemprop="priceCurrency" content="([A-Z]{3})"/)?.[1];
    if (!description || !price || (currency && currency !== "USD")) continue;
    const availability = b.match(/href="https?:\/\/schema\.org\/(\w+)" itemprop="availability"/)?.[1] ?? "";
    out.push({ description, price, inStock: availability === "InStock" });
  }
  return out;
}

async function slugs(cat: keyof typeof SEED): Promise<string[]> {
  const found = new Set(SEED[cat]);
  try {
    const html = await get(`${BASE}/us/${CATEGORY_PAGE[cat]}?hl=en-US`);
    const want = cat === "phones" ? /^pixel_\d/ : cat === "tablets" ? /^pixel_tablet/ : /^pixel_watch/;
    for (const [, s] of html.matchAll(/\/config\/([a-z0-9_]+)/g)) if (want.test(s)) found.add(s);
  } catch {}
  return [...found];
}

async function read(cat: keyof typeof SEED): Promise<RawOffer[]> {
  const best = new Map<string, RawOffer>();
  for (const slug of await slugs(cat)) {
    const url = `${BASE}/us/config/${slug}?hl=en-US`;
    let html: string;
    try {
      html = await get(url, 2);
    } catch {
      continue;
    }
    const model = modelOf(slug);
    const image = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    for (const v of variants(html)) {
      const d = v.description;
      // Only this page's own product, and only the unlocked one.
      if (!d.toLowerCase().startsWith(model.toLowerCase() + " ")) continue;
      const rest = d.slice(model.length);
      if (/^\s*(?:pro|xl|fold|a)\b/i.test(rest)) continue; // "Pixel 10" page listing a "Pixel 10 Pro"
      const carrier = d.match(/\(([^)]+)\)\s*$/)?.[1];
      if (cat === "phones" ? !/^unlocked$/i.test(carrier ?? "") : carrier && !/^(?:unlocked|wi-?fi|bluetooth|lte|4g lte)$/i.test(carrier)) continue;
      let title: string;
      if (cat === "smartwatches") {
        const size = d.match(/(\d+)\s?mm/i)?.[1];
        const lte = /\bLTE\b/i.test(d);
        title = `Google ${model} ${size ? `${size}mm ` : ""}${lte ? "GPS + Cellular (LTE)" : "GPS (Bluetooth)"}`;
      } else {
        const storage = d.match(/\b(\d+)\s?(GB|TB)\b/i);
        if (!storage) continue;
        title = `Google ${model} ${storage[1]}${storage[2].toUpperCase()}`;
      }
      const prev = best.get(title);
      if (!prev || v.price < prev.price || (v.inStock && !prev.inStock && v.price === prev.price)) {
        best.set(title, {
          retailer: "us-googlestore",
          sku: `${slug}:${title.slice(`Google ${model} `.length).replace(/\s+/g, "-").toLowerCase()}`,
          brand: "Google",
          title,
          url,
          price: v.price,
          image,
          inStock: v.inStock || !!prev?.inStock,
        });
      } else if (v.inStock && !prev.inStock) prev.inStock = true;
    }
    await sleep(900);
  }
  return [...best.values()];
}

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  phones: () => read("phones"),
  // Tablets and watches: the guessed config pages (pixel_tablet, pixel_watch_4…) gave 0 unlocked offers on 2026-11-06.
  // read("tablets") / read("smartwatches") stay ready for when their page names are known.
};
