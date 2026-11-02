/** Central Coast Coffee (centralcoastcoffee.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-02, new categories). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "centralcoastcoffee",
  base: "https://www.centralcoastcoffee.com.au",
  cats: ["coffee-gear"],
});
