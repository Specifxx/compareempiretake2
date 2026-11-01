/** The Brick Bin (brickbin.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 4). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-brickbin",
  base: "https://www.brickbin.co.uk",
  cats: ["lego"],
});
