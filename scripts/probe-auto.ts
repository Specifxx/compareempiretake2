/**
 * Store survey for `auto-shopify.ts`, run from GitHub Actions (the sandbox can't reach stores). Each line of the
 * candidates file is "<region> <base url>". For each store it prints the shop's base currency (`/meta.json`), the
 * product count, and how many variants each category's shared title check takes, with a few sample titles, so a
 * store is added only when its currency is the region's and its categories hold real product.
 *
 *   npx tsx scripts/probe-auto.ts docs/stores/candidates.txt
 */
import { readFileSync, writeFileSync } from "node:fs";
import type { CategoryId } from "../src/lib/types";
import { getJson, pool } from "./lib/http";
import { catalogue, readAuto } from "./scrapers/auto-shopify";

const ALL: CategoryId[] = [
  "lego", "robot-vacuums", "vacuums", "air-fryers", "coffee-machines", "fridges", "washing-machines", "dishwashers",
  "soundbars", "headphones", "speakers", "drones", "cameras", "consoles", "smartwatches", "phones", "tablets",
  "laptops", "desktops", "monitors", "tvs", "printers", "routers", "graphics-cards", "cpus", "ssds", "ram", "motherboards",
];
const CUR: Record<string, string> = { us: "USD", uk: "GBP", au: "AUD" };

async function main() {
  const lines = readFileSync(process.argv[2], "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  const results: unknown[] = [];
  await pool(lines, 10, async (line) => {
    const [region, base0] = line.split(/\s+/);
    const base = base0.replace(/\/$/, "");
    const r: Record<string, unknown> = { region, base };
    try {
      const meta: { currency?: string; name?: string; country?: string } = await getJson<{ currency?: string; name?: string; country?: string; myshopify_domain?: string }>(`${base}/meta.json`).catch(() => ({}) as Record<string, string>);
      r.name = meta.name;
      r.currency = meta.currency;
      r.country = meta.country;
      const products = await catalogue(base, 20);
      r.products = products.length;
      const woo = products[0] as unknown as { woo?: boolean; currency?: string } | undefined;
      if (woo?.woo) {
        r.platform = "woo";
        r.currency = woo.currency;
      }
      r.vendors = [...new Set(products.map((p) => p.vendor))].length;
      const got = await readAuto({ retailer: "probe" as never, base, cats: ALL });
      r.cats = Object.fromEntries([...got].filter(([, o]) => o.length).map(([c, o]) => [c, o.length]));
      r.samples = Object.fromEntries([...got].filter(([, o]) => o.length).map(([c, o]) => [c, o.filter((_, i) => i % Math.max(1, Math.floor(o.length / 6)) === 0).slice(0, 6).map((x) => `${x.price} ${x.brand ?? "?"} | ${x.title}`)]));
      r.ok = r.currency === CUR[region];
    } catch (e) {
      r.error = (e as Error).message.slice(0, 120);
    }
    results.push(r);
    const cats = r.cats ? Object.entries(r.cats as Record<string, number>).map(([c, n]) => `${c}:${n}`).join(" ") : "";
    console.log(`${r.ok ? "OK " : "-- "}${region} ${base} ${r.currency ?? "?"} products=${r.products ?? "-"} ${r.error ?? cats}`);
  });
  writeFileSync("probe-auto.json", JSON.stringify(results, null, 1));
  console.log("\n==== SAMPLES");
  for (const r of results as { ok?: boolean; base: string; samples?: Record<string, string[]> }[]) {
    if (!r.ok || !r.samples) continue;
    console.log(`## ${r.base}`);
    for (const [c, s] of Object.entries(r.samples)) for (const x of s) console.log(`  ${c}: ${x}`);
  }
}

main();
