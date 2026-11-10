/**
 * The family search index (owner, 2026-11-10: "compare anything", plan B: live search and an MCP server on
 * compareempire.com over the data the family already publishes; DECISIONS.md 2026-11-10).
 *
 * Every sister that takes price alerts publishes `<site>/alert-feed.json` (RiftCompare's shared alert service reads
 * it daily; format in TCGEmpire src/lib/sister-alerts/feed.ts): each product's name, its path on the site and its
 * lowest IN-STOCK STORE price per region, in that region's own currency (never eBay, Amazon or a conversion).
 * `scripts/family-search.ts` reads those feeds once a day in refresh-prices.yml and commits one compact file,
 * `data/family/family-search.json`; the search route and the MCP server read only that file. No request ever
 * fetches a sister site.
 *
 * Pure (no fs): the build script, the routes and the tests share it.
 */
import { searchScore } from "./search";

/** The sisters with an alert feed (TCGEmpire src/lib/sister-alerts/sites.ts SISTER_ALERT_SITES). */
export const FAMILY_SEARCH_SITES = [
  { key: "dex", name: "DexCompare", url: "https://dexcompare.app", topic: "Pokémon TCG sealed" },
  { key: "mtg", name: "MTG Compare", url: "https://mtgcompare.app", topic: "Magic: The Gathering sealed" },
  { key: "gundam", name: "Gundam Compare", url: "https://gundamcompare.com", topic: "Gundam cards and Gunpla" },
  { key: "lorcana", name: "Lorcana Compare", url: "https://lorcanacompare.com", topic: "Disney Lorcana" },
  { key: "ygo", name: "YGO Compare", url: "https://ygocompare.com", topic: "Yu-Gi-Oh! sealed" },
  { key: "cyberpunk", name: "Cyberpunk Compare", url: "https://cyberpunkcompare.com", topic: "Cyberpunk TCG" },
  { key: "bandai", name: "BandaiCompare", url: "https://bandaicompare.com", topic: "Union Arena, Fusion World and Digimon sealed" },
  { key: "wax", name: "SportsCardCompare", url: "https://sportscardcompare.com", topic: "Sealed sports cards" },
  { key: "wargame", name: "WargameCompare", url: "https://wargamecompare.com", topic: "Miniature wargames" },
  { key: "figure", name: "FigureCompare", url: "https://figurecompare.com", topic: "Anime figures" },
] as const;
export type FamilySearchSite = (typeof FAMILY_SEARCH_SITES)[number]["key"];

export const FAMILY_SEARCH_FILE = "family-search.json";
/** A site whose feed is older than this drops out of results: a stopped import never shows old prices. */
export const FAMILY_SEARCH_MAX_AGE_MS = 4 * 24 * 60 * 60 * 1000;
/** A feed bigger than this is refused rather than parsed (the alert service's own limit). */
export const FAMILY_FEED_MAX_BYTES = 40 * 1024 * 1024;

/** The family's regions; Compare Empire's are the first five. */
export const FAMILY_SEARCH_REGIONS = ["US", "UK", "AU", "CA", "NZ", "EU", "SG"] as const;
export type FamilySearchRegion = (typeof FAMILY_SEARCH_REGIONS)[number];
export const REGION_CURRENCY: Record<FamilySearchRegion, string> = { US: "USD", UK: "GBP", AU: "AUD", CA: "CAD", NZ: "NZD", EU: "EUR", SG: "SGD" };

/** One product: [site, name, path ("{r}" = region, lowercase), lowest in-stock store price per region in cents]. */
export type FamilySearchItem = [FamilySearchSite, string, string, Partial<Record<FamilySearchRegion, number>>];

export interface FamilySearchIndex {
  v: 1;
  generatedAt: string;
  /** When each site's feed was generated (its own `generatedAt`), so a stale site can be dropped at read time. */
  sites: Partial<Record<FamilySearchSite, string>>;
  items: FamilySearchItem[];
}

const isCents = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x) && x > 0 && x < 1e9;
const REGION_SET = new Set<string>(FAMILY_SEARCH_REGIONS);
/** A site path, never a full URL or anything that could leave the site. */
const SAFE_PATH = /^\/[A-Za-z0-9{}\-_/.%]{0,300}$/;

/**
 * One feed's products, validated: a wrong site, a missing date, a bad path or a price that isn't whole positive
 * cents in a known region is dropped. Returns null when the feed as a whole can't be trusted.
 */
