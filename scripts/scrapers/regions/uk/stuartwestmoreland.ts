/** Stuart Westmoreland (stuartwestmoreland.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 12). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-stuartwestmoreland",
  base: "https://www.stuartwestmoreland.co.uk",
  exclude: /box opened|graded|ex[- ]display/i,
  cats: ["vacuums", "tvs", "coffee-machines", "air-fryers", "dishwashers", "washing-machines", "soundbars", "robot-vacuums", "fridges", "bbqs", "coffee-gear", "hair-care", "small-kitchen"],
});
