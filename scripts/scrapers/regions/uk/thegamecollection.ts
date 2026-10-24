/**
 * The Game Collection (thegamecollection.net, Shopify): consoles from the "Hardware > …" product types.
 * Controllers, Portal remote players and other hardware accessories are dropped by the shared console title check.
 * Store bundles that add games or a microSD card are real boxed products sold as listed and keep their full title.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { shopifyUk } from "./_shopify";

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  consoles: () =>
    shopifyUk("uk-thegamecollection", "https://www.thegamecollection.net", "consoles", {
      pick: (p) => /^Hardware\b/i.test(p.product_type),
      extraJunk: /controller|dualsense|portal|remote player|headset|charging|\bcase\b/i,
      mpn: () => undefined,
    }),
};
