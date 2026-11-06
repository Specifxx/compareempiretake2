/** Appliance Canada (appliancecanada.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Canada). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "ca-appliancecanada",
  base: "https://www.appliancecanada.com",
  // Each listing is repeated with a stock code ("ZAA", "ZAZ"…); only the ZAA copy is read, one per product.
  exclude: /\bZA[B-Z]\b/,
  cats: ["fridges", "washing-machines", "dishwashers", "bbqs", "coffee-machines", "small-kitchen"],
});
