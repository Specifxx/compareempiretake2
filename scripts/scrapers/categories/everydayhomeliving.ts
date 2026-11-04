/** Everyday Home Living / Leading Edge Computers (everydayhomeliving.com.au): the Shopify feed, read whole by `auto-shopify.ts` (survey 2026-11-04, AUD, ~5,000 products). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "everydayhomeliving",
  base: "https://www.everydayhomeliving.com.au",
  platform: "shopify",
  cats: ["laptops", "monitors", "graphics-cards", "motherboards", "ssds", "ram", "cpus", "routers", "printers", "desktops", "headphones", "speakers", "vacuums", "robot-vacuums", "cameras", "air-fryers", "dishwashers", "small-kitchen"],
});
