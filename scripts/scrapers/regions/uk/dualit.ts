/** Dualit (dualit.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 3). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-dualit",
  base: "https://www.dualit.com",
  brand: "Dualit",
  cats: ["coffee-machines"],
});
