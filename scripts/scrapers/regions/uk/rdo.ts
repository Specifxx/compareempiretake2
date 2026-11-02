/** RDO Kitchens & Appliances (rdo.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 12). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-rdo",
  base: "https://www.rdo.co.uk",
  exclude: /box opened|graded|ex[- ]display/i,
  cats: ["fridges", "washing-machines", "dishwashers", "vacuums", "coffee-machines", "small-kitchen"],
});
