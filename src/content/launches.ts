// The launch calendar (owner, 2026-11-03: "there are extremely hype products right now like the iphone duo and the galaxy
// fold 8 so we should make sure we feature these as much as possible on the website home"). Each entry is one launch the
// homepage features (components/HotLaunches.tsx, lib/launches.ts) from its pre-order day until `featureUntil`, with the
// region's own store prices for it. Facts only, each from the maker's own announcement and dated: the name, the pre-order
// and release dates. No price is typed here: every price shown is a store's, from the day's catalogue.
//
// ADDING A LAUNCH: add an entry with the maker's announcement as `source`. `match` finds the product in each region's
// catalogue by name (accent-folded, lowercase); the listing with the most stores wins, so a store that splits colours into
// their own products ("Galaxy Z Fold8 Graphite") still finds the main one. A launch no region lists yet is shown as a
// pre-order card with no price only when `preorderFrom` has passed; otherwise it waits.
import type { CategoryId } from "@/lib/types";

export interface Launch {
  key: string;
  name: string;
  brand: string;
  category: CategoryId;
  /** Matches the product's name in the catalogue (case-insensitive). Must not match the launch's siblings. */
  match: RegExp;
  /** Pre-orders open (YYYY-MM-DD), when announced. */
  preorderFrom: string | null;
  /** First on sale (YYYY-MM-DD). Markets can differ by a week; this is the maker's first date. */
  releaseDate: string;
  /** Last day the homepage features it. */
  featureUntil: string;
  /** One line on what it is, from the announcement. */
  tagline: string;
  source: { label: string; url: string };
  /** When the facts were checked against the source. */
  checked: string;
}

export const LAUNCHES: Launch[] = [
  {
    key: "iphone-duo",
    name: "iPhone Duo",
    brand: "Apple",
    category: "phones",
    match: /\biphone\s*duo\b/i,
    preorderFrom: "2026-10-16",
    releaseDate: "2026-10-23",
    featureUntil: "2027-01-31",
    tagline: "Apple's first foldable iPhone",
    source: { label: "Apple Newsroom, October 2026", url: "https://www.apple.com/newsroom/2026/10/open-up-to-new-possibilities-with-iphone-duo/" },
    checked: "2026-11-03",
  },
  {
    key: "galaxy-z-fold8",
    name: "Galaxy Z Fold8",
    brand: "Samsung",
    category: "phones",
    match: /\bgalaxy\s*z?\s*fold\s*8\b(?!\s*ultra)/i,
    preorderFrom: null,
    releaseDate: "2026-08-07",
    featureUntil: "2026-12-31",
    tagline: "Samsung's 2026 book-style foldable",
    source: { label: "Samsung Newsroom, 6 August 2026", url: "https://news.samsung.com/global/samsung-officially-launches-galaxy-z-fold8-ultra-fold8-flip8-watch-ultra2-and-watch9" },
    checked: "2026-11-03",
  },
  {
    key: "galaxy-z-fold8-ultra",
    name: "Galaxy Z Fold8 Ultra",
    brand: "Samsung",
    category: "phones",
    match: /\bgalaxy\s*z?\s*fold\s*8\s*ultra\b/i,
    preorderFrom: null,
    releaseDate: "2026-08-07",
    featureUntil: "2026-12-31",
    tagline: "The bigger, top-spec Fold8",
    source: { label: "Samsung Newsroom, 6 August 2026", url: "https://news.samsung.com/global/samsung-officially-launches-galaxy-z-fold8-ultra-fold8-flip8-watch-ultra2-and-watch9" },
    checked: "2026-11-03",
  },
  {
    key: "galaxy-z-flip8",
    name: "Galaxy Z Flip8",
    brand: "Samsung",
    category: "phones",
    match: /\bgalaxy\s*z?\s*flip\s*8\b/i,
    preorderFrom: null,
    releaseDate: "2026-08-07",
    featureUntil: "2026-12-31",
    tagline: "Samsung's 2026 flip phone",
    source: { label: "Samsung Newsroom, 6 August 2026", url: "https://news.samsung.com/global/samsung-officially-launches-galaxy-z-fold8-ultra-fold8-flip8-watch-ultra2-and-watch9" },
    checked: "2026-11-03",
  },
];
