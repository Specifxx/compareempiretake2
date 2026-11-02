/** Ooni (au.ooni.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-02, new categories). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "oonau",
  base: "https://au.ooni.com",
  brand: "Ooni",
  cats: ["bbqs"],
});
