/** Audio Emotion (audioemotion.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-audioemotion",
  base: "https://www.audioemotion.co.uk",
  cats: ["headphones", "soundbars", "tvs"],
});
