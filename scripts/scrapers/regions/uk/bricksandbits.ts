/** Bricks and Bits (bricksandbitstoyshop.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 4). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-bricksandbits",
  base: "https://www.bricksandbitstoyshop.com",
  cats: ["lego"],
});
