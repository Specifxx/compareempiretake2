/**
 * Officeworks (officeworks.com.au). Its category pages are drawn client-side from Algolia (a key in the page's JS,
 * which the survey rules leave alone), but the site also has a public, keyless catalogue API that the product page
 * itself calls (probed from GitHub Actions, 2026-11-04):
 *
 *   /sitemap-products.xml                       every product URL, ending in its SKU (…-inlog4203)
 *   /catalogue-app/api/products?sku=A,B,C       the products' names, brand, part number, GTIN, image, seoPath,
 *                                               `rangedOnline`/`published` (false once delisted) and the
 *                                               `edlpPrice` attribute (the everyday price, in dollars)
 *   /catalogue-app/api/prices/<SKU>             {"<SKU>":{"price":6700}} in cents: what the product page shows
 *
 * So: read the sitemap, keep the slugs that look like our categories, ask for those products a dozen at a time,
 * keep the ones still ranged online, classify each by name with the shared checks, and price it from the prices
 * endpoint (the EDLP attribute when that fails). About 200 product calls and one price call per kept product.
 */
import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { get, pool, sleep } from "../../lib/http";
import { classify } from "../auto-shopify";

const BASE = "https://www.officeworks.com.au";
const API = `${BASE}/catalogue-app/api`;

type Product = {
  sku?: string;
  name?: string;
  seoPath?: string;
  published?: boolean;
  rangedOnline?: boolean;
  ranged?: { online?: boolean; inStore?: boolean };
  image?: string;
  gtin?: string;
  manufacturerPartNumber?: string;
  brand?: { name?: string };
  attributes?: { id?: string; value?: string }[];
  preorderProduct?: boolean;
};

const CATS = [
  "phones", "tablets", "laptops", "desktops", "monitors", "printers", "routers", "tvs", "soundbars", "headphones", "speakers",
  "smartwatches", "cameras", "drones", "consoles", "graphics-cards", "cpus", "ssds", "ram", "motherboards", "robot-vacuums",
  "vacuums", "air-fryers", "coffee-machines", "small-kitchen", "hair-care", "lego",
] as const satisfies readonly CategoryId[];

/** Which sitemap slugs are worth a product call: broad on purpose, the shared title checks decide the rest. */
const SLUG: Record<(typeof CATS)[number], RegExp> = {
  phones: /iphone|galaxy-(s|z|a)\d|pixel-\d|smartphone|-phone-|oppo-|motorola|moto-g|nokia-|xiaomi|redmi/,
  tablets: /ipad|galaxy-tab|tablet|surface-pro|lenovo-tab|matepad|-pad-/,
  laptops: /laptop|macbook|chromebook|surface-laptop|zenbook|vivobook|thinkpad|ideapad|yoga-|inspiron|legion|omnibook|-notebook-(pc|computer)|gaming-notebook/,
  desktops: /desktop|imac|mac-mini|mac-studio|all-in-one|-tower-|gaming-pc|mini-pc/,
  monitors: /monitor/,
  printers: /printer/,
  routers: /router|mesh-wifi|wifi-6|wifi-7|-mesh-/,
  tvs: /-tv-|television|-tv$|smart-tv|oled|qled/,
  soundbars: /soundbar|sound-bar/,
  headphones: /headphone|earphone|earbud|airpods|headset/,
  speakers: /speaker|homepod|sonos|soundcore|jbl-(flip|charge|go|clip|boombox|xtreme)/,
  smartwatches: /apple-watch|galaxy-watch|pixel-watch|garmin|fitbit|smart-?watch|amazfit|huawei-watch|xiaomi-watch|redmi-watch/,
  cameras: /(?<!web|security-|dash-|ip-|action-)camera|instax|gopro|insta360|mirrorless|dslr|powershot|lumix/,
  drones: /drone|dji/,
  consoles: /playstation|ps5|xbox|nintendo|switch-2|console|steam-deck/,
  "graphics-cards": /graphics-card|geforce|radeon|rtx-\d/,
  cpus: /processor|ryzen|core-i\d|intel-core|core-ultra/,
  ssds: /-ssd|nvme|solid-state/,
  ram: /ddr\d|memory-module|-ram-|desktop-memory|laptop-memory/,
  motherboards: /motherboard/,
  "robot-vacuums": /robot/,
  vacuums: /vacuum|-vac-/,
  "air-fryers": /air-?fryer/,
  "coffee-machines": /coffee|espresso|nespresso/,
  "small-kitchen": /kettle|toaster|blender|mixer|food-processor|microwave|juicer|rice-cooker|slow-cooker|sandwich-press|grill/,
  "hair-care": /hair-dryer|hairdryer|straightener|airwrap|curler|hair-styler|supersonic/,
  lego: /lego/,
};

const MAX_SKUS = 12000;

