/** soundcore US (us.soundcore.com) — Anker's official Shopify audio store. product_type "headphone" / "speaker"; SKU = Anker model code (A3xxx). */
import { shopifyScrapers } from "./_shopify";

export const scrapers = shopifyScrapers({
  retailer: "us-soundcore",
  base: "https://us.soundcore.com",
  brand: "soundcore",
  skuIsMpn: (s) => (/^[A-Z]\d{4}[A-Z0-9]*$/i.test(s) ? s : undefined),
  exclude: /bundle|\+|refurb|ear tips|case|test/i,
  cats: {
    headphones: { keep: (p) => /^headphone$/i.test(p.product_type ?? "") },
    speakers: { keep: (p) => /^speaker$/i.test(p.product_type ?? "") },
  },
});
