// The homepage's "Hot right now" row (content/launches.ts): each featured launch matched to its product in a region's
// catalogue, with that region's cheapest store price and store count. Pure (the caller passes the catalogue read, since
// lib/catalog.ts is server-only), so tests/launches.test.ts checks the selection.
import { LAUNCHES, type Launch } from "@/content/launches";
import type { PhoneSummary } from "@/lib/catalog";
import type { RegionId } from "@/lib/region";

export interface HotLaunch {
  launch: Launch;
  /** The region's product for it (most stores, then cheapest), or null when no store there lists it yet. */
  product: PhoneSummary | null;
  status: "pre-order" | "new";
}

const fold = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "");

/** The launches to feature on `today`: from pre-order day (or release day) to featureUntil, newest release first, then in LAUNCHES order. */
export function featuredLaunches(today: string, launches: readonly Launch[] = LAUNCHES): Launch[] {
  return launches
    .filter((l) => (l.preorderFrom ?? l.releaseDate) <= today && today <= l.featureUntil)
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate) || launches.indexOf(a) - launches.indexOf(b));
}

/** The best catalogue product for a launch: its name matches, then most stores, then cheapest. */
export function matchLaunch(launch: Launch, products: readonly PhoneSummary[]): PhoneSummary | null {
  let best: PhoneSummary | null = null;
  for (const p of products) {
    if (!launch.match.test(fold(p.name))) continue;
    if (!best || p.retailerCount > best.retailerCount || (p.retailerCount === best.retailerCount && p.bestPrice < best.bestPrice)) best = p;
  }
  return best;
}

/** The row for a region: launches with a product there, plus a launch still on pre-order that no store lists yet. */
export function hotLaunches(
  region: RegionId,
  today: string,
  read: (category: Launch["category"], region: RegionId) => PhoneSummary[],
): HotLaunch[] {
  const out: HotLaunch[] = [];
  const byCat = new Map<string, PhoneSummary[]>();
  for (const launch of featuredLaunches(today)) {
    if (!byCat.has(launch.category)) byCat.set(launch.category, read(launch.category, region));
    const product = matchLaunch(launch, byCat.get(launch.category)!);
    const status = launch.releaseDate > today ? "pre-order" : "new";
    if (product || status === "pre-order") out.push({ launch, product, status });
  }
  return out;
}

/** A product the stores themselves are taking pre-orders for (lib/preorders.ts), found in the import with no entry here. */
export interface StorePreorder {
  product: PhoneSummary;
  /** Stores selling it on pre-order today. */
  stores: number;
}

/**
 * Every product with a store pre-order today, most stores first (then most stores overall, then cheapest), leaving out any
 * the hand-kept launches above already show. `read` is the whole region's catalogue (getSummaries with no category).
 */
export function storePreorders(
  region: RegionId,
  today: string,
  read: (category: Launch["category"] | undefined, region: RegionId) => PhoneSummary[],
  launches: readonly Launch[] = LAUNCHES,
): StorePreorder[] {
  const all = read(undefined, region);
  const shown = new Set<string>();
  for (const launch of featuredLaunches(today, launches)) {
    const m = matchLaunch(launch, all.filter((p) => p.category === launch.category));
    if (m) shown.add(`${m.category}/${m.slug}`);
  }
  return all
    .filter((p) => p.preorderStores > 0 && !shown.has(`${p.category}/${p.slug}`))
    .sort((a, b) => b.preorderStores - a.preorderStores || b.retailerCount - a.retailerCount || a.bestPrice - b.bestPrice)
    .map((product) => ({ product, stores: product.preorderStores }));
}

export interface CalendarLaunch extends HotLaunch {
  /** Still featured on the homepage (today is on or before featureUntil). */
  current: boolean;
}

/** The launch calendar (/launches): every launch, the region's product for each (or null), coming soon first, then newest out. */
export function launchCalendar(
  region: RegionId,
  today: string,
  read: (category: Launch["category"], region: RegionId) => PhoneSummary[],
  launches: readonly Launch[] = LAUNCHES,
): { soon: CalendarLaunch[]; out: CalendarLaunch[] } {
  const byCat = new Map<string, PhoneSummary[]>();
  const rows = launches.map((launch) => {
    if (!byCat.has(launch.category)) byCat.set(launch.category, read(launch.category, region));
    return { launch, product: matchLaunch(launch, byCat.get(launch.category)!), status: launch.releaseDate > today ? "pre-order" : "new", current: today <= launch.featureUntil } as CalendarLaunch;
  });
  const order = (a: CalendarLaunch, b: CalendarLaunch) => launches.indexOf(a.launch) - launches.indexOf(b.launch);
  return {
    soon: rows.filter((r) => r.status === "pre-order").sort((a, b) => a.launch.releaseDate.localeCompare(b.launch.releaseDate) || order(a, b)),
    out: rows.filter((r) => r.status === "new").sort((a, b) => b.launch.releaseDate.localeCompare(a.launch.releaseDate) || order(a, b)),
  };
}
