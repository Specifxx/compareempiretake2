/** Sharper Image (sharperimage.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 21). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-sharperimage",
  base: "https://sharperimage.com",
  cats: ["vacuums", "air-fryers", "coffee-machines", "hair-care", "small-kitchen"],
});
