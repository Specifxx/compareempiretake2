/** Appliance City (appliancecity.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-appliancecity",
  base: "https://www.appliancecity.co.uk",
  cats: ["dishwashers", "washing-machines", "fridges", "robot-vacuums", "coffee-machines", "air-fryers", "soundbars", "vacuums", "tvs"],
});
