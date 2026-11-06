/** Yorkshire Garden Centres (yorkshiregardencentres.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 21). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-yorkshiregardencentres",
  base: "https://yorkshiregardencentres.co.uk",
  cats: ["bbqs"],
});
