/** Direct Computers (directcomputers.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 21). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-directcomputers",
  base: "https://directcomputers.co.uk",
  cats: ["laptops", "desktops", "monitors", "motherboards", "ram", "graphics-cards", "ssds", "cpus", "tablets", "printers", "routers", "headphones", "speakers"],
});
