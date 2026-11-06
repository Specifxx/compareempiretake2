/** Sennheiser (sg.sennheiser-hearing.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Singapore). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "sg-sennheiser",
  base: "https://sg.sennheiser-hearing.com",
  brand: "Sennheiser",
  cats: ["headphones", "soundbars"],
});
