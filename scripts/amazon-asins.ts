/**
 * Finds the Amazon ASIN of each product variant, in every region with an Amazon tag (AU, US, UK), with the
 * Creators API's searchItems, in the daily refresh (GitHub Actions). A result counts only when
 * lib/listing-parse.ts parses its title to the product's own group key and variant; ten results, no match, no
 * ASIN. Found ASINs and misses go in data/amazon/asins-<region>.json (ASINs may be stored; prices never are).
 * A miss is retried after 30 days. Without credentials it does nothing; a refusal (that store's account has
 * no API access yet) ends that region quietly and the next region still runs.
 *   npx tsx scripts/amazon-asins.ts            AMAZON_SEARCH_BUDGET=400 a region by default
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { amazonStore, type AmazonRegion } from "../src/lib/amazon";
import { AmazonRefused, credentialsFor, creatorsClient } from "../src/lib/amazon-creators";
import { amazonTitleMatches } from "../src/lib/listing-parse";
import { productsFor } from "./amazon-shared";

export const REGIONS: AmazonRegion[] = ["au", "us", "uk"];
const file = (r: AmazonRegion) => path.join(process.cwd(), "data", "amazon", `asins-${r}.json`);
// What the last run did per region, for /admin and Empire HQ: "off" (no secrets), "refused" (no API access
// yet for that store), "ok".
const statusFile = (r: AmazonRegion) => path.join(process.cwd(), "data", "amazon", `status-${r}.json`);
const RECHECK_MISS_DAYS = 30;
type Entry = { asin: string | null; checked: string };

async function main() {
  for (const r of REGIONS) if (amazonStore(r)) await region(r);
}

async function region(r: AmazonRegion) {
  const FILE = file(r);
  const status = (o: object) => writeFileSync(statusFile(r), JSON.stringify({ at: new Date().toISOString(), ...o }) + "\n");
  const creds = credentialsFor(r);
  mkdirSync(path.dirname(FILE), { recursive: true });
  if (!creds) {
    status({ state: "off" });
    return console.log(`Amazon ASINs ${r}: no AMAZON_CREATORS_* credentials yet, skipped.`);
  }
  const budget = Number(process.env.AMAZON_SEARCH_BUDGET || 400);
  const today = new Date().toISOString().slice(0, 10);
  const known: Record<string, Entry> = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : {};
  const products = productsFor(r);
  const live = new Set<string>();
  const todo: { p: (typeof products)[number]; v: string; key: string; q: string }[] = [];
  for (const p of products)
    for (const v of p.variants) {
      const key = `${p.category}/${p.slug}/${v.id}`;
      live.add(key);
      const k = known[key];
      if (k?.asin) continue;
      if (k && (Date.parse(today) - Date.parse(k.checked)) / 864e5 < RECHECK_MISS_DAYS) continue;
      todo.push({ p, v: v.id, key, q: `${p.name}${v.id && p.variants.length > 1 ? ` ${v.label}` : ""}` });
    }
  const api = await creatorsClient(r, amazonStore(r)!.tag, creds).catch((e) => {
    console.log(`Amazon ASINs ${r}: ${(e as Error).message} (no Creators API access yet?), skipped.`);
    status({ state: "refused", note: (e as Error).message.slice(0, 120) });
    return null;
  });
  if (!api) return;
  let found = 0, searched = 0, refused = "";
  for (const t of todo.slice(0, budget)) {
    try {
      const items = await api.call("searchItems", { keywords: t.q, resources: ["itemInfo.title"], itemCount: 10 });
      searched++;
      const hit = items.find((it) => amazonTitleMatches(t.p, t.v, it.itemInfo?.title?.displayValue ?? ""));
      known[t.key] = { asin: hit?.asin ?? null, checked: today };
      if (hit) found++;
    } catch (e) {
      console.log(`Amazon ASINs ${r}: stopped at ${t.key}: ${(e as Error).message}`);
      if (e instanceof AmazonRefused) {
        refused = (e as Error).message.slice(0, 120);
        break;
      }
    }
  }
  // Products gone from the catalogue drop out, so the file stays the size of the catalogue.
  const out = Object.fromEntries(Object.entries(known).filter(([k]) => live.has(k)).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(FILE, JSON.stringify(out, null, 0).replace(/},"/g, '},\n"') + "\n");
  const asins = Object.values(out).filter((e) => e.asin).length;
  status({ state: refused && !searched ? "refused" : "ok", searched, found, known: asins, waiting: Math.max(0, todo.length - searched), ...(refused ? { note: refused } : {}) });
  console.log(`Amazon ASINs ${r}: ${searched} searched, ${found} found, ${asins} known, ${Math.max(0, todo.length - searched)} waiting.`);
}

main().catch((e) => console.log(`Amazon ASINs skipped: ${(e as Error).message}`));
