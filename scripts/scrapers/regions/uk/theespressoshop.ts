/** The Espresso Shop (theespressoshop.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 2). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-theespressoshop",
  base: "https://www.theespressoshop.co.uk",
  cats: ["coffee-machines", "coffee-gear"],
});
