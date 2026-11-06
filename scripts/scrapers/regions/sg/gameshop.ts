/** Gameshop (gameshop.sg): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Singapore). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "sg-gameshop",
  base: "https://www.gameshop.sg",
  cats: ["consoles", "headphones", "soundbars", "ssds"],
});
