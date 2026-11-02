/** Tefal (tefal.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 7). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "tefalau",
  base: "https://www.tefal.com.au",
  brand: "Tefal",
  cats: ["air-fryers", "small-kitchen"],
});
