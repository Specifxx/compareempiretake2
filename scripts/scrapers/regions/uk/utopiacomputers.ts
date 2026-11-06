/** Utopia Computers (utopiacomputers.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 21). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-utopiacomputers",
  base: "https://utopiacomputers.co.uk",
  cats: ["cpus", "graphics-cards", "ram", "desktops", "ssds"],
});
