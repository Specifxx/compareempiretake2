/** Value Electronics (valueelectronics.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-valueelectronics",
  base: "https://www.valueelectronics.com",
  cats: ["soundbars", "headphones", "speakers"],
});
