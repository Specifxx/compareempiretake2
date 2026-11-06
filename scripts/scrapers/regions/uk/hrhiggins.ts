/** H.R. Higgins (hrhiggins.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 21). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-hrhiggins",
  base: "https://hrhiggins.co.uk",
  cats: ["coffee-gear"],
});
