/** Hoover (hoover.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 2). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "hooverau",
  base: "https://www.hoover.com.au",
  brand: "Hoover",
  cats: ["vacuums"],
});
