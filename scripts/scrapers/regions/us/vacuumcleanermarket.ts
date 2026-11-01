/** Vacuum Cleaner Market (vacuumcleanermarket.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-vacuumcleanermarket",
  base: "https://www.vacuumcleanermarket.com",
  cats: ["vacuums"],
});
