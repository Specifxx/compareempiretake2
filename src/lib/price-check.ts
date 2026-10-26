/**
 * "Is this a real deal?" from our own records. Pure functions so they can be
 * tested and run at build time.
 *
 * Two kinds of history exist for each phone variant:
 *  - best: the cheapest in-stock price across all stores, one point per daily check.
 *  - per store: that store's own prices, from our daily checks plus older
 *    Internet Archive snapshots of the same product page.
 */
import type { Offer, RetailerId } from "./types";

export type Point = [string, number];

export interface PriceCheck {
  verdict: "lowest" | "below" | "usual" | "above" | "new";
  /** One line for people: "Lowest price we've recorded". */
  headline: string;
  detail: string;
  points: Point[];
  /** What the chart shows: "Best price across stores" or "Price at JB Hi-Fi". */
  chartLabel: string;
  since?: string;
  low?: number;
  high?: number;
  typical?: number;
}

export interface WasCheck {
  retailer: RetailerId;
  was: number;
  status: "backed" | "never" | "unknown";
  text: string;
}

const DAY = 864e5;
const span = (pts: Point[]) => (pts.length < 2 ? 0 : (Date.parse(pts.at(-1)![0]) - Date.parse(pts[0][0])) / DAY);
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
// UK stores' ids start with "uk-" and price in pounds; AU and US both use "$".
let sym = "$";
const money = (n: number) => `${sym}${Math.round(n).toLocaleString("en-AU")}`;
const setSymbolFor = (r?: RetailerId) => (sym = r?.startsWith("uk-") ? "£" : "$");
/**
 * "29 Oct", or "29 Oct 2025" when it isn't in the same year as `today` (YYYY-MM-DD, the catalogue's day)
 * — history now spans years. The year comes from the data, not the clock: product pages render on a UTC
 * server, are cached for a day and hydrate in the visitor's browser, which would disagree at New Year.
 */
export const shortDate = (d: string, today: string) => {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short", ...(d.slice(0, 4) !== today.slice(0, 4) ? { year: "numeric" } : {}) });
};

export function priceCheck(opts: {
  price: number;
  best: Point[];
  stores: Partial<Record<RetailerId, Point[]>>;
  cheapest?: RetailerId;
  storeName: (r: RetailerId) => string;
  today: string;
}): PriceCheck {
  const { price, best, stores, cheapest, storeName, today } = opts;
  setSymbolFor(cheapest ?? (Object.keys(stores)[0] as RetailerId | undefined));
  // Prefer the complete daily line; until it covers a week, use the cheapest
  // store's own (longer, archived) history.
  let points = best;
  let chartLabel = "Best price across stores";
  const own = cheapest ? stores[cheapest] ?? [] : [];
  if (span(best) < 7 && span(own) >= 7) {
    points = own;
    chartLabel = `Price at ${storeName(cheapest!)}`;
  }
  if (!points.length || points.at(-1)![0] !== today) points = [...points.filter(([d]) => d !== today), [today, price]];

  if (span(points) < 7) {
    return {
      verdict: "new",
      headline: "Tracking this price",
      detail: `We started recording this price on ${shortDate(points[0][0], today)}. Check back: every day adds to the chart, so you'll see if a "sale" is real.`,
      points,
      chartLabel,
      since: points[0][0],
    };
  }
  const recent = points.filter(([d]) => Date.parse(today) - Date.parse(d) <= 365 * DAY);
  if (span(recent) < 7) {
    return { verdict: "new", headline: "Tracking this price", detail: `We have no recent history for this price yet. Every daily check adds to the chart.`, points, chartLabel, since: points[0][0] };
  }
  const window = recent;
  const prices = window.map(([, p]) => p);
  const low = Math.min(...prices), high = Math.max(...prices), typical = median(prices);
  const since = window[0][0];
  const base = { points, chartLabel, since, low, high, typical };
  if (price <= low && price < typical * 0.99) return { ...base, verdict: "lowest", headline: "Lowest price we've recorded", detail: `Nothing cheaper since ${shortDate(since, today)}. Usual price ${money(typical)}.` };
  if (price <= typical * 0.97) return { ...base, verdict: "below", headline: `${money(typical - price)} below its usual price`, detail: `Usually ${money(typical)}. Lowest we've seen: ${money(low)}.` };
  if (price <= typical * 1.03) return { ...base, verdict: "usual", headline: "About its usual price", detail: `It's been around ${money(typical)} since ${shortDate(since, today)}. Lowest we've seen: ${money(low)}.` };
  return { ...base, verdict: "above", headline: "Above its usual price", detail: `Usually ${money(typical)}, and it's been as low as ${money(low)}. Worth waiting.` };
}

/** Does the store's own "was" price match anything we've recorded at that store? */
export function wasCheck(o: Offer, history: Point[] | undefined, storeName: string, today: string): WasCheck | undefined {
  if (!o.wasPrice) return undefined;
  setSymbolFor(o.retailer);
  const pts = history ?? [];
  // Only an earlier day can back a "was" price — today's own price never does.
  const seen = pts.filter(([d, p]) => d < today && p >= o.wasPrice! * 0.98);
  if (seen.length) {
    return { retailer: o.retailer, was: o.wasPrice, status: "backed", text: `Checks out: ${storeName} charged ${money(seen.at(-1)![1])} on ${shortDate(seen.at(-1)![0], today)}.` };
  }
  if (span(pts) >= 14) {
    const max = Math.max(...pts.map(([, p]) => p));
    return {
      retailer: o.retailer,
      was: o.wasPrice,
      status: "never",
      text: `We've never seen ${storeName} charge ${money(o.wasPrice)}. Highest we've recorded there since ${shortDate(pts[0][0], today)}: ${money(max)}.`,
    };
  }
  return { retailer: o.retailer, was: o.wasPrice, status: "unknown", text: `Too new to check: we've only been recording ${storeName}'s price since ${pts[0] ? shortDate(pts[0][0], today) : "today"}.` };
}
