/**
 * What Compare Empire lists (owner, 2026-11-07: "cull the site significantly ... we only want the popular, what's in the
 * trend, what's relevant in the market right now ... not targeting people who will only buy the very cheap things").
 * DECISIONS.md "The focus cull".
 *
 * Two cuts, both pure so the catalogue script (scripts/focus-catalog.ts), the page loader (lib/catalog.ts) and
 * tests/focus.test.ts read the same rules:
 *
 * 1. Retired categories. Search Console's 56 days to 2026-11-06 gave them no clicks and almost no impressions (whitegoods,
 *    kitchen, BBQs, hair, printers, PC memory/storage/boards), and none is a trend or resale-liquid product. Their URLs
 *    301 (next.config.mjs RETIRED, pinned to this list by the test) to the nearest kept category, else the region's home.
 * 2. In every kept category a product stays only when it is a current, wanted product: a brand people search for in that
 *    category, at a price above the budget end, on sale today (in stock or on pre-order) and, in Australia and the UK
 *    where stores overlap, compared by two or more stores. Any product page Search Console shows real demand for (a
 *    click, or DEMAND_MIN_IMPRESSIONS) stays whatever the rules say, so no page that earns search traffic is cut.
 *
 * A culled product's URL 301s to its category (views/ProductView.tsx); it comes back by itself the day it qualifies.
 */
import { LAUNCHES } from "../content/launches";
import type { RegionId } from "./region";
import type { CategoryId, Phone } from "./types";

/** Retired category → where its URLs go: a kept category, or null for the region's home. */
export const RETIRED_CATEGORIES: Partial<Record<CategoryId, CategoryId | null>> = {
  "coffee-gear": "coffee-machines",
  "small-kitchen": "coffee-machines",
  "air-fryers": null,
  "hair-care": null,
  bbqs: null,
  fridges: null,
  "washing-machines": null,
  dishwashers: null,
  printers: "laptops",
  ram: "graphics-cards",
  ssds: "graphics-cards",
  motherboards: "graphics-cards",
};
export const isRetired = (c: string) => c in RETIRED_CATEGORIES;

/** Local prices per US dollar, roughly (only to place the budget floor; prices are never converted for display). */
const PER_USD: Record<RegionId, number> = { us: 1, au: 1.5, uk: 0.8, ca: 1.4, sg: 1.35 };

interface Rule {
  /** The budget end, in US dollars: a product whose cheapest price is under it is not listed. */
  floorUsd: number;
  /** The brands buyers search for in this category (compared case- and punctuation-blind). */
  brands: string[];
}

export const FOCUS: Partial<Record<CategoryId, Rule>> = {
  phones: { floorUsd: 400, brands: ["Apple", "Samsung", "Google", "OnePlus", "Nothing", "Motorola", "OPPO", "Xiaomi", "Sony", "HONOR"] },
  tablets: { floorUsd: 300, brands: ["Apple", "Samsung", "Microsoft", "Lenovo", "OnePlus", "Google"] },
  smartwatches: { floorUsd: 200, brands: ["Apple", "Samsung", "Garmin", "Google"] },
  laptops: { floorUsd: 800, brands: ["Apple", "ASUS", "Lenovo", "MSI", "Dell", "HP", "Microsoft", "Razer", "Gigabyte", "Acer", "Alienware", "Samsung", "LG"] },
  desktops: { floorUsd: 1000, brands: ["Apple", "ASUS", "MSI", "Alienware", "Corsair", "NZXT", "Lenovo", "HP", "Dell"] },
  monitors: { floorUsd: 300, brands: ["LG", "Samsung", "ASUS", "MSI", "Dell", "Alienware", "BenQ", "Gigabyte", "Apple", "Acer"] },
  routers: { floorUsd: 200, brands: ["TP-Link", "ASUS", "Ubiquiti", "Netgear", "Eero", "Synology"] },
  "graphics-cards": { floorUsd: 400, brands: ["ASUS", "Gigabyte", "MSI", "Zotac", "Sapphire", "XFX", "PNY", "NVIDIA", "PowerColor", "Palit", "Inno3D", "Gainward", "ASRock"] },
  cpus: { floorUsd: 250, brands: ["AMD", "Intel"] },
  tvs: { floorUsd: 800, brands: ["Samsung", "LG", "Sony", "Hisense", "TCL", "Panasonic", "Philips"] },
  soundbars: { floorUsd: 400, brands: ["Samsung", "Sony", "Sonos", "LG", "Bose", "JBL", "Denon", "Yamaha", "Bluesound", "Devialet"] },
  headphones: {
    floorUsd: 150,
    brands: ["Apple", "Sony", "Bose", "Sennheiser", "Bowers & Wilkins", "Beats", "Samsung", "Google", "Nothing", "Marshall", "Bang & Olufsen", "JBL", "Focal", "Shure", "Audio-Technica", "Sonos"],
  },
  speakers: { floorUsd: 250, brands: ["Sonos", "Bose", "JBL", "Bowers & Wilkins", "Marshall", "Bang & Olufsen", "Apple", "Sony", "Ultimate Ears", "Devialet", "KEF", "Klipsch"] },
  consoles: { floorUsd: 250, brands: ["Nintendo", "Sony", "Microsoft", "ASUS", "Lenovo", "MSI", "Valve"] },
  cameras: { floorUsd: 400, brands: ["Sony", "Fujifilm", "Nikon", "Canon", "Leica", "DJI", "Panasonic", "OM System", "Ricoh", "GoPro", "Insta360", "Hasselblad", "Sigma"] },
  drones: { floorUsd: 300, brands: ["DJI", "Autel", "HOVERAir"] },
  "robot-vacuums": { floorUsd: 400, brands: ["Roborock", "Dreame", "Ecovacs", "iRobot", "Narwal", "Eufy", "Shark", "Samsung", "MOVA", "Dyson"] },
  vacuums: { floorUsd: 300, brands: ["Dyson", "Shark", "Samsung", "LG", "Dreame", "Miele", "Tineco"] },
  "coffee-machines": {
    floorUsd: 500,
    brands: ["Breville", "Sage", "De'Longhi", "Jura", "Miele", "Philips", "Lelit", "Rocket Espresso", "Profitec", "La Marzocco", "Rancilio", "Gaggia", "Ninja", "Smeg"],
  },
  lego: { floorUsd: 150, brands: ["LEGO"] },
};

