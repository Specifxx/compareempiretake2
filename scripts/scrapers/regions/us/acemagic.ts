/** ACEMAGIC (acemagic.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-acemagic",
  base: "https://acemagic.com",
  brand: "ACEMAGIC",
  cats: ["desktops"],
});
