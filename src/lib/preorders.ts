// STORE PRE-ORDERS, FOUND AUTOMATICALLY (2026-11-05; owner: "an automated system that updates the websites based on new
// releases and preorders"). content/launches.ts is the hand-kept calendar of the hype launches, each sourced from the maker.
// This is the other half: whatever the stores themselves are taking pre-orders for today, read from their own listings in
// the import, so a new product reaches /launches and the home row the morning the first store opens pre-orders, with no
// edit here. A store says pre-order in one of two ways:
//
// - its availability field: JB Hi-Fi's "PreOrder" tag, a feed's availability "preorder" (scripts/scrapers/*, RawOffer.preorder);
// - its title: "(Pre-Order)", "Pre-order - ships 20 November", "PREORDER" (every source, read here at catalogue build).
//
// Facts only: no date is inferred (a title's "ships 20 November" is shown as the store's own words on its listing, not parsed
// into a claim), and the price is the store's pre-order price. A product counts as on pre-order while at least one store
// says so; the moment every store simply has it in stock, it leaves the list. Pure, so tests/preorders.test.ts reads it
// directly; lib/catalog.ts imports it for the summaries and scripts/build-catalog.ts for the offers.
import type { Offer, Phone, RawOffer } from "./types";

/** A title that says the listing is a pre-order. "Pre-owned" and "pre-paid" are not. */
export const PREORDER_TITLE = /\bpre[\s-]?orders?\b|\bpreorders?\b|\bcoming\s+soon\b/i;

/** Is this listing a pre-order: the store's availability says so, or its title does. */
export function offerIsPreorder(o: Pick<RawOffer, "title" | "preorder">): boolean {
  return o.preorder === true || PREORDER_TITLE.test(o.title);
}

/** How many stores sell this product on pre-order today. */
export function preorderStoreCount(p: Pick<Phone, "variants">): number {
  const stores = new Set<string>();
  for (const v of p.variants) for (const o of v.offers) if (o.preorder) stores.add(o.retailer);
  return stores.size;
}

/** The best row for a store's pre-order offers: the "Pre-order" label is theirs, never "Out of stock". */
export const offerStatus = (o: Pick<Offer, "inStock" | "preorder">): "in-stock" | "pre-order" | "out" =>
  o.inStock ? "in-stock" : o.preorder ? "pre-order" : "out";
