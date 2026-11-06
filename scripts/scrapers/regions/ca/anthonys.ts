/** Anthony's Espresso (anthonysespresso.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Canada). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "ca-anthonys",
  base: "https://anthonysespresso.com",
  cats: ["coffee-machines", "coffee-gear"],
});
