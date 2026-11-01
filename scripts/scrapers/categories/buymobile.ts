/** BuyMobile (buymobile.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 13). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "buymobile",
  base: "https://www.buymobile.com.au",
  cats: ["headphones", "smartwatches", "tablets"],
});
