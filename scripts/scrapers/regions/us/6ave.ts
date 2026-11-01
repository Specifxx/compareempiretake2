/** 6th Ave Electronics (6ave.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 2). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-6ave",
  base: "https://www.6ave.com",
  cats: ["cameras", "smartwatches"],
  // 6ave makes its own kits (an extra card, AirPods, "and more"); only the plain product is compared.
  exclude: /creator kit|pro kit|\bkit with\b|with apple|airpods|\band more\b|\+ ?\d+ ?gb|memory card|keyboard\)|stop motion/i,
});
