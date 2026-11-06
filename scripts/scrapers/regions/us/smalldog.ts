/** Small Dog Electronics (smalldog.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 23). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-smalldog",
  base: "https://smalldog.com",
  cats: ["laptops", "tablets", "desktops", "headphones", "speakers", "soundbars", "monitors", "printers"],
});
