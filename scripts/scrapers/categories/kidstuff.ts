/** Kidstuff (www.kidstuff.com.au, Shopify): LEGO sets from its LEGO collection, matched by set number (scripts/scrapers/lego.ts). */
import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { legoShop } from "../lego";

export const scrapers: Partial<Record<Exclude<CategoryId, "phones">, () => Promise<RawOffer[]>>> = {
  lego: () => legoShop({ retailer: "kidstuff", base: "https://www.kidstuff.com.au", collections: ["lego"] }),
};
