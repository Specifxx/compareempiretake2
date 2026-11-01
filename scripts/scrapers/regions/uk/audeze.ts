/** Audeze (audeze.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 9). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-audeze",
  base: "https://www.audeze.co.uk",
  brand: "Audeze",
  cats: ["headphones"],
});
