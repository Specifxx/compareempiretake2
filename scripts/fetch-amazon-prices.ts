/**
 * Runs first in every Vercel build: today's Amazon prices, in every region with a tag (AU, US, UK), for the
 * ASINs scripts/amazon-asins.ts found, written to data/amazon-live/<region>.json (git-ignored). Amazon's licence lets a price be kept for 24 hours and
 * shown with its time, so prices are fetched by each build and never committed; the product page shows one
 * only while under 24 hours old (lib/amazon-live.ts), and the browser hides it after that.
 * Most-compared products first, AMAZON_BUILD_CALLS getItems calls (ten ASINs each, one a second; 100 by
 * default a region, under two minutes of build each). A price far from the variant's store median (under 60%
 * or over 160%) is dropped. Without credentials, or on any error, it writes nothing and never fails the build;
 * a store whose account has no API access yet (403) is skipped and the next region still runs.
 *   npx tsx scripts/fetch-amazon-prices.ts
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { amazonStore, type AmazonRegion } from "../src/lib/amazon";
import { AmazonRefused, credentialsFor, creatorsClient, CURRENCY, pickListing, PRICE_RESOURCES } from "../src/lib/amazon-creators";
import { productsFor, storeMedian } from "./amazon-shared";

const REGIONS: AmazonRegion[] = ["au", "us", "uk"];
const asinsFile = (r: AmazonRegion) => path.join(process.cwd(), "data", "amazon", `asins-${r}.json`);
const outFile = (r: AmazonRegion) => path.join(process.cwd(), "data", "amazon-live", `${r}.json`);

async function main() {
  rmSync(path.join(process.cwd(), "data", "amazon-live"), { recursive: true, force: true });
  for (const r of REGIONS) {
    if (!amazonStore(r)) continue;
    await region(r).catch((e) => console.log(`Amazon prices ${r} skipped: ${(e as Error).message}`));
  }
}

async function region(r: AmazonRegion) {
  const ASINS = asinsFile(r);
  const OUT = outFile(r);
  const creds = credentialsFor(r);
  if (!creds || !existsSync(ASINS)) return console.log(`Amazon prices ${r}: no credentials or no ASINs yet, skipped.`);
  const known = JSON.parse(readFileSync(ASINS, "utf8")) as Record<string, { asin: string | null }>;
  const products = productsFor(r);
  const byKey = new Map(products.flatMap((p) => p.variants.map((v) => [`${p.category}/${p.slug}/${v.id}`, { p, v: v.id }] as const)));
  // In catalogue order (most-compared first); one ASIN may serve two keys (a variant listed twice).
  const wanted = [...byKey.keys()].filter((k) => known[k]?.asin);
  const cap = Number(process.env.AMAZON_BUILD_CALLS || 100) * 10;
  const keys = wanted.slice(0, cap);
  const api = await creatorsClient(r, amazonStore(r)!.tag, creds);
  const fetchedAt = new Date().toISOString();
  const prices: Record<string, { asin: string; amount: number }> = {};
  for (let i = 0; i < keys.length; i += 10) {
    const batch = keys.slice(i, i + 10);
    const ids = [...new Set(batch.map((k) => known[k].asin!))];
    let items;
    try {
      items = await api.call("getItems", { itemIds: ids, itemIdType: "ASIN", resources: PRICE_RESOURCES });
    } catch (e) {
      console.log(`Amazon prices ${r}: ${(e as Error).message}`);
      if (e instanceof AmazonRefused) break;
      continue;
    }
    for (const k of batch) {
      const it = items.find((x) => x.asin === known[k].asin);
      const pick = it && pickListing(it, CURRENCY[r]);
      const ref = storeMedian(byKey.get(k)!.p, byKey.get(k)!.v);
      if (!pick || (ref && (pick.amount < ref * 0.6 || pick.amount > ref * 1.6))) continue;
      prices[k] = { asin: it!.asin, amount: pick.amount };
    }
  }
  if (!Object.keys(prices).length) return console.log(`Amazon prices ${r}: none (${api.calls()} calls).`);
  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify({ fetchedAt, prices }) + "\n");
  console.log(`Amazon prices ${r}: ${Object.keys(prices).length} of ${wanted.length} ASINs priced in ${api.calls()} calls.`);
}

main().catch((e) => console.log(`Amazon prices skipped: ${(e as Error).message}`));
