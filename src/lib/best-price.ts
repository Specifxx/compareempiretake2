/**
 * The "Best price" row treatment (owner, 2026-11-18). The cheapest store row is drawn loudly (green ring and fill, solid green
 * "Cheapest" pill) ONLY when its link is one we are paid for (Awin, Impact or another programme: `storeLink(...).paid`). A plain
 * non-affiliate store gets a small neutral "Best price" tag and, when the list has an eBay row, one muted line saying prices and
 * stock change and to also check eBay. Display only: never a sort, a deal badge, JSON-LD, a feed or an alert, and never a claim
 * that another row is cheaper. This site sells no trading cards, so TCGplayer is never named.
 */
export type BestTreatment = "loud" | "plain" | null;

/** `isCheapest`: this is the cheapest in-stock store row and no paid marketplace row took the mark. `paid`: its link earns. */
export function bestTreatment(isCheapest: boolean, paid: boolean): BestTreatment {
  if (!isCheapest) return null;
  return paid ? "loud" : "plain";
}

/** The note under a plain "Best price" tag, naming only the marketplace rows that exist; null when there is none. */
export function bestPriceHint(has: { ebay: boolean }): string | null {
  return has.ebay ? "Prices and stock change: also check eBay" : null;
}

export const BEST_TAG_CLASS = {
  loud: "rounded-full bg-save px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-bg-card",
  plain: "rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-ink-mute",
} as const;
