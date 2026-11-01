/** Absolute Hi-Fi (absolutehifi.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 3). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "absolutehifi",
  base: "https://www.absolutehifi.com.au",
  cats: ["speakers", "soundbars", "headphones"],
});
