/** Gerald Giles (geraldgiles.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-geraldgiles",
  base: "https://www.geraldgiles.co.uk",
  cats: ["washing-machines", "dishwashers", "fridges", "vacuums", "robot-vacuums", "air-fryers", "coffee-machines", "tvs", "soundbars", "headphones", "speakers", "bbqs", "coffee-gear", "small-kitchen"],
});
