/** Pictureline (pictureline.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-pictureline",
  base: "https://www.pictureline.com",
  cats: ["cameras", "ssds", "drones"],
});
