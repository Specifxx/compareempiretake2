/** Padre Coffee (padrecoffee.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-02, new categories). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "padrecoffee",
  base: "https://www.padrecoffee.com.au",
  cats: ["coffee-gear"],
});
