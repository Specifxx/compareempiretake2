/** Ask Direct (askdirect.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 21). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-askdirect",
  base: "https://askdirect.co.uk",
  cats: ["washing-machines", "dishwashers", "fridges", "tvs", "soundbars", "speakers", "headphones", "cameras", "vacuums"],
});
