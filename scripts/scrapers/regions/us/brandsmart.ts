/** BrandsMart USA (brandsmartusa.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 2). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-brandsmart",
  base: "https://www.brandsmartusa.com",
  cats: ["tvs", "robot-vacuums", "vacuums", "printers", "dishwashers", "headphones", "speakers", "soundbars", "monitors", "laptops", "tablets", "air-fryers", "coffee-machines", "drones"],
});
