/** Atlantic Electrics (atlanticelectrics.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 12). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-atlanticelectrics",
  base: "https://www.atlanticelectrics.co.uk",
  exclude: /box opened|graded|ex[- ]display/i,
  cats: ["fridges", "dishwashers", "washing-machines", "tvs", "coffee-machines", "vacuums", "robot-vacuums", "soundbars", "headphones", "speakers", "air-fryers", "bbqs", "hair-care", "small-kitchen"],
});
