/**
 * One reader for the many Shopify stores that need no rules of their own (2026-11-01, "100+ stores"): the whole
 * public `/products.json` is read once, and every variant is put in the FIRST of the store's categories whose shared
 * title check passes (`IS`, `junk`, `badPrice` from categories/jbhifi.ts: the same checks the AU, US and UK stores
 * already go through), so a store file is a single line naming its categories. A title that passes no check is left
 * out; nothing is guessed from a product_type alone. LEGO uses the set-number rules of `lego.ts`, phones need a
 * phone model name as well as `looksLikePhone`.
 *
 * Prices are the shop's base currency (`/products.json` ignores the visitor's market), which `probe-auto.ts`
 * checked against the region's currency before a store was added.
 */
import type { CategoryId, RawOffer, RetailerId } from "../../src/lib/types";
import { decodeEntities, getJson, sleep } from "../lib/http";
import { IS, badPrice, junk, mpnFromSku, type ShopifyProduct } from "./categories/jbhifi";
import { looksLikePhone } from "./filter";
import { NOT_A_SET, setFromSku, setFromTitle } from "./lego";

type Cat = CategoryId;

/** Never new stock, whatever the category. */
const USED =
  /refurb|renewed|re-newed|pre-?owned|open[- ]?box|ex[- ]?(display|demo)|b[- ]grade|b-?stock|\bused\b|second[- ]?hand|grade [abc]\b|\bpristine\b|\bexcellent condition\b|\bvery good\b|\bgood condition\b|\bdamaged\b|\bscratch(ed)?\b|\bdent(ed)?\b|gift ?card|e-?gift|protection plan|extended warranty|\bwarranty\b|trade-?in|mystery|\brental\b|\bdeposit\b|\bpre-?order deposit\b/i;

/** A phone model name: `looksLikePhone` alone would take any title with "GB" in it. */
const PHONE =
  /\biphone \d|\bgalaxy (s|z|a)\d|\bpixel \d|\boneplus \d|\bnord\b|\bmoto(rola)? (g|edge|razr)|\brazr\b|\bnothing phone|\bcmf phone|\bxiaomi \d|\bredmi note|\bpoco [fxm]\d|\boppo (find|reno|a)\d?|\bvivo [xyv]\d|\bhonor (magic|\d)|\bsony xperia|\bfairphone|\bnokia (g|x|c)\d/i;
const NOT_PHONE = /\b(ssd|nvme|ram|ddr\d|memory card|micro ?sd|usb|flash drive|tablet|ipad|laptop|watch|router|case|cover|protector|charger|cable)\b/i;

/**
 * Generic stores sell things the shared checks were never written for (valve amplifiers' "vacuum tubes", espresso
 * shops' "kits", power stations, toy laptops), so each category also needs its own word here and refuses these.
 */
export const GUARD: Partial<Record<Cat, { need?: RegExp; not?: RegExp }>> = {
  vacuums: { need: /vacuum( cleaner)?\b|stick ?vac|cordless vac|wet (and|&) dry/i, not: /\btubes?\b|canister|brewer|player|amplifier|\bdac\b|battery pack|\bpump\b|sealer|storage/i },
  cameras: {
    need: /camera|mirrorless|dslr|\bbody\b|instax|powershot|cyber-?shot|lumix|gopro|insta360|osmo|leica|hasselblad|ricoh gr|pentax|\bom-\d|x100|\bz ?\d{1,2}\b|\beos r|\ba7|\ba6\d{3}|\bzv-|x-[tseh]\d|gfx/i,
    not: /power station|homepower|explorer|\bkwh\b|care\b|insurance|install|upgrade|knob|drawer|\bdac\b|\bamp\b|interface|circuits|airplane|\bmodel\b|\blego\b|brew|grinder|tamp|hose|watch party|stack kit|starter kit|basics kit|plus kit|security|doorbell|\bcam v\d|\bcam pan|\bcam og\b/i,
  },
  "coffee-machines": { need: /espresso machine|coffee (machine|maker)|super-?automatic|bean[- ]to[- ]cup|espresso maker|capsule machine|\bmachine\b/i, not: /grinder|\bburrs?\b|\bdemo\b|\bkit\b|\brack\b|\bshelf\b|\b\d group\b|commercial|\bparts?\b|\bmotor\b|\bboard\b/i },
  "air-fryers": { need: /air ?fry/i },
  printers: { need: /printer/i, not: /3d|label|photo printer|docking|timer|remote|music system|module/i },
  routers: { need: /router|mesh (wi-?fi|system|router)/i, not: /\bmesh (black|white)\b|\bcase\b|chassis|\block\b|gateway|\bdac\b|\bamp\b|deco (silver|gold)/i },
  speakers: { not: /earspeakers?|\bbundles?\b|\+|projector|4k\b|boox|hair ?dryer|spotlight|\bmodule\b|\bisolation\b|\bfeet\b|\b(each|pair)\b/i },
  soundbars: { not: /\bbundle\b|\+/i },
  consoles: { not: /music console|production console|rodecaster|mixer|\bdeck\b(?!.*steam)/i },
  motherboards: { not: /audio player|\bplayer\b|laptop|supernote|core x\d|\bdap\b/i },
  laptops: { not: /\bram\b|motherboard|companion|notebook set|portable monitor|\bmonitor\b|educational|barbie|notebooks|guide|\bkids?\b/i },
  desktops: { not: /\bdock\b|docking|processor|\bkit\b|\bcpu\b(?!.*(pc|desktop))/i },
  monitors: { not: /t-?shirt|\bmount\b|\barm\b|\bstand\b/i },
  headphones: { not: /\bbag\b|engraving|charging case|\bmodule\b|\bdac\b|\bamp(lifier)?\b|\bplayer\b|\bcables?\b|\btips\b|\bpads?\b/i },
  smartwatches: { not: /\bburrs?\b|\bbands?\b|\bstraps?\b/i },
  "graphics-cards": { not: /pre-?order|\bbackplate\b|\bbracket\b|\briser\b/i },
  tvs: { not: /\bmount\b|\bbracket\b|\bstand\b|projector/i },
};

