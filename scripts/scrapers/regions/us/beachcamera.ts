/** Beach Camera (beachcamera.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-beachcamera",
  base: "https://www.beachcamera.com",
  cats: ["tvs", "headphones", "printers", "monitors", "cameras", "smartwatches", "coffee-machines", "soundbars", "robot-vacuums", "laptops", "air-fryers", "vacuums", "bbqs", "small-kitchen"],
});
