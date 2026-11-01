/** Q Acoustics (qacoustics.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-qacoustics",
  base: "https://www.qacoustics.co.uk",
  brand: "Q Acoustics",
  cats: ["speakers"],
});
