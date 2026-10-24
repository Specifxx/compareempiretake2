/** MAINGEAR (maingear.com, NJ) — Shopify. Pre-configured desktops and laptops by product_type; test listings and the outlet dropped. */
import { shopifyScrapers } from "./_shopify";

export const scrapers = shopifyScrapers({
  retailer: "us-maingear",
  base: "https://www.maingear.com",
  brand: "MAINGEAR",
  exclude: /\btest\b|outlet|bundle|panel/i,
  cats: {
    desktops: { keep: (p) => /^pre-configured pc$/i.test(p.product_type ?? "") && !/outlet/i.test(p.vendor ?? "") },
    laptops: { keep: (p) => /^pre-configured laptop$/i.test(p.product_type ?? "") && !/outlet/i.test(p.vendor ?? "") },
  },
});
