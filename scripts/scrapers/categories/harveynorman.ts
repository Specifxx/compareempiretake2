import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../lib/http";

const BASE = "https://www.harveynorman.com.au";

interface HnVariant {
  sku: string;
  name: string;
  url_key: string;
  thumbnail_url?: string;
  final_price: number;
  stock_status: string;
}
interface HnItem {
  sku: string;
  name: string;
  url_key: string;
  url_suffix: string;
  hide_price?: number;
  small_image?: { url: string };
  price_range?: { minimum_price: { final_price: { value: number }; discount?: { amount_off: number } } };
  configurable_variants?: { variants: HnVariant[] } | null;
}

const JUNK = /refurb|renewed|open[- ]?box|ex[- ]?demo|pre[- ]?owned|b[- ]grade|second[- ]hand/i;
const SIZE = /\d{2}(?:\.\d)?(?:-inch|"| ?inch|'')/i;

/** Per category: listing paths and a keep-test on the product name. */
const CATS: Record<Exclude<CategoryId, "phones" | "graphics-cards">, { paths: string[]; keep: (t: string) => boolean }> = {
  tvs: {
    paths: ["/tv-blu-ray-home-theatre/tvs-by-screen-size/all-tvs"],
    keep: (t) => /\btv\b|television/i.test(t) && SIZE.test(t) && !/soundbar|projector|mount|bracket|\bstand\b|remote|antenna|cable/i.test(t),
  },
  monitors: {
    paths: ["/computers-tablets/monitors"],
    keep: (t) =>
      /monitor|display/i.test(t) &&
      (SIZE.test(t) || /^\S+ \d{2}(?:\.\d)? /.test(t)) &&
      !/monitor arms?\b|\barm\b|riser|workstation|mouse pad|bracket|cable|privacy filter|(monitor|display) stands?\b|standing|\blift\b|\d"? - \d|\bmount\b(?! adapter)|\bclamp\b|\d+inch - \d+inch/i.test(t),
  },
  laptops: {
    paths: [
      "/computers-tablets/computers/laptops",
      "/computers-tablets/computers/apple-macbooks",
      "/computers-tablets/computers/2-in-1",
      "/computers-tablets/computers/chromebooks",
      "/computers-tablets/computers/microsoft-surface",
    ],
    keep: (t) => !/\bbag\b|sleeve|\bcase\b|backpack|charger|\bdock\b|docking station|\bstand\b|mouse|keyboard$|imac|desktop|all-in-one|mac mini|cover|skin\b|protector/i.test(t),
  },
  tablets: {
    paths: [
      "/computers-tablets/ipads-surface-tablets/ipads",
      "/computers-tablets/ipads-surface-tablets/samsung-tablets",
      "/computers-tablets/ipads-surface-tablets/tablets",
      "/computers-tablets/ipads-surface-tablets/kids-tablets",
    ],
    keep: (t) =>
      /\d+\s?(gb|tb)/i.test(t) &&
      !/^(?!.*tablet).*\bcase\b|cover\b|folio|keyboard|pencil|stylus|protector|kindle|kobo|ereader|charger|sleeve|\bstand\b/i.test(t),
  },
};

async function scrapeCategory(cat: keyof typeof CATS): Promise<RawOffer[]> {
  const { paths, keep } = CATS[cat];
  const offers = new Map<string, RawOffer>();
  for (const p of paths) {
    for (let page = 1; page <= 25; page++) {
      const html = await get(`${BASE}${p}?p=${page}`);
      const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (!m) throw new Error(`harveynorman ${p}: no __NEXT_DATA__`);
      const pd = JSON.parse(m[1]).props.pageProps.pageProps.pageData.productsData;
      for (const it of (pd.items ?? []) as HnItem[]) {
        if (it.hide_price) continue;
        const minPrice = it.price_range?.minimum_price.final_price.value ?? 0;
        const off = it.price_range?.minimum_price.discount?.amount_off ?? 0;
        const variants: HnVariant[] = it.configurable_variants?.variants?.length
          ? it.configurable_variants.variants
          : [{ sku: it.sku, name: it.name, url_key: it.url_key, final_price: minPrice, stock_status: "IN_STOCK" }];
        for (const v of variants) {
          const title = decodeEntities(v.name).trim();
          if (!v.final_price || JUNK.test(title) || !keep(title) || offers.has(v.sku)) continue;
          offers.set(v.sku, {
            retailer: "harveynorman",
            sku: v.sku,
            title,
            url: `${BASE}/${v.url_key}${it.url_suffix || ".html"}`,
            price: v.final_price,
            // The discount is reported for the item's cheapest variant only.
            wasPrice: off > 0 && v.final_price === minPrice ? Math.round(v.final_price + off) : undefined,
            image: v.thumbnail_url ? `https://hnau.imgix.net/media/catalog/product${v.thumbnail_url}` : it.small_image?.url,
            inStock: v.stock_status === "IN_STOCK",
            mpn: /^[A-Z0-9][A-Z0-9/.-]{4,}$/i.test(v.sku) && /\d/.test(v.sku) && /[A-Z]/i.test(v.sku) ? v.sku : undefined,
            brand: title.split(/\s+/)[0],
          });
        }
      }
      if (!pd.page_info || page >= pd.page_info.total_pages) break;
      await sleep(800);
    }
    await sleep(800);
  }
  return [...offers.values()];
}

// Harvey Norman does not sell graphics cards (components are cases and external devices only).
export const scrapers: Partial<Record<Exclude<CategoryId, "phones">, () => Promise<RawOffer[]>>> = {
  tvs: () => scrapeCategory("tvs"),
  monitors: () => scrapeCategory("monitors"),
  laptops: () => scrapeCategory("laptops"),
  tablets: () => scrapeCategory("tablets"),
};
