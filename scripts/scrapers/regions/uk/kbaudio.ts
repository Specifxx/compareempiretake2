/** KB Audio (kbaudio.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 21). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-kbaudio",
  base: "https://kbaudio.co.uk",
  cats: ["speakers", "soundbars", "headphones"],
});
