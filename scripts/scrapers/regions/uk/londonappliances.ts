/** London Appliances (londonappliances.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 13). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-londonappliances",
  base: "https://www.londonappliances.com",
  exclude: /box opened|graded|ex[- ]display/i,
  cats: ["dishwashers", "fridges", "washing-machines", "coffee-machines"],
});
