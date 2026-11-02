/** Alternative Brewing (alternativebrewing.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "alternativebrewing",
  base: "https://www.alternativebrewing.com.au",
  cats: ["coffee-machines", "coffee-gear", "small-kitchen"],
});
