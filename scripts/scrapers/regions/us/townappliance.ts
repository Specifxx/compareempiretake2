/** Town Appliance (townappliance.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-02, new categories). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-townappliance",
  base: "https://www.townappliance.com",
  cats: ["bbqs", "coffee-gear", "small-kitchen"],
});