/** A product page Search Console shows this many impressions for (56 days), or any click, is never culled. */
export const DEMAND_MIN_IMPRESSIONS = 20;
/**
 * Regions where stores overlap enough that a product must be compared (two or more stores) to be listed, and the
 * categories exempt from that: the flagship devices, where a few walled chains sell most of them and one store's price
 * on the newest model is still what buyers search for (UK phones: 13 of 197 at two stores, 2026-11-07).
 */
const COMPARED_REGIONS = new Set<RegionId>(["au", "uk"]);
const FLAGSHIP_CATEGORIES = new Set<CategoryId>(["phones", "tablets", "smartwatches", "consoles"]);

const fold = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const brandSets = new Map<CategoryId, Set<string>>();
const brandsOf = (c: CategoryId) => {
  let s = brandSets.get(c);
  if (!s) brandSets.set(c, (s = new Set((FOCUS[c]?.brands ?? []).map(fold))));
  return s;
};

/** The page path a product lives at ("/phones/x", "/us/phones/x"): the key Search Console's page export uses. */
export const productPath = (category: string, slug: string, region: RegionId) => `${region === "au" ? "" : `/${region}`}/${category}/${slug}`;

/** Search Console page rows ([clicks, impressions, position] by path) → the paths with real demand. */
export function demandPaths(pages: Record<string, [number, number, number?]>): string[] {
  return Object.entries(pages)
    .filter(([, [clicks, impressions]]) => clicks > 0 || impressions >= DEMAND_MIN_IMPRESSIONS)
    .map(([path]) => path)
    .sort();
}

type FocusProduct = Pick<Phone, "slug" | "name" | "brand" | "bestPrice" | "retailerCount" | "variants">;

const folded = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
/** A hype launch on the homepage calendar (content/launches.ts): listed in every region from its first store. */
export const isLaunch = (p: Pick<Phone, "name">, category: CategoryId) => LAUNCHES.some((l) => l.category === category && l.match.test(folded(p.name)));

/** Why a product is kept, or null when it is culled. */
export function focusReason(p: FocusProduct, category: CategoryId, region: RegionId, demand: ReadonlySet<string>): "demand" | "launch" | "focus" | null {
  if (isRetired(category)) return null;
  if (demand.has(productPath(category, p.slug, region))) return "demand";
  if (isLaunch(p, category)) return "launch";
  const rule = FOCUS[category];
  if (!rule) return null;
  if (!brandsOf(category).has(fold(p.brand))) return null;
  if (p.bestPrice < rule.floorUsd * PER_USD[region]) return null;
  if (!p.variants.some((v) => v.offers.some((o) => o.kind !== "plan" && (o.inStock || o.preorder)))) return null;
  if (COMPARED_REGIONS.has(region) && !FLAGSHIP_CATEGORIES.has(category) && p.retailerCount < 2) return null;
  return "focus";
}
export const inFocus = (p: FocusProduct, category: CategoryId, region: RegionId, demand: ReadonlySet<string>) => focusReason(p, category, region, demand) !== null;
