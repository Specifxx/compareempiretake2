/** Upscale Audio (upscaleaudio.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-upscaleaudio",
  base: "https://www.upscaleaudio.com",
  cats: ["headphones"],
});
