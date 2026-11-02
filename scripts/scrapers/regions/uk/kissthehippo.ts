/** Kiss the Hippo (kissthehippo.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 6). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-kissthehippo",
  base: "https://www.kissthehippo.com",
  cats: ["coffee-machines", "coffee-gear"],
});
