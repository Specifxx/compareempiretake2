/** Atlanta Grill Company (atlantagrillcompany.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-02, new categories). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-atlantagrill",
  base: "https://www.atlantagrillcompany.com",
  cats: ["bbqs", "coffee-gear", "small-kitchen"],
});
