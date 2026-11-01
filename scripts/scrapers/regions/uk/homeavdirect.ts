/** Home AV Direct (homeavdirect.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-homeavdirect",
  base: "https://www.homeavdirect.co.uk",
  cats: ["soundbars", "headphones", "speakers"],
});
