/** Addicted to Audio (addictedtoaudio.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "addictedtoaudio",
  base: "https://www.addictedtoaudio.com.au",
  cats: ["headphones", "soundbars", "speakers"],
});
