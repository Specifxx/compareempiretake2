/** Billy Guyatts (billyguyatts.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "billyguyatts",
  base: "https://www.billyguyatts.com.au",
  cats: ["robot-vacuums", "vacuums", "air-fryers", "coffee-machines", "fridges", "washing-machines", "dishwashers", "soundbars", "headphones", "speakers", "tvs", "monitors", "printers", "bbqs", "coffee-gear", "hair-care", "small-kitchen"],
});
