/** Union Coffee (unionroasted.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-02, new categories). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-unionroasted",
  base: "https://www.unionroasted.com",
  cats: ["coffee-gear"],
});
