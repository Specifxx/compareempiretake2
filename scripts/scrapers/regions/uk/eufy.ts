/**
 * eufy UK official store (uk.eufy.com, Shopify): robot vacuums (product_type "RoboVac" or "Vacuums", robots only by title).
 * Store bundles ("… with Smart Scale", SKUs starting BUNDLE-) are skipped; the SKU of a single robot is eufy's
 * model code (e.g. T2353V11), kept as mpn.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { shopifyUk, typeIs } from "./_shopify";

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  "robot-vacuums": async () =>
    (await shopifyUk("uk-eufy", "https://uk.eufy.com", "robot-vacuums", { pick: typeIs("RoboVac", "Vacuums"), extraJunk: /\bwith smart scale\b|\bbundle\b|\+ /i })).filter(
      (o) => !/^BUNDLE/i.test(o.sku),
    ),
};
