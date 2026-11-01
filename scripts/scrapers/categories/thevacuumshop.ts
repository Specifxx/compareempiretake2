/** The Vacuum Shop (thevacuumshop.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 3). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "thevacuumshop",
  base: "https://www.thevacuumshop.com.au",
  cats: ["vacuums"],
});
