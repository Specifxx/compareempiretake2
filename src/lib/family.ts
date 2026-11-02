// Compare Empire's side of the network (lib/family-network.ts, DECISIONS.md "Sites that grow each
// other", 2026-11-02): the feed the daily price job publishes (data/family/family-feed.json) and the
// cluster file it copies from CamCompare (data/family/family-cluster.json). Pages read the committed
// file only: never a request-time fetch.
import fs from "node:fs";
import path from "node:path";
import { getDeals, getProducts, productHref } from "./catalog";
import { RETAILERS } from "./retailers";
import { SITE } from "./site";
import type { RegionId } from "./region";
import {
  CLUSTER_FILE,
  pickTiles,
  sameProduct,
  validCluster,
  type FamilyFeed,
  type FamilyItem,
  type FamilyProduct,
  type FamilyRegion,
  type FamilyTile,
} from "./family-network";

export const FAMILY_DIR = path.join(process.cwd(), "data", "family");
const REGION: Record<RegionId, FamilyRegion> = { au: "AU", us: "US", uk: "UK" };
const CURRENCY: Record<RegionId, string> = { au: "AUD", us: "USD", uk: "GBP" };
const REGIONS: RegionId[] = ["au", "us", "uk"];

let cluster: FamilyFeed[] | null = null;
export function familyFeeds(now = Date.now()): FamilyFeed[] {
  if (cluster) return cluster;
  try {
    cluster = validCluster(JSON.parse(fs.readFileSync(path.join(FAMILY_DIR, CLUSTER_FILE), "utf8")), "empire", now);
  } catch {
    cluster = [];
  }
  return cluster;
}

/** CamCompare's best camera deals for this region: up to three tiles (the tech cluster has one sister). */
export function familyTiles(region: RegionId): FamilyTile[] {
  return pickTiles(familyFeeds(), { self: "empire", cluster: "tech", kind: "deal", region: REGION[region], perSite: 3, max: 3 });
}

/** The same camera on CamCompare (specs, used prices): exact model only, else null. */
export function camCompareFor(name: string): FamilyProduct | null {
  return sameProduct(name, familyFeeds().find((f) => f.site === "cam")?.products);
}

/** Today's deals for the sisters: store gaps and RRPs another store backs up, never a "was" price drop. */
export function familyItems(): FamilyItem[] {
  const out: FamilyItem[] = [];
  for (const region of REGIONS) {
    // The best overall, plus the best cameras (what CamCompare's readers buy).
    const deals = [...getDeals(12, undefined, region), ...getDeals(6, "cameras", region)];
    for (const d of deals) {
      if (d.kind === "drop") continue;
      out.push({
        kind: "deal",
        cluster: "tech",
        region: REGION[region],
        title: d.phone.name,
        url: `${SITE}${productHref(d.phone)}`,
        image: d.phone.image ?? null,
        cents: Math.round(d.offer.price * 100),
        currency: CURRENCY[region],
        store: (RETAILERS as Record<string, { name: string }>)[d.offer.retailer]?.name ?? d.offer.retailer,
        refCents: Math.round(d.reference * 100),
        refLabel: d.kind === "rrp" ? "RRP" : "median store price",
        category: d.phone.category,
      });
    }
  }
  return out;
}

export function familyLinks(): FamilyFeed["links"] {
  return { AU: { deals: `${SITE}/deals` }, US: { deals: `${SITE}/us/deals` }, UK: { deals: `${SITE}/uk/deals` } };
}

/** Every camera page, for CamCompare's hand-off back to us (US first: the root edition). */
export function familyProducts(): FamilyProduct[] {
  const seen = new Set<string>();
  const out: FamilyProduct[] = [];
  for (const region of ["us", "au", "uk"] as RegionId[]) {
    for (const p of getProducts("cameras", region)) {
      const key = p.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ name: p.name, url: `${SITE}${productHref(p)}` });
    }
  }
  return out;
}
