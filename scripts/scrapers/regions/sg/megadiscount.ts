/** Mega Discount Store (megadiscountstore.com.sg): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Singapore). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "sg-megadiscount",
  base: "https://www.megadiscountstore.com.sg",
  cats: ["washing-machines", "fridges", "dishwashers", "tvs", "soundbars", "robot-vacuums", "vacuums", "air-fryers", "coffee-machines", "hair-care", "small-kitchen"],
  exclude: /shaver|purifier|water heater|wine chiller|e-?voucher/i,
});
