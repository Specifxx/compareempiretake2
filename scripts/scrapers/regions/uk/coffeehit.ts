/** Coffee Hit (coffeehit.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-coffeehit",
  base: "https://www.coffeehit.co.uk",
  cats: ["coffee-machines", "coffee-gear"],
});
