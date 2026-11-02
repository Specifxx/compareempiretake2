/** T3 (t3micro.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-02, new categories). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-t3",
  base: "https://www.t3micro.com",
  brand: "T3",
  cats: ["hair-care"],
});
