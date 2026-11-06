/** Europace (europace.com.sg): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Singapore). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "sg-europace",
  base: "https://www.europace.com.sg",
  brand: "Europace",
  cats: ["washing-machines", "fridges", "small-kitchen"],
});
