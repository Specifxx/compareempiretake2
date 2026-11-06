/** Audio Excellence (audioexcellence.ca): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Canada). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "ca-audioexcellence",
  base: "https://www.audioexcellence.ca",
  cats: ["headphones", "speakers", "soundbars"],
});
