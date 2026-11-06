/** TechForLess (techforless.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 22). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-techforless",
  base: "https://techforless.com",
  // TechForLess also sells refurbished and open-box stock: refused here as well as by the shared rules.
  exclude: /refurb|open[- ]?box|renewed|pre-?owned|used\b|grade [abc]\b/i,
  cats: ["laptops", "monitors", "tvs", "consoles", "headphones", "smartwatches", "graphics-cards", "printers", "routers", "speakers"],
});
