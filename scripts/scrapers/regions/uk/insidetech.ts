/** Inside Tech (inside-tech.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 21). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-insidetech",
  base: "https://inside-tech.co.uk",
  cats: ["desktops", "laptops", "monitors", "motherboards", "ram", "cpus", "graphics-cards", "ssds", "routers", "headphones"],
});
