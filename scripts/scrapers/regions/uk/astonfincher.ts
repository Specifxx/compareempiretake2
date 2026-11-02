/** Aston & Fincher (astonandfincher.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-02, new categories). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-astonfincher",
  base: "https://www.astonandfincher.co.uk",
  cats: ["hair-care"],
});
