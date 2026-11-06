/** Consiglio's Kitchenware (consiglioskitchenware.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Canada). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "ca-consiglios",
  base: "https://www.consiglioskitchenware.com",
  cats: ["coffee-machines", "coffee-gear", "small-kitchen"],
});
