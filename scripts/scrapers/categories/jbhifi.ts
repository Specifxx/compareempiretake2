import type { CategoryId, RawOffer, RetailerId } from "../../../src/lib/types";
import { decodeEntities, get, getJson, pool, sleep } from "../../lib/http";

type Cat = Exclude<CategoryId, "phones">;

// ---------- shared filters (also used by mwave / digidirect / betta) ----------

/** Used, refurbished, display stock and accessories: never a new boxed product. */
export const JUNK =
  /refurb|renewed|open[- ]?box|ex[- ]?(display|demo)|b[- ]grade|pre[- ]?owned|second[- ]?hand|\bused\b|\bcase\b|\bcover\b|folio|sleeve|\bbag\b|backpack|\bstand\b|\bmount\b|bracket|\bcable\b|keyboard|screen protector|protector|\bfilm\b|stylus|\bpen\b|pencil|charger|adapter|\bdock\b|docking station|\barm\b|holder|\bskin\b|riser|backplate|\bbrace\b|support bracket|warranty|care\+|applecare|cleaning|remote control|wall plate|tempered glass|\bdecal\b|\bstrap\b|\bmouse\b|\bhub\b(?!.*monitor)|\bshell\b|\bdux\b|duxling|metropolis|charging (cabinet|trolley|cart|station)|smartbox|\bfor (apple |microsoft |samsung )?(ipad|surface|galaxy|tab|macbook|laptop|notebook)/i;

