/**
 * The focus cull (lib/focus.ts, DECISIONS.md "The focus cull"), run after scripts/build-catalog.ts in every region:
 * rewrites each kept category's catalog.json, series.json and store-series.json with only the products in focus, and
 * removes a retired category's built files so no page, sitemap, grid, eBay or Amazon job sees it. Raw scrapes and the
 * daily history are left whole, so a product that starts to qualify comes back with its price history.
 *
 *   npx tsx scripts/focus-catalog.ts            # every region
 *   FOCUS_DEMAND_FILE=gsc-pages.json npx tsx scripts/focus-catalog.ts
 *
 * With FOCUS_DEMAND_FILE (Search Console page rows from the `demand` branch, as the eBay job reads), it first refreshes
 * data/focus/demand.json, the committed list of product paths with real demand; without it, the committed list is used.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { CATEGORIES } from "../src/lib/categories";
import { demandPaths, focusReason, isRetired } from "../src/lib/focus";
import { dataPath, REGION_IDS } from "../src/lib/region";
import type { Catalog, CategoryId } from "../src/lib/types";

const DEMAND = "data/focus/demand.json";
const src = process.env.FOCUS_DEMAND_FILE;
const readGsc = (file: string) => {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as { updatedAt?: string; pages: Record<string, [number, number, number?]> };
  } catch {
    return undefined; // an empty file from a failed fetch: keep the committed list
  }
};
const gsc = src && existsSync(src) ? readGsc(src) : undefined;
if (gsc?.pages) {
  const productish = demandPaths(gsc.pages).filter((p) => /^\/(?:(?:us|uk|ca|sg)\/)?[a-z-]+\/[^/]+$/.test(p) && !/^\/(?:(?:us|uk|ca|sg)\/)?(?:brands|compare|guides|browse|deals|forum|sitemaps)\//.test(p));
  mkdirSync("data/focus", { recursive: true });
  writeFileSync(DEMAND, JSON.stringify({ updatedAt: gsc.updatedAt, paths: productish }, null, 1) + "\n");
  console.log(`demand: ${productish.length} product paths from Search Console`);
}
const demand = new Set<string>(existsSync(DEMAND) ? (JSON.parse(readFileSync(DEMAND, "utf8")) as { paths: string[] }).paths : []);

let before = 0, after = 0;
const report: Record<string, { before: number; after: number }> = {};
for (const region of REGION_IDS) {
  for (const c of CATEGORIES) {
    const dir = dataPath(region, c.id);
    const file = `${dir}/catalog.json`;
    if (!existsSync(file)) continue;
    if (isRetired(c.id)) {
      for (const f of ["catalog.json", "series.json", "store-series.json"]) rmSync(`${dir}/${f}`, { force: true });
      console.log(`${region}/${c.id}: retired`);
      continue;
    }
    const catalog = JSON.parse(readFileSync(file, "utf8")) as Catalog;
    const kept = catalog.phones.filter((p) => focusReason(p, c.id as CategoryId, region, demand));
    const keep = new Set(kept.map((p) => p.slug));
    before += catalog.phones.length;
    after += kept.length;
    report[`${region}/${c.id}`] = { before: catalog.phones.length, after: kept.length };
    if (kept.length === catalog.phones.length) continue;
    writeFileSync(file, JSON.stringify({ ...catalog, phones: kept }) + "\n");
    for (const f of ["series.json", "store-series.json"]) {
      const path = `${dir}/${f}`;
      if (!existsSync(path)) continue;
      const all = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
      writeFileSync(path, JSON.stringify(Object.fromEntries(Object.entries(all).filter(([slug]) => keep.has(slug)))) + "\n");
    }
    console.log(`${region}/${c.id}: ${kept.length} of ${catalog.phones.length} kept`);
  }
}
console.log(`focus: ${after} of ${before} products kept`);
