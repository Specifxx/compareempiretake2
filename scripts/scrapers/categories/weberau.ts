/** Weber (anz.weber.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-02, new categories). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "weberau",
  base: "https://anz.weber.com",
  brand: "Weber",
  cats: ["bbqs"],
});
