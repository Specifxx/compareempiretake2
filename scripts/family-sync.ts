// The Compare Empire network's daily step (lib/family-network.ts, DECISIONS.md "Sites that grow each
// other", 2026-11-02), run by refresh-prices.yml after the catalogues are built, before the data commit:
// writes data/family/family-feed.json (our best deals and every camera page, for CamCompare) and copies
// CamCompare's feed into data/family/family-cluster.json. Never fails the run.
import fs from "node:fs";
import path from "node:path";
import { FAMILY_DIR, familyItems, familyLinks, familyProducts } from "../src/lib/family";
import { CLUSTER_FILE, FEED_FILE, buildFeed, clusterIds, fetchFamilyFeeds, type FamilyCluster } from "../src/lib/family-network";

async function main() {
  fs.mkdirSync(FAMILY_DIR, { recursive: true });
  const feed = buildFeed("empire", familyItems(), familyLinks(), new Date(), familyProducts());
  fs.writeFileSync(path.join(FAMILY_DIR, FEED_FILE), JSON.stringify(feed) + "\n");
  console.log(`[family] ${FEED_FILE}: ${feed.items.length} items, ${feed.products?.length ?? 0} camera pages`);
  const ids = clusterIds("empire");
  const feeds = await fetchFamilyFeeds(ids);
  console.log(`[family] read ${feeds.length}/${ids.length} sister feeds`);
  if (!feeds.length && fs.existsSync(path.join(FAMILY_DIR, CLUSTER_FILE))) return;
  const out: FamilyCluster = { v: 1, site: "empire", fetchedAt: new Date().toISOString(), feeds };
  fs.writeFileSync(path.join(FAMILY_DIR, CLUSTER_FILE), JSON.stringify(out) + "\n");
}

main().catch((e) => console.warn("[family] skipped:", e instanceof Error ? e.message : e));
