/** Morphy Richards (morphyrichards.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 2). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-morphyrichards",
  base: "https://www.morphyrichards.co.uk",
  brand: "Morphy Richards",
  cats: ["coffee-machines", "air-fryers", "vacuums", "small-kitchen"],
});