const SIZE = /\d{2,3}(?:\.\d)?\s*(?:"|”|''|-inch|\s?inch|in\b)/i;

/** Per-category title check: is this the product itself? */
export const IS: Record<Cat, (t: string) => boolean> = {
  tvs: (t) => SIZE.test(t) && /\bTV\b|television|google tv|smart tv/i.test(t) && !/projector|soundbar|monitor|tv box|streaming|antenna|cabinet|unit\b|furniture/i.test(t),
  monitors: (t) =>
    /monitor/i.test(t) && SIZE.test(t) && !/baby|speaker|studio monitor|heart|blood|pressure|tyre|camera|security|cctv|portable power|in-ear|headphone|reference monitor|field monitor|on-camera|camera monitor/i.test(t),
  "graphics-cards": (t) =>
    /geforce|\brtx\s?(pro\s?)?\d{4}|radeon|\brx\s?\d{4}|\barc\s?[ab]\d{3}|quadro/i.test(t) &&
    /graphics card|video card|\bgpu\b|\d+\s?GB/i.test(t) &&
    !/laptop|notebook|desktop|gaming pc|\bpc\b|tower|system|bundle with|holder|support|bracket|riser|cooler|waterblock|water block|fan\b|\bW1[01][HP]?\b|windows|ryzen \d|\d\s?TB|core i\d|ultra \d/i.test(t),
  laptops: (t) =>
    /laptop|macbook|notebook|chromebook|ultrabook|copilot\+ pc/i.test(t) && !/toy|kids|learn|vtech|leapfrog|sticker|tray|cooling pad|cooler|lock\b|power bank|battery\b/i.test(t),
  tablets: (t) =>
    /ipad|galaxy tab|\btablet\b|surface pro|matepad|lenovo tab|\btab\s?[a-z]?\d|xiaomi pad|redmi pad|oneplus pad|\bpad\s?\d|nxtpaper/i.test(t) &&
    /\d+\s?(GB|TB)/i.test(t) &&
    !/e-?reader|kobo|kindle|drawing|graphic(s)? tablet|pen tablet|wacom|xp-pen|huion|writing tablet|lcd writing|toy|mount|holder|tablet pc stand/i.test(t),
};

/** A Shopify SKU that looks like a manufacturer code (letters and digits), not an internal number. */
export function mpnFromSku(sku: string | undefined | null): string | undefined {
  if (!sku) return undefined;
  const s = sku.trim();
  if (/^\d+$/.test(s) || !/[a-z]/i.test(s) || !/\d/.test(s) || s.length < 4) return undefined;
  return s;
}

/** "Model: XXX" / "MPN - XXX" / "Model Number: XXX" in a product description. */
export function mpnFromBody(html: string | undefined): string | undefined {
  if (!html) return undefined;
  const text = decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
  const m = text.match(/\b(?:MPN|Model(?: Number| No\.?| Code)?|Part (?:Number|No\.?))\s*[:\-–]\s*([A-Z0-9][A-Z0-9\-\/.]{3,24}[A-Z0-9])\b/i);
  if (!m || !/\d/.test(m[1]) || !/[a-z]/i.test(m[1])) return undefined;
  return m[1].toUpperCase();
}

/** A model-code-looking token in a monitor title, e.g. "Philips 32E1N3500 31.5" ..." → 32E1N3500. */
export function mpnFromTitle(title: string): string | undefined {
  for (const tok of title.split(/[\s,()[\]]+/)) {
    const t = tok.replace(/["”]+$/, "");
    if (t.length < 5 || t.length > 20) continue;
    if (!/^[A-Z0-9][A-Z0-9-]*[A-Z0-9]$/.test(t) || !/\d/.test(t) || !/[A-Z]/.test(t)) continue;
    if (/^(\d+(HZ|GB|TB|MS|K|P|W|MM|CM|NITS?)|[FQW]?[UH]?HD\+?|USB-C|HDMI\d*|DP\d*|HDR\d+|IPS|VA|OLED|QD-OLED|DCI-P3|G-SYNC|RTX\d+\w*|GTX\d+|I[3579]-\w+|M\d(PRO|MAX)?|WQHD|UWQHD|4K|5K|8K|2026|2025)$/i.test(t)) continue;
    if (/^\d+(\.\d+)?(HZ|GB|TB|MS|K)$/i.test(t)) continue;
    return t;
  }
  return undefined;
}

export interface ShopifyProduct {
  title: string;
  handle: string;
  vendor?: string;
  product_type: string;
  body_html: string;
  tags: string | string[];
  images: { src: string }[];
  variants: { id: number; title: string; sku: string; price: string; compare_at_price: string | null; available?: boolean }[];
}

/**
 * A Shopify store's collection feeds for one category. One offer per variant;
 * variant titles holding storage/colour are appended to the product title.
 */
export async function shopifyCategory(
  retailer: RetailerId,
  base: string,
  cat: Cat,
  collections: string[],
  opts: { mpn?: (p: ShopifyProduct, v: ShopifyProduct["variants"][0]) => string | undefined; skip?: (p: ShopifyProduct) => boolean } = {},
): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (const c of collections) {
    for (let page = 1; page <= 20; page++) {
      const { products } = await getJson<{ products: ShopifyProduct[] }>(`${base}/collections/${c}/products.json?limit=250&page=${page}`);
      for (const p of products) {
        if (opts.skip?.(p)) continue;
        const pt = decodeEntities(p.title).trim();
        for (const v of p.variants) {
          const vt = v.title && v.title !== "Default Title" && !pt.includes(v.title) ? ` ${v.title.replace(/\s*\/\s*/g, " ")}` : "";
          const title = pt + vt;
          if (JUNK.test(title) || !IS[cat](title)) continue;
          const price = Number(v.price);
          if (!price) continue;
          const was = Number(v.compare_at_price);
          const brand = p.vendor && !/homeliving|default|vendor/i.test(p.vendor) ? p.vendor : undefined;
          out.set(String(v.id), {
            retailer,
            sku: String(v.sku || v.id),
            title,
            url: `${base}/products/${p.handle}${p.variants.length > 1 ? `?variant=${v.id}` : ""}`,
            price,
            wasPrice: was > price ? was : undefined,
            image: p.images[0]?.src,
            inStock: v.available !== false,
            mpn: opts.mpn ? opts.mpn(p, v) : mpnFromSku(v.sku),
            brand,
          });
        }
      }
      if (products.length < 250) break;
      await sleep(600);
    }
  }
  return [...out.values()];
}

// ---------- JB Hi-Fi ----------

const BASE = "https://www.jbhifi.com.au";

const HANDLES: Record<Cat, RegExp> = {
  tvs: /-(\d{2,3})-.*(tv|oled|qled|neo-qled|mini-led|television)/,
  monitors: /monitor/,
  "graphics-cards": /(geforce|rtx-\d{4}|radeon|rx-\d{4}|arc-[ab]\d{3}|quadro|rtx-pro)/,
  laptops: /(laptop|macbook|notebook|chromebook|vivobook|zenbook|ideapad|thinkpad|inspiron|pavilion|aspire|swift|omnibook|surface-laptop|yoga|expertbook|probook|elitebook|latitude|galaxy-book|rog-|tuf-|legion|predator|nitro|katana|omen|victus|xps)/,
  tablets: /(ipad|galaxy-tab|tablet|surface-pro|matepad|lenovo-tab|xiaomi-pad|redmi-pad|oneplus-pad|nxtpaper|-tab-)/,
};
const HANDLE_JUNK =
  /refurb|renewed|open-box|ex-display|ex-demo|pre-owned|-case|-cover|folio|sleeve|-bag|backpack|-stand|-mount|bracket|cable|keyboard|protector|stylus|-pen-|pencil|charger|adapter|-dock|-arm|holder|-skin|riser|-strap|-mouse/;

/** JB product types per category (sampled 2026-10): TVs are VISUAL; computers, monitors and tablets COMPUTERS; marketplace IT. */
const TYPES: Record<Cat, RegExp> = {
  tvs: /^VISUAL$/,
  monitors: /^(COMPUTERS|IT)$/,
  "graphics-cards": /^(COMPUTERS|IT)$/,
  laptops: /^(COMPUTERS|IT)$/,
  tablets: /^(COMPUTERS|IT)$/,
};

let sitemap: Promise<string[]> | undefined;
/** All product URLs from JB's product sitemaps, fetched once per run. */
function productUrls(): Promise<string[]> {
  sitemap ??= (async () => {
    const index = await get(`${BASE}/sitemap.xml`);
    const maps = [...index.matchAll(/<loc>([^<]*sitemap_products[^<]*)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
    const urls = new Set<string>();
    await pool(maps, 4, async (m) => {
      const xml = await get(m);
      for (const [, loc] of xml.matchAll(/<loc>(https:\/\/www\.jbhifi\.com\.au\/products\/[^<]+)<\/loc>/g)) urls.add(loc);
      await sleep(150);
    });
    return [...urls];
  })();
  return sitemap;
}

/**
 * JB marketplace listings (third-party sellers: an 8-digit 100xxxxx SKU and the
 * seller's name as variant title) are mostly used/refurbished laptops; we keep
 * them only for graphics cards, where the sellers are PC stores.
 */
function isMarketplace(p: ShopifyProduct): boolean {
  const v = p.variants[0];
  return /^100\d{5}$/.test(v?.sku ?? "") || (v?.title !== "Default Title" && p.product_type === "IT");
}

async function jbCategory(cat: Cat): Promise<RawOffer[]> {
  const urls = (await productUrls()).filter((u) => {
    const h = u.slice(u.lastIndexOf("/") + 1).toLowerCase();
    return HANDLES[cat].test(h) && !HANDLE_JUNK.test(h) && (cat === "graphics-cards" ? !/laptop|gaming-pc|desktop|-pc$/.test(h) : true);
  });
  console.log(`  jbhifi ${cat}: ${urls.length} candidate products`);
  const offers: RawOffer[] = [];
  await pool(urls, 4, async (url) => {
    try {
      const { product: p } = await getJson<{ product: ShopifyProduct }>(`${url}.json`);
      const title = decodeEntities(p.title).trim();
      if (!TYPES[cat].test(p.product_type) || JUNK.test(title) || !IS[cat](title)) return;
      if (isMarketplace(p) && cat !== "graphics-cards") return;
      const tags = Array.isArray(p.tags) ? p.tags.join(",") : p.tags;
      if (/NoLongerAvailable|Discontinued|(^|,)\s*Unknown\s*(,|$)/i.test(tags)) return;
      const v = p.variants[0];
      const price = Number(v.price);
      if (!price) return;
      const was = Number(v.compare_at_price);
      const brand = tags.match(/Brand:([^,]+)/)?.[1]?.trim() ?? p.vendor;
      offers.push({
        retailer: "jbhifi",
        sku: String(v.sku || v.id),
        title,
        url,
        price,
        wasPrice: was > price ? was : undefined,
        image: p.images[0]?.src,
        inStock: !/AwaitingStock|PreOrder|NotAvailable|SoldOut/i.test(tags),
        mpn: mpnFromSku(v.sku) ?? mpnFromBody(p.body_html) ?? title.match(/\(([A-Z0-9][A-Z0-9-]{5,}[A-Z0-9])\)/)?.[1] ?? (cat === "monitors" ? mpnFromTitle(title) : undefined),
        brand,
      });
    } catch (e) {
      console.warn(`  jbhifi: skip ${url}: ${(e as Error).message}`);
    }
    await sleep(150);
  });
  return offers;
}

export const scrapers: Partial<Record<Cat, () => Promise<RawOffer[]>>> = {
  tvs: () => jbCategory("tvs"),
  monitors: () => jbCategory("monitors"),
  "graphics-cards": () => jbCategory("graphics-cards"),
  laptops: () => jbCategory("laptops"),
  tablets: () => jbCategory("tablets"),
};
