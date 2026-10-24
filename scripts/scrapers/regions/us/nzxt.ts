/** NZXT (nzxt.com) — official Shopify store. Prebuilt PCs (not the "Flex" subscription), monitors and motherboards; SKU = part number. */
import { shopifyScrapers, type ShopifyProduct } from "./_shopify";

const is = (re: RegExp) => (p: ShopifyProduct) => re.test(p.product_type ?? "");

export const scrapers = shopifyScrapers({
  retailer: "us-nzxt",
  base: "https://nzxt.com",
  brand: "NZXT",
  skuIsMpn: true,
  exclude: /subscription|flex|bundle|\+/i,
  cats: {
    desktops: { keep: is(/^prebuilds$/i) },
    monitors: { keep: is(/^monitors$/i) },
    motherboards: { keep: is(/^motherboards$/i) },
  },
});
