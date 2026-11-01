/** Hadley Bricks (hadleybricks.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 4). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-hadleybricks",
  base: "https://www.hadleybricks.co.uk",
  cats: ["lego"],
});
