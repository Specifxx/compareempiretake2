/** AMP3 (amp3.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 21). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-amp3",
  base: "https://amp3.co.uk",
  cats: ["headphones", "speakers"],
});
