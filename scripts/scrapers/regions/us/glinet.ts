/**
 * GL.iNet US (www.gl-inet.com, USD) — official Shopify store. Home and travel routers and VPN security gateways by
 * product_type; every title carries the model code ("Flint 3e (GL-BE6500)"), the variant SKU is the part number with a
 * plug suffix ("GL-BE6500-US"). Discontinued models are listed at $0 and are dropped by the helper's price floor.
 */
import { shopifyScrapers, type } from "./_shopify";

export const scrapers = shopifyScrapers({
  retailer: "us-glinet",
  base: "https://www.gl-inet.com",
  brand: "GL.iNet",
  exclude: /\b(pouch|case|adapter|power supply|sticker|charger|splitter|dev board|kvm|sensor|light)\b/i,
  cats: { routers: { keep: type(/^(home router|travel router|security gateway|4g lte router|5g sim card router|mini router)$/i) } },
});
