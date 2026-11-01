/** Toys N Tuck (toysntuck.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 13). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-toysntuck",
  base: "https://www.toysntuck.co.uk",
  cats: ["lego"],
});
