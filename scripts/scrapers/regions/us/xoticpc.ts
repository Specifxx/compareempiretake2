/** Xotic PC (xoticpc.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 3). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-xoticpc",
  base: "https://www.xoticpc.com",
  cats: ["monitors", "laptops", "desktops", "headphones"],
});
