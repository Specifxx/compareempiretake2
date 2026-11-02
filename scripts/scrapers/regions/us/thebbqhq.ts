/** The BBQ HQ (thebbqhq.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-02, new categories). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-thebbqhq",
  base: "https://thebbqhq.com",
  cats: ["bbqs"],
});
