/** Haden (haden.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 5). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-haden",
  base: "https://www.haden.com",
  brand: "Haden",
  cats: ["air-fryers", "fridges", "washing-machines", "small-kitchen"],
});
