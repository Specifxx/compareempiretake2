/** Appliance Superstore (appliancesuperstore.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 9). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-appliancesuperstore",
  base: "https://www.appliancesuperstore.co.uk",
  exclude: /vacuum drawer|\bhob\b|hood|\boven\b|warming drawer/i,
  cats: ["fridges", "dishwashers", "washing-machines", "coffee-machines", "bbqs", "small-kitchen"],
});