export function feedItems(site: FamilySearchSite, feed: unknown): { generatedAt: string; items: FamilySearchItem[] } | null {
  if (!feed || typeof feed !== "object") return null;
  const f = feed as { v?: unknown; site?: unknown; generatedAt?: unknown; items?: unknown };
  if (f.v !== 1 || f.site !== site || typeof f.generatedAt !== "string" || Number.isNaN(Date.parse(f.generatedAt))) return null;
  if (!f.items || typeof f.items !== "object") return null;
  const items: FamilySearchItem[] = [];
  for (const raw of Object.values(f.items as Record<string, unknown>)) {
    const it = raw as { n?: unknown; u?: unknown; p?: unknown };
    if (typeof it?.n !== "string" || typeof it.u !== "string" || !it.p || typeof it.p !== "object") continue;
    const name = it.n.replace(/\s+/g, " ").trim().slice(0, 200);
    if (!name || !SAFE_PATH.test(it.u) || it.u.includes("..")) continue;
    const p: Partial<Record<FamilySearchRegion, number>> = {};
    for (const [r, c] of Object.entries(it.p as Record<string, unknown>)) if (REGION_SET.has(r) && isCents(c)) p[r as FamilySearchRegion] = c;
    if (Object.keys(p).length) items.push([site, name, it.u, p]);
  }
  return { generatedAt: new Date(f.generatedAt).toISOString(), items };
}

/**
 * The day's index from the feeds that were read. A site whose feed failed today keeps yesterday's items (`previous`),
 * so one sister's bad morning never empties its results; the read-time age check still drops it after four days.
 */
export function buildFamilySearch(
  read: Partial<Record<FamilySearchSite, { generatedAt: string; items: FamilySearchItem[] }>>,
  previous: FamilySearchIndex | null,
  now = new Date(),
): FamilySearchIndex {
  const sites: FamilySearchIndex["sites"] = {};
  const items: FamilySearchItem[] = [];
  for (const { key } of FAMILY_SEARCH_SITES) {
    const fresh = read[key];
    if (fresh) {
      sites[key] = fresh.generatedAt;
      items.push(...fresh.items);
    } else if (previous?.sites[key]) {
      sites[key] = previous.sites[key];
      items.push(...previous.items.filter((i) => i[0] === key));
    }
  }
  return { v: 1, generatedAt: now.toISOString(), sites, items };
}

export function validIndex(x: unknown): FamilySearchIndex | null {
  const i = x as FamilySearchIndex | null;
  return i && i.v === 1 && Array.isArray(i.items) && i.sites && typeof i.sites === "object" ? i : null;
}

export interface FamilyHit {
  site: FamilySearchSite;
  siteName: string;
  topic: string;
  name: string;
  /** Absolute, on the sister site, for this region. */
  url: string;
  /** Lowest in-stock store price, in `currency` cents. */
  cents: number;
  currency: string;
  region: FamilySearchRegion;
}

/** "/{r}/p/box" for one region: "/us/p/box". */
export const resolvePath = (u: string, region: string) => u.split("{r}").join(region.toLowerCase());

/** Results with a price in `region`, best match first, from sites whose feed is under four days old. */
export function searchFamily(index: FamilySearchIndex | null, query: string, region: FamilySearchRegion, limit = 12, now = Date.now()): FamilyHit[] {
  if (!index || !query.trim()) return [];
  const fresh = new Set(
    Object.entries(index.sites)
      .filter(([, at]) => typeof at === "string" && now - Date.parse(at) <= FAMILY_SEARCH_MAX_AGE_MS)
      .map(([k]) => k),
  );
  const scored: { it: FamilySearchItem; s: number }[] = [];
  for (const it of index.items) {
    if (!fresh.has(it[0]) || !isCents(it[3][region])) continue;
    const s = searchScore(query, it[1]);
    if (s > 0) scored.push({ it, s });
  }
  scored.sort((a, b) => b.s - a.s || a.it[3][region]! - b.it[3][region]!);
  return scored.slice(0, limit).map(({ it }) => {
    const site = FAMILY_SEARCH_SITES.find((x) => x.key === it[0])!;
    return {
      site: site.key,
      siteName: site.name,
      topic: site.topic,
      name: it[1],
      url: new URL(resolvePath(it[2], region), site.url).toString(),
      cents: it[3][region]!,
      currency: REGION_CURRENCY[region],
      region,
    };
  });
}
