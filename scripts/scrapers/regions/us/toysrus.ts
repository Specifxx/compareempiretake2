/** Toys"R"Us (toysrus.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-toysrus",
  base: "https://www.toysrus.com",
  cats: ["lego"],
});
