/** soundcore (ca.soundcore.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Canada). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "ca-soundcore",
  base: "https://ca.soundcore.com",
  brand: "soundcore",
  cats: ["headphones", "speakers"],
});