const catalogues = new Map<string, Promise<ShopifyProduct[]>>();

type WooProduct = {
  id: number;
  name: string;
  permalink: string;
  sku?: string;
  type?: string;
  is_in_stock?: boolean;
  images?: { src: string }[];
  brands?: { name: string }[];
  categories?: { name: string }[];
  prices: { price: string; regular_price: string; currency_code: string; currency_minor_unit: number };
};

/** A WooCommerce store's public Store API, in the Shopify product shape (simple products only: a variable one has no single price). */
async function wooCatalogue(base: string, maxPages: number): Promise<ShopifyProduct[]> {
  const all: ShopifyProduct[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const items = await getJson<WooProduct[]>(`${base}/wp-json/wc/store/v1/products?per_page=100&page=${page}`);
    for (const w of items) {
      if (w.type && w.type !== "simple") continue;
      const div = 10 ** (w.prices.currency_minor_unit ?? 2);
      const handle = w.permalink.replace(/^https?:\/\/[^/]+/, "");
      all.push({
        title: w.name,
        handle,
        vendor: w.brands?.[0]?.name,
        product_type: w.categories?.map((c) => c.name).join(", ") ?? "",
        body_html: "",
        tags: [],
        images: (w.images ?? []).map((i) => ({ src: i.src })),
        variants: [
          {
            id: w.id,
            title: "Default Title",
            sku: w.sku ?? "",
            price: String(Number(w.prices.price) / div),
            compare_at_price: String(Number(w.prices.regular_price) / div),
            available: w.is_in_stock !== false,
          },
        ],
        currency: w.prices.currency_code,
        woo: true,
      } as ShopifyProduct);
    }
    if (items.length < 100) break;
    await sleep(800);
  }
  return all;
}

/** The whole store, paged politely, once per run: Shopify's `/products.json`, else WooCommerce's Store API. */
export function catalogue(base: string, maxPages = 40, platform?: "shopify" | "woo"): Promise<ShopifyProduct[]> {
  let c = catalogues.get(base);
  if (!c) {
    c = (async () => {
      if (platform === "woo") return wooCatalogue(base, maxPages * 2);
      const all: ShopifyProduct[] = [];
      try {
        for (let page = 1; page <= maxPages; page++) {
          const { products } = await getJson<{ products: ShopifyProduct[] }>(`${base}/products.json?limit=250&page=${page}`);
          if (!Array.isArray(products)) throw new Error("not a Shopify feed");
          all.push(...products);
          if (products.length < 250) break;
          await sleep(700);
        }
      } catch (e) {
        if (platform === "shopify" || all.length) throw e;
        return wooCatalogue(base, maxPages * 2);
      }
      return all;
    })();
    catalogues.set(base, c);
  }
  return c;
}

