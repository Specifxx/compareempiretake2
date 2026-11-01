/** AOL Cookshop (aolcookshop.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 12). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-aolcookshop",
  base: "https://www.aolcookshop.co.uk",
  cats: ["coffee-machines"],
});
