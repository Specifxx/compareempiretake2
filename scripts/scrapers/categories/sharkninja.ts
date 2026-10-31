/** SharkNinja AU (sharkninja.com.au, Shopify): Shark vacuums and Ninja air fryers and coffee machines. */
import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { shopAppliances, type ShopOpts } from "../appliance-shop";

const O: ShopOpts = {
  retailer: "sharkninja",
  base: "https://sharkninja.com.au",
  types: { vacuums: /^(Cordless Vacuum|Corded Upright Vacuum|Handheld Vacuum|Wet\/Dry Vacuum|Hydrovac)$/i, "air-fryers": /^Air Fryer$/i, "coffee-machines": /^Coffee Machine$/i },
  brand: (p) => (/ninja/i.test(`${p.vendor} ${p.title}`) ? "Ninja" : "Shark"),
  addBrand: true,
};

export const scrapers: Partial<Record<Exclude<CategoryId, "phones">, () => Promise<RawOffer[]>>> = {
  vacuums: () => shopAppliances("vacuums", O),
  "air-fryers": () => shopAppliances("air-fryers", O),
  "coffee-machines": () => shopAppliances("coffee-machines", O),
};
