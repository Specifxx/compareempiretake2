/** Dronefly (dronefly.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 2). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-dronefly",
  base: "https://www.dronefly.com",
  cats: ["drones"],
});
