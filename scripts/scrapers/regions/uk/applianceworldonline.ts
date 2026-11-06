/** Appliance World (applianceworldonline.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 21). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-applianceworldonline",
  base: "https://applianceworldonline.com",
  cats: ["fridges", "small-kitchen", "washing-machines", "dishwashers", "vacuums", "air-fryers", "robot-vacuums"],
});
