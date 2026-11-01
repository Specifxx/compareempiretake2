/** Brick-a-Brac (brickabrac.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 14). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-brickabrac",
  base: "https://www.brickabrac.co.uk",
  cats: ["lego"],
});
