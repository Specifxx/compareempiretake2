/** iDrinkCoffee (idrinkcoffee.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Canada). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "ca-idrinkcoffee",
  base: "https://www.idrinkcoffee.com",
  cats: ["coffee-machines", "coffee-gear"],
});
