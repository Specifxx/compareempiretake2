/** 614 Barber Supply (614barbersupply.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 21). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-614barbersupply",
  base: "https://614barbersupply.com",
  cats: ["hair-care"],
});
