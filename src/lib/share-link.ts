// Word of mouth (owner, 2026-11-02): shared links. Client-safe. Every shared link carries utm_source=share&
// utm_medium=<what>; the Share button sends a Vercel "share" event, ShareArrival one "share_visit" when a shared link
// brings someone, and RiftCompare's weekly growth report counts both. DECISIONS.md, "Share buttons and shared saved lists".
import { parseHref } from "./product-refs";

export type ShareMedium = "product" | "list";

/** `path` (its own query string kept) on `origin`, with the share tags. */
export function shareUrl(origin: string, path: string, medium: ShareMedium): string {
  const u = new URL(path, origin);
  u.searchParams.set("utm_source", "share");
  u.searchParams.set("utm_medium", medium);
  return u.toString();
}

export interface GapRow {
  price: number;
  store: string;
}

/** The real spread: cheapest and dearest in-stock price from two different stores, in one currency; else null. */
export function priceGap(rows: readonly GapRow[]): { low: GapRow; high: GapRow; pct: number } | null {
  const live = rows.filter((r) => r.price > 0).slice().sort((a, b) => a.price - b.price);
  if (live.length < 2) return null;
  const low = live[0];
  const high = live[live.length - 1];
  if (low.store === high.store || high.price <= low.price) return null;
  return { low, high, pct: Math.round(((high.price - low.price) / high.price) * 100) };
}

/** The share message: the gap when there is one, else the cheapest price and the store count. */
export function shareText(name: string, rows: readonly GapRow[], fmt: (n: number) => string): string {
  const g = priceGap(rows);
  if (g) return `${name}: ${fmt(g.low.price)} at ${g.low.store} vs ${fmt(g.high.price)} at ${g.high.store}. Same product, ${g.pct}% less.`;
  const live = rows.filter((r) => r.price > 0).sort((a, b) => a.price - b.price);
  return live.length ? `${name}: ${fmt(live[0].price)} at ${live[0].store}, prices compared across stores.` : `${name}: prices compared across stores.`;
}

// A shared saved list (/saved?l=/phones/a,/us/tvs/b…): the products travel in the link, nothing is stored.
export const SHARED_PARAM = "l";
export const SHARED_MAX = 50;
export function encodeSavedList(hrefs: readonly string[]): string {
  return [...new Set(hrefs)].filter((h) => parseHref(h)).slice(0, SHARED_MAX).join(",");
}
export function decodeSavedList(search: string): string[] | null {
  const v = new URLSearchParams(search).get(SHARED_PARAM);
  if (v == null) return null;
  return [...new Set(v.split(",").map((s) => s.trim()))].filter((h) => parseHref(h)).slice(0, SHARED_MAX);
}
