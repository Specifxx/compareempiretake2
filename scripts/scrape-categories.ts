/**
 * Runs every category scraper in scripts/scrapers/categories/ and writes
 * data/<category>/raw/<retailer>.json. A store/category that fails keeps
 * yesterday's file.
 *
 *   npx tsx scripts/scrape-categories.ts                 # everything
 *   npx tsx scripts/scrape-categories.ts jbhifi umart    # some stores
 *   npx tsx scripts/scrape-categories.ts --cat tvs       # one category
 *   npx tsx scripts/scrape-categories.ts --region us     # US stores (scripts/scrapers/regions/us/<store>.ts → data/us/<cat>/raw/us-<store>.json)
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { CategoryId, RawOffer } from "../src/lib/types";
import { pool } from "./lib/http";

type Scrapers = Partial<Record<CategoryId, () => Promise<RawOffer[]>>>;

async function main() {
  const args = process.argv.slice(2);
  const ci = args.indexOf("--cat");
  const onlyCat = ci >= 0 ? (args.splice(ci, 2)[1] as CategoryId) : undefined;
  const ri = args.indexOf("--region");
  const region = ri >= 0 ? args.splice(ri, 2)[1] : "au";
  if (!/^(au|us|uk)$/.test(region)) throw new Error(`unknown region ${region}`);
  const onlyStores = args;
  const dir = path.join(process.cwd(), region === "au" ? "scripts/scrapers/categories" : `scripts/scrapers/regions/${region}`);
  const root = region === "au" ? "data" : `data/${region}`;
  const prefix = region === "au" ? "" : `${region}-`;
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".ts")) : [];
  let ok = 0, failed = 0;
  // Stores run four at a time (different sites, so no store sees more traffic); each store's
  // categories still run one after another.
  await pool(files, Number(process.env.SCRAPE_STORES_AT_ONCE || 4), async (f) => {
    const store = f.replace(/\.ts$/, "");
    const retailer = prefix + store;
    if (onlyStores.length && !onlyStores.includes(store) && !onlyStores.includes(retailer)) return;
    const mod = (await import(pathToFileURL(path.join(dir, f)).href)) as { scrapers?: Scrapers };
    for (const [cat, fn] of Object.entries(mod.scrapers ?? {}) as [CategoryId, () => Promise<RawOffer[]>][]) {
      if (onlyCat && cat !== onlyCat) continue;
      const t = Date.now();
      try {
        const offers = await fn();
        if (offers.length < 3) throw new Error(`only ${offers.length} offers — refusing to overwrite`);
        offers.sort((a, b) => a.title.localeCompare(b.title));
        mkdirSync(`${root}/${cat}/raw`, { recursive: true });
        writeFileSync(`${root}/${cat}/raw/${retailer}.json`, JSON.stringify({ scrapedAt: new Date().toISOString(), offers }, null, 1) + "\n");
        console.log(`${cat}/${retailer}: ${offers.length} offers in ${((Date.now() - t) / 1000).toFixed(0)}s`);
        ok++;
      } catch (e) {
        failed++;
        console.error(`${cat}/${retailer}: FAILED — ${(e as Error).message}`);
      }
    }
  });
  console.log(`done: ${ok} ok, ${failed} failed`);
  if (failed && !ok) process.exit(1);
}

main();
