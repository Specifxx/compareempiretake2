/** Shokz (sg.shokz.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Singapore). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "sg-shokz",
  base: "https://sg.shokz.com",
  brand: "Shokz",
  cats: ["headphones"],
});
