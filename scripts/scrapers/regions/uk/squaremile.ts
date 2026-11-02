/** Square Mile Coffee (shop.squaremilecoffee.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-02, new categories). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-squaremile",
  base: "https://shop.squaremilecoffee.com",
  cats: ["coffee-gear"],
});
