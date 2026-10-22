/**
 * Scrapes every retailer and writes data/raw/<retailer>.json.
 * A retailer that fails keeps yesterday's file, so one broken site never
 * empties the catalogue.
 */
import { writeFileSync } from "node:fs";
import type { RawOffer, RetailerId } from "../src/lib/types";
import { scrapeGoodGuys } from "./scrapers/goodguys";
import { scrapeHarveyNorman } from "./scrapers/harveynorman";
import { scrapeJbHifi } from "./scrapers/jbhifi";
import { scrapeMobileciti } from "./scrapers/mobileciti";

const SCRAPERS: Record<RetailerId, () => Promise<RawOffer[]>> = {
  jbhifi: scrapeJbHifi,
  harveynorman: scrapeHarveyNorman,
  thegoodguys: scrapeGoodGuys,
  mobileciti: scrapeMobileciti,
};

async function main() {
  const only = process.argv.slice(2) as RetailerId[];
  let failed = 0;
  for (const [id, fn] of Object.entries(SCRAPERS) as [RetailerId, () => Promise<RawOffer[]>][]) {
    if (only.length && !only.includes(id)) continue;
    const t = Date.now();
    try {
      const offers = await fn();
      if (offers.length < 10) throw new Error(`only ${offers.length} offers — refusing to overwrite`);
      offers.sort((a, b) => a.title.localeCompare(b.title));
      writeFileSync(`data/raw/${id}.json`, JSON.stringify({ scrapedAt: new Date().toISOString(), offers }, null, 1) + "\n");
      console.log(`${id}: ${offers.length} offers in ${((Date.now() - t) / 1000).toFixed(0)}s`);
    } catch (e) {
      failed++;
      console.error(`${id}: FAILED — ${(e as Error).message}`);
    }
  }
  if (failed === Object.keys(SCRAPERS).length) process.exit(1);
}

main();
