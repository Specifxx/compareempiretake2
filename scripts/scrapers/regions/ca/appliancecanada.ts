/** Appliance Canada (appliancecanada.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Canada). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "ca-appliancecanada",
  base: "https://www.appliancecanada.com",
  cats: ["fridges", "washing-machines", "dishwashers", "bbqs", "coffee-machines", "small-kitchen"],
});
