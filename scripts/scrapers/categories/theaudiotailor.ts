/** The Audio Tailor (theaudiotailor.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 3). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "theaudiotailor",
  base: "https://www.theaudiotailor.com.au",
  cats: ["soundbars", "speakers", "headphones"],
});
