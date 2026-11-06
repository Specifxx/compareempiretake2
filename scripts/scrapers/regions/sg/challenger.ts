/** Challenger (challenger.sg): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Singapore). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "sg-challenger",
  base: "https://www.challenger.sg",
  cats: ["phones", "tablets", "laptops", "desktops", "monitors", "graphics-cards", "ssds", "routers", "headphones", "smartwatches", "consoles", "drones", "hair-care", "air-fryers"],
});
