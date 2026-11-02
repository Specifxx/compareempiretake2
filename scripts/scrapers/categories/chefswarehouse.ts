/** Chefs Warehouse (chefswarehouse.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-02, new categories). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "chefswarehouse",
  base: "https://www.chefswarehouse.com.au",
  cats: ["coffee-gear", "small-kitchen"],
});
