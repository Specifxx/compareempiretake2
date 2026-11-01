/** The Playroom (theplayroom.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 13). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "theplayroom",
  base: "https://www.theplayroom.com.au",
  cats: ["lego"],
});
