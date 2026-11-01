/** Georges Cameras (georges.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "georges",
  base: "https://www.georges.com.au",
  cats: ["cameras", "drones", "ssds"],
});
