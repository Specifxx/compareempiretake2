/** 200 Degrees (200degs.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-02, new categories). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-200degrees",
  base: "https://200degs.com",
  cats: ["coffee-gear"],
});
