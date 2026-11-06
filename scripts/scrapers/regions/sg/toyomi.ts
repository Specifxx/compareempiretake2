/** Toyomi (toyomi.com.sg): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Singapore). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "sg-toyomi",
  base: "https://www.toyomi.com.sg",
  brand: "Toyomi",
  cats: ["air-fryers", "small-kitchen"],
});
