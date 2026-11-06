/** Common Man Coffee Roasters (commonmancoffeeroasters.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Singapore). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "sg-commonman",
  base: "https://www.commonmancoffeeroasters.com",
  cats: ["coffee-gear"],
});
