/** Fellow (fellowproducts.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-02, new categories). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-fellow",
  base: "https://www.fellowproducts.com",
  brand: "Fellow",
  cats: ["coffee-gear"],
});
