/**
 * Roborock UK official store (uk.roborock.com, Shopify): robot vacuums (product_type "Robot Vacuums").
 * SKUs are Roborock UK's own codes (RRUK-…), so mpn stays empty; the model is in the title.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { shopifyUk, typeIs } from "./_shopify";

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  "robot-vacuums": () => shopifyUk("uk-roborock", "https://uk.roborock.com", "robot-vacuums", { pick: typeIs("Robot Vacuums"), mpn: () => undefined }),
};
