/** Hot Rod Cameras (hotrodcameras.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 22). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-hotrodcameras",
  base: "https://hotrodcameras.com",
  // "(Calibrated)" TVs carry a paid calibration service: not the plain product.
  exclude: /calibrated/i,
  cats: ["cameras", "drones", "tvs", "monitors"],
});
