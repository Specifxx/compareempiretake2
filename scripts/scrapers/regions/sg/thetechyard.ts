/** The Tech Yard (thetechyard.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Singapore). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "sg-thetechyard",
  base: "https://www.thetechyard.com",
  cats: ["cpus", "motherboards", "graphics-cards", "monitors", "ssds", "headphones", "laptops"],
});
