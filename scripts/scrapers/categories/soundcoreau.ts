/** soundcore (au.soundcore.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 2). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "soundcoreau",
  base: "https://au.soundcore.com",
  brand: "soundcore",
  cats: ["headphones", "speakers"],
});
