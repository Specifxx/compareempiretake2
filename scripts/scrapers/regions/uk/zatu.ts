/** Zatu Games (zatu.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 9). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-zatu",
  base: "https://www.zatu.com",
  cats: ["lego"],
});
