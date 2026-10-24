/** Headphones.com — Shopify headphone specialist (USD store). Headphones and wireless speakers by product_type; "Open Box" dropped. SKU = brand part code. */
import { shopifyScrapers, type ShopifyProduct } from "./_shopify";

const is = (re: RegExp) => (p: ShopifyProduct) => re.test(p.product_type ?? "");

export const scrapers = shopifyScrapers({
  retailer: "us-headphonescom",
  base: "https://www.headphones.com",
  skuIsMpn: (s) => (/open|-ob$|bundle/i.test(s) ? undefined : s),
  exclude: /open box|bundle|\+|b-stock|demo|ear ?pads?/i,
  cats: {
    headphones: { keep: is(/^headphones$/i) },
    speakers: { keep: is(/^wireless speakers$/i) },
  },
});
