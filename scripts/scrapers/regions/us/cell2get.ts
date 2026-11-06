/** Cell2Get (cell2get.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 23). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-cell2get",
  base: "https://cell2get.com",
  // International models, dual-SIM imports and carrier-locked phones are left out: only US unlocked units are compared.
  exclude: /global (model|version)|international (version|model)|dual sim|\/ds\b|t-?mobile|at&t|verizon|cricket|boost mobile|tracfone|straight talk|metro ?pcs|sprint|refurb|renewed|pre-?owned|open box/i,
  cats: ["phones"],
});
