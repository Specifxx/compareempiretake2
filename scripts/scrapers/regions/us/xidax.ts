/** Xidax (xidax.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-xidax",
  base: "https://www.xidax.com",
  // Monitors only (2026-11-06): its graphics cards, CPUs and SSDs are priced as PC-build parts (an RX 9070 XT at $1,785,
  // an RTX 3060 at $850), not what the part sells for on its own.
  cats: ["monitors"],
});
