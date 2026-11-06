/** eCollegePC (ecollegepc.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 22). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-ecollegepc",
  base: "https://ecollegepc.com",
  cats: ["cpus", "ram", "graphics-cards", "ssds"],
});
