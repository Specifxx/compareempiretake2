/** Cloud Nine (cloudninehair.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-02, new categories). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "cloudnineau",
  base: "https://www.cloudninehair.com.au",
  brand: "Cloud Nine",
  cats: ["hair-care"],
});
