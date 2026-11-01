/** HiFi Lounge (hifilounge.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 8). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-hifilounge",
  base: "https://www.hifilounge.co.uk",
  exclude: /energiser|amplifier|cable|stand\b/i,
  cats: ["headphones", "speakers"],
});
