// The family search index (src/lib/family-search.ts, DECISIONS.md 2026-11-10): read every sister's public
// /alert-feed.json once a day and write data/family/family-search.json for /api/search and /api/mcp.
// Run by refresh-prices.yml before the data commit. Never fails the run: a site that can't be read keeps
// yesterday's items, and the routes drop any site older than four days.
import fs from "node:fs";
import path from "node:path";
import {
  FAMILY_FEED_MAX_BYTES,
  FAMILY_SEARCH_FILE,
  FAMILY_SEARCH_SITES,
  buildFamilySearch,
  feedItems,
  validIndex,
  type FamilySearchIndex,
  type FamilySearchItem,
  type FamilySearchSite,
} from "../src/lib/family-search";

const DIR = path.join(process.cwd(), "data", "family");
const FILE = path.join(DIR, FAMILY_SEARCH_FILE);

async function readFeed(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "CompareEmpire-search/1 (+https://compareempire.com)" },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len > FAMILY_FEED_MAX_BYTES) throw new Error(`too big (${len} bytes)`);
  const text = await res.text();
  if (text.length > FAMILY_FEED_MAX_BYTES) throw new Error(`too big (${text.length} chars)`);
  return JSON.parse(text);
}

async function main() {
  fs.mkdirSync(DIR, { recursive: true });
  let previous: FamilySearchIndex | null = null;
  try {
    previous = validIndex(JSON.parse(fs.readFileSync(FILE, "utf8")));
  } catch {}
  const read: Partial<Record<FamilySearchSite, { generatedAt: string; items: FamilySearchItem[] }>> = {};
  for (const s of FAMILY_SEARCH_SITES) {
    try {
      const got = feedItems(s.key, await readFeed(`${s.url}/alert-feed.json`));
      if (!got) throw new Error("not a version-1 feed for this site");
      read[s.key] = got;
      console.log(`[family-search] ${s.key}: ${got.items.length} products (feed ${got.generatedAt})`);
    } catch (e) {
      console.warn(`[family-search] ${s.key}: kept yesterday's items: ${e instanceof Error ? e.message : e}`);
    }
  }
  const index = buildFamilySearch(read, previous);
  if (!index.items.length && previous) return console.warn("[family-search] nothing read; file left as it was");
  fs.writeFileSync(FILE, JSON.stringify(index) + "\n");
  console.log(`[family-search] ${index.items.length} products from ${Object.keys(index.sites).length} sites, ${(fs.statSync(FILE).size / 1024).toFixed(0)} KB`);
}

main().catch((e) => console.warn("[family-search] skipped:", e instanceof Error ? e.message : e));
