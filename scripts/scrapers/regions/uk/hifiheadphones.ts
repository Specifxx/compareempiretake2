/** Hifi Headphones (hifiheadphones.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-hifiheadphones",
  base: "https://www.hifiheadphones.co.uk",
  cats: ["headphones"],
});
