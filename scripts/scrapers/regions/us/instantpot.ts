/** Instant Pot (instantpot.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-instantpot",
  base: "https://www.instantpot.com",
  brand: "Instant Pot",
  cats: ["air-fryers", "coffee-machines", "small-kitchen"],
});
