/** Skullcandy US (skullcandy.com) — official Shopify store. Earbuds and headphones by product_type; SKU = model code (S6CNW-U987). */
import { shopifyScrapers } from "./_shopify";

export const scrapers = shopifyScrapers({
  retailer: "us-skullcandy",
  base: "https://www.skullcandy.com",
  brand: "Skullcandy",
  skuIsMpn: true,
  exclude: /bundle|\+|2-pack|refurb/i,
  cats: {
    headphones: { keep: (p) => /^(earbuds|headphones|gaming)$/i.test(p.product_type ?? "") },
  },
});
