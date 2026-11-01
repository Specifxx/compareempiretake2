/** Oxford Audio (oxfordaudio.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 3). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-oxfordaudio",
  base: "https://www.oxfordaudio.co.uk",
  cats: ["headphones", "speakers"],
});
