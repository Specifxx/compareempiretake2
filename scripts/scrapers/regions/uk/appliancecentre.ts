/** Appliance Centre (appliancecentre.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 2). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-appliancecentre",
  base: "https://www.appliancecentre.co.uk",
  cats: ["washing-machines", "dishwashers", "vacuums", "fridges", "coffee-machines"],
});
