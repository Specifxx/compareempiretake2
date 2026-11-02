/** Potters Cookshop (potterscookshop.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 14). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-potterscookshop",
  base: "https://www.potterscookshop.co.uk",
  cats: ["coffee-machines", "air-fryers", "coffee-gear", "small-kitchen"],
});
