/**
 * Backfills each store's price history from Internet Archive (Wayback Machine)
 * snapshots of the same product pages we scrape today. These are real prices
 * the store showed on the archived date — nothing is estimated.
 *
 *   npx tsx scripts/backfill-archive.ts [--cat tvs] [retailer ...]
 *
 * Writes data/<category>/archive/<retailer>.json (category defaults to phones): { "<product url>": [[date, price], ...] }.
 * URLs already in the file are skipped, so reruns pick up where they left off.
 * Runs in GitHub Actions (web.archive.org is reachable there).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { RawOffer, RetailerId } from "../src/lib/types";
import { pool, sleep } from "./lib/http";

// Stores whose product URL is one storage + colour, so a snapshot's price is that listing's.
const SUPPORTED: RetailerId[] = ["jbhifi", "harveynorman", "thegoodguys", "mobileciti", "umart", "msy", "costco", "betta", "mwave", "centrecom", "ple"];
const SINCE = "20250101";
const MAX_SNAPSHOTS = 24;
const UA = "CompareEmpireBackfill/1.0 (+https://compareempire.com/about)";

async function fetchText(url: string, tries = 4): Promise<string | null> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(60_000) });
      if (res.status === 404) return null;
      if (res.status === 429 || res.status >= 500) throw new Error(String(res.status));
      if (!res.ok) return null;
      return await res.text();
    } catch {
      await sleep(3000 * 2 ** i);
    }
  }
  return null;
}

/** Price from an archived product page: meta tags, then JSON-LD, then Magento attributes. */
export function priceFromHtml(html: string): number | undefined {
  const num = (s?: string) => (s ? Number(s.replace(/[^0-9.]/g, "")) : NaN);
  const meta = html.match(/<meta[^>]+(?:property|name)="(?:product:price:amount|og:price:amount)"[^>]+content="([^"]+)"/i)?.[1];
  if (num(meta) > 0) return num(meta);
  for (const [, body] of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const stack: unknown[] = [JSON.parse(body)];
      while (stack.length) {
        const o = stack.pop();
        if (Array.isArray(o)) stack.push(...o);
        else if (o && typeof o === "object") {
          const r = o as Record<string, unknown>;
          if (/offer/i.test(String(r["@type"])) && num(String(r.price ?? r.lowPrice ?? "")) > 0) return num(String(r.price ?? r.lowPrice));
          stack.push(...Object.values(r));
        }
      }
    } catch {}
  }
  const magento = html.match(/data-price-amount="([\d.]+)"\s+data-price-type="finalPrice"/)?.[1];
  if (num(magento) > 0) return num(magento);
  return undefined;
}

async function snapshots(url: string): Promise<{ ts: string; original: string }[]> {
  const q = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url.replace(/^https?:\/\//, ""))}&output=json&from=${SINCE}&filter=statuscode:200&collapse=timestamp:8&fl=timestamp,original`;
  const body = await fetchText(q);
  if (!body) return [];
  try {
    const rows = (JSON.parse(body) as string[][]).slice(1).map(([ts, original]) => ({ ts, original }));
    if (rows.length <= MAX_SNAPSHOTS) return rows;
    const step = rows.length / MAX_SNAPSHOTS;
    return Array.from({ length: MAX_SNAPSHOTS }, (_, i) => rows[Math.floor(i * step)]);
  } catch {
    return [];
  }
}

async function backfill(category: string, retailer: RetailerId) {
  const raw = `data/${category}/raw/${retailer}.json`;
  if (!existsSync(raw)) return;
  const offers = (JSON.parse(readFileSync(raw, "utf8")) as { offers: RawOffer[] }).offers.filter((o) => o.kind !== "plan");
  mkdirSync(`data/${category}/archive`, { recursive: true });
  const out = `data/${category}/archive/${retailer}.json`;
  const done: Record<string, [string, number][]> = existsSync(out) ? JSON.parse(readFileSync(out, "utf8")) : {};
  const todo = offers.filter((o) => !(o.url in done));
  console.log(`${category}/${retailer}: ${todo.length} product pages to check (${Object.keys(done).length} done before)`);
  let found = 0;
  let n = 0;
  await pool(todo, 3, async (o) => {
    const snaps = await snapshots(o.url);
    const pts: [string, number][] = [];
    for (const s of snaps) {
      const html = await fetchText(`https://web.archive.org/web/${s.ts}id_/${s.original}`);
      const price = html ? priceFromHtml(html) : undefined;
      // A price far from today's is a different product on a reused URL, or a bad parse.
      if (price && price > o.price * 0.5 && price < o.price * 2.2) {
        pts.push([`${s.ts.slice(0, 4)}-${s.ts.slice(4, 6)}-${s.ts.slice(6, 8)}`, Math.round(price * 100) / 100]);
      }
      await sleep(400);
    }
    done[o.url] = pts;
    found += pts.length;
    if (++n % 20 === 0) {
      writeFileSync(out, JSON.stringify(done) + "\n");
      console.log(`  ${retailer}: ${n}/${todo.length} pages, ${found} prices so far`);
    }
  });
  writeFileSync(out, JSON.stringify(done) + "\n");
  console.log(`${retailer}: ${found} archived prices from ${todo.length} pages`);
}

async function main() {
  const args = process.argv.slice(2);
  const ci = args.indexOf("--cat");
  const category = ci >= 0 ? args.splice(ci, 2)[1] : "phones";
  const only = args as RetailerId[];
  for (const r of SUPPORTED) if (!only.length || only.includes(r)) await backfill(category, r);
}

if (process.argv[1]?.endsWith("backfill-archive.ts")) main();
