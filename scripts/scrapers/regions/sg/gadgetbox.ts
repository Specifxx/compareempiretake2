/** Gadget Box (gadgetbox.sg): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Singapore). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "sg-gadgetbox",
  base: "https://www.gadgetbox.sg",
  cats: ["phones"],
});