/** Which of `cats` this title is, or undefined. */
export function classify(cats: readonly Cat[], title: string, price: number, vendor?: string): Cat | undefined {
  for (const cat of cats) {
    if (cat === "lego") {
      if ((/^lego$/i.test(vendor?.trim() ?? "") || /^lego\b/i.test(title)) && !NOT_A_SET.test(title) && setFromTitle(title)) return cat;
      continue;
    }
    if (cat === "phones") {
      if (PHONE.test(title) && !NOT_PHONE.test(title) && looksLikePhone(title) && price >= 80) return cat;
      continue;
    }
    const c = cat as Exclude<Cat, "phones">;
    if (junk(c, title) || !IS[c](title) || badPrice(c, price)) continue;
    const g = GUARD[cat];
    if (g && ((g.need && !g.need.test(title)) || g.not?.test(title))) continue;
    return cat;
  }
  return undefined;
}

export interface AutoStore {
  retailer: RetailerId;
  base: string;
  /** In priority order: a variant goes to the first that takes it. */
  cats: readonly Cat[];
  /** Brand when the store sells only its own. */
  brand?: string;
  /** Extra titles to refuse (store-made bundles, a store's own wording for display stock). */
  exclude?: RegExp;
  /** SKUs are the maker's model codes (brand stores and some dealers); default: `mpnFromSku`'s guess. */
  skuIsMpn?: boolean;
  /** Skip the platform guess (a store that is not Shopify answers `/products.json` with a page). */
  platform?: "shopify" | "woo";
}

/** Every listed category's offers from one read of the store. */
export async function readAuto(s: AutoStore): Promise<Map<Cat, RawOffer[]>> {
  const out = new Map<Cat, Map<string, RawOffer>>();
  for (const p of await catalogue(s.base, 40, s.platform)) {
    const pt = decodeEntities(p.title).replace(/[®™]/g, "").replace(/\s+/g, " ").trim();
    const tags = Array.isArray(p.tags) ? p.tags.join(" ") : p.tags ?? "";
    if (USED.test(pt) || USED.test(p.product_type ?? "") || /refurb|pre-?owned|\bused\b|open-?box/i.test(tags) || s.exclude?.test(pt)) continue;
    for (const v of p.variants) {
      const vt0 = (v.title ?? "").trim();
      if (USED.test(vt0)) continue;
      const parts = /^default( title)?$/i.test(vt0) ? [] : vt0.split(/\s*\/\s*/).filter((x) => x && !pt.toLowerCase().includes(x.toLowerCase()));
      const title = parts.length ? `${pt} ${parts.join(" ")}` : pt;
      if (s.exclude?.test(title)) continue;
      const price = Number(v.price);
      if (!price || price >= 9999) continue;
      const cat = classify(s.cats, title, price, p.vendor);
      if (!cat) continue;
      if (cat === "lego") {
        // One listing per set; a SKU naming another set than the title is the store's mistake.
        if (p.variants.length !== 1) continue;
        const set = setFromSku(v.sku) ?? setFromTitle(title);
        if (!set || setFromTitle(title) !== set) continue;
      }
      const was = Number(v.compare_at_price);
      let image = (v as { featured_image?: { src: string } | null }).featured_image?.src ?? p.images[0]?.src;
      if (image?.startsWith("//")) image = `https:${image}`;
      const sku = (v.sku ?? "").trim();
      const vendor = p.vendor?.trim();
      // A vendor naming distributors ("ASI Computer Technologies Inc, PC Laptops") is no brand.
      const brand = cat === "lego" ? "LEGO" : s.brand ?? (vendor && !/default|vendor|official|store|supplier|,|\binc\b|^[A-Z0-9]{2,3}$/i.test(vendor) ? vendor : undefined);
      const set = cat === "lego" ? setFromTitle(title) : undefined;
      const offer: RawOffer = {
        retailer: s.retailer,
        sku: sku || String(v.id),
        title: cat === "lego" && !/\blego\b/i.test(title) ? `LEGO ${title}` : title,
        url: (p as { woo?: boolean }).woo ? `${s.base}${p.handle}` : `${s.base}/products/${p.handle}${p.variants.length > 1 ? `?variant=${v.id}` : ""}`,
        price,
        wasPrice: was > price ? was : undefined,
        image,
        inStock: v.available !== false,
        brand,
        mpn: set ?? (s.skuIsMpn ? sku || undefined : mpnFromSku(sku)),
      };
      if (!out.has(cat)) out.set(cat, new Map());
      out.get(cat)!.set(String(v.id), offer);
    }
  }
  return new Map([...out].map(([c, m]) => [c, [...m.values()]]));
}

/** The `scrapers` export of a one-line store file. */
export function autoShopify(s: AutoStore): Partial<Record<Cat, () => Promise<RawOffer[]>>> {
  let all: Promise<Map<Cat, RawOffer[]>> | undefined;
  return Object.fromEntries(s.cats.map((c) => [c, async () => (await (all ??= readAuto(s))).get(c) ?? []]));
}
