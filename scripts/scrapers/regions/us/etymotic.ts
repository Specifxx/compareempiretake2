/** Etymotic (etymotic.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 21). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-etymotic",
  base: "https://etymotic.com",
  cats: ["headphones"],
});
