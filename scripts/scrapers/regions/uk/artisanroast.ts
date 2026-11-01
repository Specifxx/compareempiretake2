/** Artisan Roast (artisanroast.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 10). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-artisanroast",
  base: "https://www.artisanroast.co.uk",
  cats: ["coffee-machines"],
});
