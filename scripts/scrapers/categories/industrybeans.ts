/** Industry Beans (industrybeans.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 7). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "industrybeans",
  base: "https://www.industrybeans.com",
  cats: ["coffee-machines", "coffee-gear"],
});
