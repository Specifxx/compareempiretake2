/** ECS Coffee (ecscoffee.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06 round 22b, Canada). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "ca-ecscoffee",
  base: "https://ecscoffee.com",
  cats: ["coffee-machines", "coffee-gear", "small-kitchen"],
  exclude: /return|open box/i,
});
