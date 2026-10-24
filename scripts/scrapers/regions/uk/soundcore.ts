/**
 * soundcore UK (uk.soundcore.com, Anker's official audio store, Shopify): earbuds/headphones and speakers by
 * product_type ("headphone"/"Headphones", "speaker"/"Speakers"). Ear tips, charging cases and other parts have their
 * own product types and are skipped, with the shared title checks as a backstop. Variant SKUs are Anker model codes
 * (e.g. A3947011); the "-94"-style suffixed SKUs belong to parts.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { shopifyUk, typeIs } from "./_shopify";

const BASE = "https://uk.soundcore.com";
const extraJunk = /ear ?tips|charging case|replacement|refurb|bundle|set of \d|\+/i;
const single = (o: RawOffer[]) => o.filter((x) => !/^BUNDLE/i.test(x.sku));

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  headphones: async () => single(await shopifyUk("uk-soundcore", BASE, "headphones", { pick: typeIs("headphone", "Headphones"), extraJunk })),
  speakers: async () => single(await shopifyUk("uk-soundcore", BASE, "speakers", { pick: typeIs("speaker", "Speakers"), extraJunk })),
};
