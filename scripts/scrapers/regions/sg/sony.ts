/** Sony Store (store.sony.com.sg): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Singapore). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "sg-sony",
  base: "https://store.sony.com.sg",
  brand: "Sony",
  cats: ["headphones", "consoles"],
  exclude: /\[(pre ?order|notify me|special order)\]/i,
});
