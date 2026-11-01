/** Len Wallis Audio (lenwallisaudio.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "lenwallis",
  base: "https://www.lenwallisaudio.com",
  cats: ["soundbars", "headphones"],
});
