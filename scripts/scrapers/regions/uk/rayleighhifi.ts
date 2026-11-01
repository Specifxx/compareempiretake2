/** Rayleigh Hi-Fi (rayleighhifi.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 3). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-rayleighhifi",
  base: "https://www.rayleighhifi.com",
  cats: ["speakers", "soundbars"],
});
