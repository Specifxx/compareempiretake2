/** Minimax (minimax.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-02, new categories). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "minimax",
  base: "https://minimax.com.au",
  cats: ["bbqs", "coffee-gear", "small-kitchen"],
});
