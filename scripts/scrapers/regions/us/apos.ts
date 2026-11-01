/** Apos Audio (apos.audio): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-apos",
  base: "https://apos.audio",
  cats: ["headphones"],
});
