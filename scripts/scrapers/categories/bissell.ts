/** BISSELL AU (bissell.com.au, Shopify): its own vacuums. "Damaged Carton" stock is refused as not new. */
import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { shopAppliances } from "../appliance-shop";

export const scrapers: Partial<Record<Exclude<CategoryId, "phones">, () => Promise<RawOffer[]>>> = {
  vacuums: () => shopAppliances("vacuums", { retailer: "bissell", base: "https://bissell.com.au", types: { vacuums: /^Vacuums$/i }, brand: () => "Bissell", addBrand: true }),
};
