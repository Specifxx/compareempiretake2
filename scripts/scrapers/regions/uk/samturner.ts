/** Sam Turner & Sons (sam-turner.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 14). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-samturner",
  base: "https://www.sam-turner.co.uk",
  cats: ["lego"],
});
