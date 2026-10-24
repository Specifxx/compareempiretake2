/** Shokz US (shokz.com) — official Shopify store. Open-ear and bone-conduction headphones; refurbished and gift sets dropped. SKU = model code. */
import { shopifyScrapers } from "./_shopify";

export const scrapers = shopifyScrapers({
  retailer: "us-shokz",
  base: "https://shokz.com",
  brand: "Shokz",
  skuIsMpn: true,
  exclude: /gift|bundle|mystery|refurb|\+/i,
  cats: { headphones: { keep: (p) => /^(open earbuds|bone conduction headphones)$/i.test(p.product_type ?? "") } },
});
