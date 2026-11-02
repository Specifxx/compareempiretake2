/** Coffee Beanery (coffeebeanery.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-02, new categories). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "coffeebeanery",
  base: "https://www.coffeebeanery.com.au",
  cats: ["coffee-gear"],
});
