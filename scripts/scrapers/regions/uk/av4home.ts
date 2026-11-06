/** AV4Home (av4home.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 21). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-av4home",
  base: "https://av4home.co.uk",
  cats: ["tvs", "speakers"],
});
