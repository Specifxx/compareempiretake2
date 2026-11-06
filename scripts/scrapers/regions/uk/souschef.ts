/** Sous Chef (souschef.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 21). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-souschef",
  base: "https://souschef.co.uk",
  cats: ["small-kitchen", "coffee-gear", "bbqs"],
});
