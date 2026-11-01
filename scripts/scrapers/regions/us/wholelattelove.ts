/** Whole Latte Love (wholelattelove.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-wholelattelove",
  base: "https://www.wholelattelove.com",
  cats: ["coffee-machines"],
});
