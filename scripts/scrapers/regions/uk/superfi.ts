/**
 * Superfi (superfi.co.uk, Shopify): hi-fi retailer — headphones, speakers and soundbars, by product_type.
 * "Display model" / ex-display units, cables and parts are skipped. SKUs are internal numbers (no mpn).
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { shopifyUk, typeIs } from "./_shopify";

const BASE = "https://www.superfi.co.uk";
const extraJunk = /display (model|one)|ex[- ]?display|\bpads?\b|replacement|headband|adapter|\bcase\b|cable|stand|bracket|grille|amplifier|receiver|turntable|\bdac\b/i;
const none = () => undefined;

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  headphones: () => shopifyUk("uk-superfi", BASE, "headphones", { pick: typeIs("Headphones & Earphones", "Headphones", "Over-Ear Headphones"), extraJunk, mpn: none }),
  speakers: () => shopifyUk("uk-superfi", BASE, "speakers", { pick: typeIs("Speakers", "Speaker", "Wireless Speakers", "Bluetooth Speakers"), extraJunk, mpn: none }),
  soundbars: () => shopifyUk("uk-superfi", BASE, "soundbars", { pick: (p) => /soundbar|home cinema/i.test(p.product_type) && /soundbar|sound bar/i.test(p.title), extraJunk, mpn: none }),
};
