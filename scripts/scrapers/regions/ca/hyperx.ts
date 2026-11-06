/** HyperX (ca.hyperx.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Canada). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "ca-hyperx",
  base: "https://ca.hyperx.com",
  cats: ["headphones", "monitors", "desktops"],
});
