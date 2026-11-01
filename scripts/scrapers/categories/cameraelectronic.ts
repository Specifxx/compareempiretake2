/** Camera Electronic (cameraelectronic.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "cameraelectronic",
  base: "https://www.cameraelectronic.com.au",
  cats: ["cameras", "drones", "ssds"],
});
