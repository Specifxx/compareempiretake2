/** Bella Barista (bellabarista.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-bellabarista",
  base: "https://www.bellabarista.co.uk",
  cats: ["coffee-machines", "coffee-gear"],
});
