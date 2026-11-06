/** Netgate (shop.netgate.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 21). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-netgate",
  base: "https://shop.netgate.com",
  cats: ["routers"],
});
