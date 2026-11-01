/** Austin Computers (austin.net.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "austin",
  base: "https://www.austin.net.au",
  cats: ["graphics-cards", "cpus", "motherboards", "ram", "ssds", "monitors", "routers", "headphones", "robot-vacuums"],
});
