/** Elys Wimbledon (elyswimbledon.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-02, new categories). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-elys",
  base: "https://www.elyswimbledon.co.uk",
  cats: ["hair-care", "small-kitchen"],
});
