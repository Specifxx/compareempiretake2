/**
 * Scrapes every retailer and writes data/phones/raw/<retailer>.json.
 * A retailer that fails keeps yesterday's file, so one broken site never
 * empties the catalogue.
 */
import { writeFileSync } from "node:fs";
import type { RawOffer, RetailerId } from "../src/lib/types";
import { scrapeGoodGuys } from "./scrapers/goodguys";
import { scrapeJbHifi } from "./scrapers/jbhifi";
import * as more from "./scrapers/more";

const SCRAPERS: Partial<Record<RetailerId, () => Promise<RawOffer[]>>> = {
  jbhifi: scrapeJbHifi,
  // Harvey Norman (a challenge page instead of __NEXT_DATA__ since 22 Oct) and Mobileciti (403 since
  // 22 Oct) put up bot walls, which are never worked around (DECISIONS.md, 2026-11-05).
  thegoodguys: scrapeGoodGuys,
  apple: more.scrapeApple,
  samsung: more.scrapeSamsung,
  telstra: more.scrapeTelstra,
  optus: more.scrapeOptus,
  vodafone: more.scrapeVodafone,
  amaysim: more.scrapeAmaysim,
  telechoice: more.scrapeTeleChoice,
  costco: more.scrapeCostco,
  umart: more.scrapeUmart,
  msy: more.scrapeMsy,
  digidirect: more.scrapeDigiDirect,
  betta: more.scrapeBetta,
  mwave: more.scrapeMwave,
};

async function main() {
  const only = process.argv.slice(2) as RetailerId[];
  let failed = 0;
  for (const [id, fn] of Object.entries(SCRAPERS) as [RetailerId, () => Promise<RawOffer[]>][]) {
    if (only.length && !only.includes(id)) continue;
    const t = Date.now();
    try {
      const offers = await fn();
      if (offers.length < 3) throw new Error(`only ${offers.length} offers — refusing to overwrite`);
      offers.sort((a, b) => a.title.localeCompare(b.title));
      writeFileSync(`data/phones/raw/${id}.json`, JSON.stringify({ scrapedAt: new Date().toISOString(), offers }, null, 1) + "\n");
      console.log(`${id}: ${offers.length} offers in ${((Date.now() - t) / 1000).toFixed(0)}s`);
    } catch (e) {
      failed++;
      console.error(`${id}: FAILED — ${(e as Error).message}`);
    }
  }
  if (failed && failed >= Object.keys(SCRAPERS).length / 2) process.exit(1);
}

main();
