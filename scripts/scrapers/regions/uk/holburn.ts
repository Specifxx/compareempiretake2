/** Holburn (holburnonline.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 7). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-holburn",
  base: "https://www.holburnonline.co.uk",
  cats: ["headphones", "speakers", "soundbars"],
});
