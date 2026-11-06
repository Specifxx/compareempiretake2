/** Home Coffee Solutions (homecoffeesolutions.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Canada). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "ca-homecoffeesolutions",
  base: "https://www.homecoffeesolutions.com",
  cats: ["coffee-machines", "coffee-gear", "small-kitchen"],
});
