/** Redber Coffee (redber.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 3). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-redber",
  base: "https://www.redber.co.uk",
  cats: ["coffee-machines", "coffee-gear", "small-kitchen"],
});
