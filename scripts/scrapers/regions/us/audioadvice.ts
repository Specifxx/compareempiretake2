/**
 * Audio Advice (audioadvice.com, NC) — Shopify, authorised dealer. Collections' products.json filtered by product_type;
 * "OPEN BOX" listings are dropped. The SKU is "BRAND:MODEL" (e.g. "JBL:CHARGE6-PURP"), so the part after the colon is the mpn.
 */
import { shopifyScrapers, type ShopifyProduct } from "./_shopify";

const is = (re: RegExp) => (p: ShopifyProduct) => re.test(p.product_type ?? "");

export const scrapers = shopifyScrapers({
  retailer: "us-audioadvice",
  base: "https://www.audioadvice.com",
  skuIsMpn: (s) => (s.includes(":") && !/-BSA$|OPENBOX|-OB$/i.test(s) ? s.split(":").slice(1).join(":") : undefined),
  exclude: /\b(open box|bundle|package|w\/|demo)\b|\+/i,
  cats: {
    tvs: { collections: ["home-theater-televisions"], keep: is(/^(outdoor )?televisions$/i) },
    soundbars: { collections: ["home-audio-speakers-soundbars"], keep: is(/^soundbars?$/i) },
    headphones: { collections: ["headphones-portables-headphones"], keep: is(/headphones?$/i) },
    speakers: {
      collections: ["home-audio-speakers-wireless-speaker-systems", "home-audio-speakers-portable-bluetooth-speakers"],
      keep: is(/^(wireless speaker systems|bluetooth & portable speakers|portable & bluetooth)$/i),
    },
  },
});
