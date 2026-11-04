/**
 * Best Buy (bestbuy.com). The site walls off every server, but Best Buy publishes a free Products API
 * (developer.bestbuy.com: a key per email, 5 requests a second, no affiliate approval needed). With `BESTBUY_API_KEY`
 * set, each category is a keyword search (`(search=laptop)`, 100 a page, up to ten pages) run through the same
 * title, price and condition rules as a feed (`rowsToOffers`); refurbished and open-box SKUs are refused by their
 * `condition`. With `FEED_URL_US_BESTBUY` (Impact feed) set as well, both are read and the API's price wins for a SKU
 * both have. Links are plain product URLs until the Impact programme is approved (docs/stores/big-stores.md).
 * Written from the API docs, 2026-11-04.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { sleep } from "../../../lib/http";
import {
  feedStore,
  rowsToOffers,
  type FeedRow,
  type FeedStore,
} from "../../feed";

const CATS = [
  "phones",
  "tablets",
  "laptops",
  "desktops",
  "monitors",
  "printers",
  "routers",
  "tvs",
  "soundbars",
  "headphones",
  "speakers",
  "smartwatches",
  "cameras",
  "drones",
  "consoles",
  "graphics-cards",
  "cpus",
  "ssds",
  "ram",
  "motherboards",
  "robot-vacuums",
  "vacuums",
  "air-fryers",
  "coffee-machines",
  "small-kitchen",
  "hair-care",
  "lego",
  "fridges",
  "washing-machines",
  "dishwashers",
] as const satisfies readonly CategoryId[];
type Cat = (typeof CATS)[number];

const SEARCH: Record<Cat, string[]> = {
  phones: ["unlocked phone", "iphone", "galaxy"],
  tablets: ["ipad", "tablet"],
  laptops: ["laptop", "macbook", "chromebook"],
  desktops: ["desktop computer", "imac", "mac mini"],
  monitors: ["monitor"],
  printers: ["printer"],
  routers: ["wifi router", "mesh wifi"],
  tvs: ["tv"],
  soundbars: ["soundbar"],
  headphones: ["headphones", "earbuds"],
  speakers: ["bluetooth speaker", "smart speaker"],
  smartwatches: ["smartwatch", "apple watch", "garmin"],
  cameras: ["mirrorless camera", "dslr camera", "gopro", "instax"],
  drones: ["drone"],
  consoles: ["playstation 5", "xbox series", "nintendo switch"],
  "graphics-cards": ["graphics card"],
  cpus: ["processor"],
  ssds: ["ssd"],
  ram: ["desktop memory", "laptop memory"],
  motherboards: ["motherboard"],
  "robot-vacuums": ["robot vacuum"],
  vacuums: ["vacuum"],
  "air-fryers": ["air fryer"],
  "coffee-machines": ["espresso machine", "coffee maker"],
  "small-kitchen": [
    "blender",
    "stand mixer",
    "toaster",
    "kettle",
    "food processor",
    "microwave",
  ],
  "hair-care": ["hair dryer", "hair straightener", "airwrap"],
  lego: ["lego"],
  fridges: ["refrigerator"],
  "washing-machines": ["washer"],
  dishwashers: ["dishwasher"],
};

type Product = {
  sku: number;
  name: string;
  upc?: string;
  salePrice?: number;
  regularPrice?: number;
  onlineAvailability?: boolean;
  url?: string;
  condition?: string;
  manufacturer?: string;
  modelNumber?: string;
  image?: string;
};

const STORE: FeedStore = {
  retailer: "us-bestbuy",
  env: "FEED_URL_US_BESTBUY",
  currency: "USD",
  cats: CATS,
};
const feed = feedStore(STORE);

/** Every word must match: "mesh wifi" → `(search=mesh&search=wifi)`. */
const query = (phrase: string) =>
  `(${phrase
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `search=${encodeURIComponent(w)}`)
    .join("&")})`;

let api: Promise<Map<CategoryId, RawOffer[]>> | undefined;

async function readApi(key: string): Promise<Map<CategoryId, RawOffer[]>> {
  const rows: FeedRow[] = [];
  const seen = new Set<number>();
  let calls = 0;
  for (const phrases of Object.values(SEARCH)) {
    for (const phrase of phrases) {
      for (let page = 1; page <= 10; page++) {
        const url = `https://api.bestbuy.com/v1/products${query(phrase)}?apiKey=${key}&format=json&pageSize=100&page=${page}&show=sku,name,upc,salePrice,regularPrice,onlineAvailability,url,condition,manufacturer,modelNumber,image`;
        const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
        calls++;
        await sleep(250);
        if (res.status === 403 || res.status === 429) {
          console.log(`us-bestbuy: ${res.status} after ${calls} API calls`);
          if (calls === 1) throw new Error(`Best Buy API ${res.status}`);
          return finish(rows, calls);
        }
        if (!res.ok) break;
        const j = (await res.json()) as {
          products?: Product[];
          totalPages?: number;
        };
        for (const p of j.products ?? []) {
          if (seen.has(p.sku) || !p.url) continue;
          seen.add(p.sku);
          rows.push({
            id: String(p.sku),
            title: p.name,
            link: p.url,
            price:
              p.regularPrice !== undefined ? String(p.regularPrice) : undefined,
            salePrice:
              p.salePrice !== undefined ? String(p.salePrice) : undefined,
            currency: "USD",
            condition: p.condition ?? "new",
            availability:
              p.onlineAvailability === false ? "out of stock" : "in stock",
            brand: p.manufacturer,
            mpn: p.modelNumber,
            image: p.image,
            gtin: p.upc,
          });
        }
        if (
          !j.products?.length ||
          (j.totalPages !== undefined && page >= j.totalPages)
        )
          break;
      }
    }
  }
  return finish(rows, calls);
}

function finish(rows: FeedRow[], calls: number): Map<CategoryId, RawOffer[]> {
  const out = rowsToOffers(STORE, rows);
  console.log(
    `us-bestbuy: ${calls} API calls, ${rows.length} products, ${[...out.values()].reduce((n, l) => n + l.length, 0)} offers`,
  );
  return out;
}

async function scrape(cat: Cat): Promise<RawOffer[]> {
  const key = process.env.BESTBUY_API_KEY || "";
  const out = new Map<string, RawOffer>();
  for (const o of (await feed[cat]?.()) ?? []) out.set(o.sku, o);
  if (key)
    for (const o of (await (api ??= readApi(key))).get(cat) ?? [])
      out.set(o.sku, o);
  return [...out.values()];
}

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> =
  process.env.BESTBUY_API_KEY || process.env.FEED_URL_US_BESTBUY
    ? Object.fromEntries(CATS.map((c) => [c, () => scrape(c)]))
    : {};
