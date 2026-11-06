/** Wired2Fire (wired2fire.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 21). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-wired2fire",
  base: "https://wired2fire.co.uk",
  cats: ["desktops", "cpus", "ssds", "ram", "graphics-cards", "laptops"],
});
