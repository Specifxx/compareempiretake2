/** DataVision (datavision.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 21). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-datavision",
  base: "https://datavision.com",
  cats: ["tablets", "laptops", "monitors", "ssds", "printers", "routers", "smartwatches", "robot-vacuums", "cameras", "soundbars", "headphones", "speakers"],
});
