/** Levoit (levoit.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 8). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-levoit",
  base: "https://www.levoit.co.uk",
  brand: "Levoit",
  cats: ["vacuums"],
});
