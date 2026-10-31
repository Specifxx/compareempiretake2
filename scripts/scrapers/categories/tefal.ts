/** Tefal AU (tefal.com.au, Shopify): air fryers. Titles end with the model code ("... Air Fryer EY9488"). */
import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { shopAppliances } from "../appliance-shop";

export const scrapers: Partial<Record<Exclude<CategoryId, "phones">, () => Promise<RawOffer[]>>> = {
  "air-fryers": () => shopAppliances("air-fryers", { retailer: "tefal", base: "https://www.tefal.com.au", types: { "air-fryers": /^Air Fryers$/i }, brand: () => "Tefal", addBrand: true }),
};