/** Officeworks sells stationery and accessories with the same words as our categories; refuse those before the shared checks. */
const REFUSE: Partial<Record<(typeof CATS)[number], RegExp>> = {
  laptops: /\bnotebook\b(?!.*(\bgb\b|ssd|ryzen|intel|core|snapdragon|windows|chromeos|macos|\d{2}(\.\d)?\s?("|inch)))|\bpad\b|\brefill|\bpaper\b|\bpages?\b|\bruled\b|spiral|\bdiary|planner|\bsleeve|\bbag\b|\bcase\b|\bstand\b|\bbattery\b|\bcharger|adapter|\bskin\b|lock\b|\btoy\b/i,
  tablets: /\bcase\b|\bcover\b|keyboard|stylus|\bpen\b|screen protector|\bstand\b|\bmount|\bkids?\b|\btoy\b|charger|\bcable\b/i,
  cameras: /\bmod\b|\bkit\b|\bmount|\bstrap|\bcase\b|\bbattery|charger|\bfilter|\bcap\b|tripod|selfie|\bgrip\b|\bbag\b|\bfilm\b|\bpack\b|lens\b|webcam|dash ?cam|security|doorbell|\bbaby\b|trail cam|\bprinter\b|\bpaper\b|\bsd\b/i,
  headphones: /\bcase\b|\bcable\b|\btips\b|\bstand\b|\bsplitter|adapter/i,
  speakers: /\bstand\b|\bmount|\bcable\b|\bcase\b|\bbag\b/i,
  printers: /\bink\b|toner|cartridge|\bpaper\b|\blabels?\b|\btape\b|\bribbon|drum\b|maintenance|\bstand\b|\btray\b|\bcable\b|\bwarranty/i,
  routers: /\bcable\b|\bantenna|\bswitch\b|\badapter\b(?!.*router)|powerline|extender/i,
  ssds: /\benclosure|\bcase\b|\bdock|\bcable\b|adapter|\bhdd\b|hard drive|\busb\b.*flash/i,
};
const MIN_PRICE: Partial<Record<(typeof CATS)[number], number>> = { laptops: 250, tablets: 100, monitors: 90, phones: 100, headphones: 15, speakers: 20, tvs: 150, ssds: 25, ram: 25 };
const BATCH = 12;

type Cat = (typeof CATS)[number];
let catalogue: Promise<{ cat: Cat; offer: RawOffer }[]> | undefined;

async function skus(): Promise<string[]> {
  const xml = await get(`${BASE}/sitemap-products.xml`);
  const want = Object.values(SLUG);
  const out = new Set<string>();
  for (const m of xml.matchAll(/<loc>\s*https:\/\/www\.officeworks\.com\.au\/shop\/officeworks\/p\/([a-z0-9-]+)-([a-z0-9]+)\s*<\/loc>/g)) {
    const slug = m[1];
    if (want.some((re) => re.test(slug))) out.add(m[2].toUpperCase());
    if (out.size >= MAX_SKUS) break;
  }
  return [...out];
}

async function products(batch: string[]): Promise<Product[]> {
  try {
    const j = JSON.parse(await get(`${API}/products?sku=${batch.join(",")}`)) as Product[] | { products?: Product[] };
    return Array.isArray(j) ? j : (j.products ?? []);
  } catch {
    return [];
  }
}

/** The price the product page shows, in dollars, or undefined. */
async function livePrice(sku: string): Promise<number | undefined> {
  try {
    const j = JSON.parse(await get(`${API}/prices/${sku}`)) as Record<string, { price?: number }>;
    const c = j[sku]?.price;
    return typeof c === "number" && c > 0 ? c / 100 : undefined;
  } catch {
    return undefined;
  }
}

function attr(p: Product, id: string): string | undefined {
  return p.attributes?.find((a) => a.id === id)?.value;
}

async function readAll(): Promise<{ cat: Cat; offer: RawOffer }[]> {
  const list = await skus();
  console.log(`officeworks: ${list.length} candidate SKUs from the sitemap`);
  const batches: string[][] = [];
  for (let i = 0; i < list.length; i += BATCH) batches.push(list.slice(i, i + BATCH));
  const kept: { p: Product; cat: Cat; edlp: number }[] = [];
  let seen = 0;
  await pool(batches, 2, async (b) => {
    for (const p of await products(b)) {
      seen++;
      if (!p.sku || !p.name || !p.seoPath || !p.published || !(p.rangedOnline ?? p.ranged?.online)) continue;
      const edlp = Number(attr(p, "edlpPrice"));
      const name = p.name.replace(/\s+/g, " ").trim();
      const cat = classify(CATS, name, edlp > 0 ? edlp : 1, p.brand?.name) as Cat | undefined;
      if (!cat || REFUSE[cat]?.test(name)) continue;
      kept.push({ p, cat, edlp });
    }
    await sleep(250);
  });
  console.log(`officeworks: ${seen} products read, ${kept.length} ranged online in our categories`);
  const offers: { cat: Cat; offer: RawOffer }[] = [];
  await pool(kept, 2, async ({ p, cat, edlp }) => {
    const price = (await livePrice(p.sku!)) ?? (edlp > 0 ? edlp : undefined);
    await sleep(120);
    const title = p.name!.replace(/\s+/g, " ").trim();
    if (!price || price < (MIN_PRICE[cat] ?? 0) || classify([cat], title, price, p.brand?.name) !== cat) return;
    const image = p.image ? (p.image.startsWith("//") ? `https:${p.image}` : p.image) : undefined;
    offers.push({
      cat,
      offer: {
        retailer: "officeworks",
        sku: p.sku!,
        title,
        url: new URL(p.seoPath!, BASE).href,
        price,
        wasPrice: edlp > price ? edlp : undefined,
        image,
        inStock: !p.preorderProduct,
        brand: p.brand?.name,
        mpn: p.manufacturerPartNumber || attr(p, "manufacturerPartNumber") || attr(p, "modelNumber"),
      },
    });
  });
  console.log(`officeworks: ${offers.length} priced offers`);
  return offers;
}

async function scrape(cat: Cat): Promise<RawOffer[]> {
  catalogue ??= readAll();
  return (await catalogue).filter((o) => o.cat === cat).map((o) => o.offer);
}

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = Object.fromEntries(CATS.map((c) => [c, () => scrape(c)]));
