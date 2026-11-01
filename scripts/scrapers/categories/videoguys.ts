/** Videoguys (videoguys.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 12). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "videoguys",
  base: "https://www.videoguys.com.au",
  exclude: /mount|monitoring system|transmitter|receiver/i,
  cats: ["drones", "headphones"],
});
