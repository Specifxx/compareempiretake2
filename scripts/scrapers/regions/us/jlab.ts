/** JLab (jlabaudio.com, CA) — official Shopify store. Earbuds, headphones and speakers by product_type; gift sets / 2-packs dropped. SKU = part number. */
import { shopifyScrapers, type ShopifyProduct } from "./_shopify";

const is = (re: RegExp) => (p: ShopifyProduct) => re.test(p.product_type ?? "");

export const scrapers = shopifyScrapers({
  retailer: "us-jlab",
  base: "https://www.jlabaudio.com",
  brand: "JLab",
  skuIsMpn: true,
  exclude: /gift set|2 pack|2-pack|bundle|mystery|\+/i,
  cats: {
    headphones: { keep: is(/^(audio earbuds|audio headphones|headphones & headsets|gaming headset)$/i) },
    speakers: { keep: is(/^audio speakers$/i) },
  },
});
