/** Let's Run (lets-run.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 14). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-letsrun",
  base: "https://www.lets-run.co.uk",
  cats: ["headphones"],
});
