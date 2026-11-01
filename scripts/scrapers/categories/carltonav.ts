/** Carlton Audio Visual (carltonaudiovisual.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 2). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "carltonav",
  base: "https://www.carltonaudiovisual.com.au",
  cats: ["headphones", "soundbars", "speakers", "tvs"],
});
