/** House of Marley (thehouseofmarley.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-houseofmarley",
  base: "https://www.thehouseofmarley.com",
  brand: "House of Marley",
  cats: ["speakers", "headphones"],
});
