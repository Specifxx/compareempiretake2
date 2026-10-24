/**
 * World Wide Stereo (worldwidestereo.com, PA) — Shopify, authorised dealer. Category collections' products.json filtered
 * by product_type ("Bundles & Packages" dropped). SKUs are the store's own numbers, so no mpn; the brand is the vendor.
 */
import { shopifyScrapers, type ShopifyProduct } from "./_shopify";

const is = (re: RegExp) => (p: ShopifyProduct) => re.test(p.product_type ?? "");

export const scrapers = shopifyScrapers({
  retailer: "us-worldwidestereo",
  base: "https://www.worldwidestereo.com",
  exclude: /\b(bundle|package|w\/|with .*(mount|stand|subwoofer|speaker))\b|\+/i,
  cats: {
    tvs: { collections: ["tvs"], keep: is(/^televisions$/i) },
    headphones: { collections: ["headphones"], keep: is(/^headphones$/i) },
    soundbars: { collections: ["soundbars"], keep: is(/^sound bars$/i) },
    speakers: { collections: ["portable-bluetooth-speakers", "wireless-streaming-speakers"], keep: is(/^(portable speakers|wireless streaming speakers)$/i) },
  },
});
