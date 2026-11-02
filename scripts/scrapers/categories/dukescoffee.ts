/** Dukes Coffee Roasters (dukescoffee.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 5). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "dukescoffee",
  base: "https://www.dukescoffee.com.au",
  cats: ["coffee-machines", "coffee-gear"],
});
