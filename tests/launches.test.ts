// The homepage's "Hot right now" row (content/launches.ts, lib/launches.ts): which launches are featured on a day, which
// catalogue product each one shows, and that the Fold8 never takes the Fold8 Ultra's row.
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { LAUNCHES } from "../src/content/launches";
import { featuredLaunches, hotLaunches, matchLaunch } from "../src/lib/launches";
import type { PhoneSummary } from "../src/lib/catalog";

const p = (slug: string, name: string, bestPrice: number, retailerCount: number): PhoneSummary =>
  ({ slug, name, bestPrice, retailerCount, href: `/phones/${slug}`, category: "phones", brand: "x", image: "i", inStock: true }) as unknown as PhoneSummary;
const byKey = (k: string) => LAUNCHES.find((l) => l.key === k)!;

test("every launch is sourced, dated and checked", () => {
  for (const l of LAUNCHES) {
    assert.match(l.releaseDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(l.featureUntil > l.releaseDate, l.key);
    assert.match(l.source.url, /^https:\/\//);
    assert.match(l.checked, /^\d{4}-\d{2}-\d{2}$/);
  }
  assert.equal(new Set(LAUNCHES.map((l) => l.key)).size, LAUNCHES.length);
});

test("featured from pre-order day to featureUntil, newest release first", () => {
  assert.deepEqual(featuredLaunches("2026-11-03").map((l) => l.key), ["iphone-duo", "galaxy-z-fold8", "galaxy-z-fold8-ultra", "galaxy-z-flip8"]);
  assert.ok(!featuredLaunches("2026-10-01").some((l) => l.key === "iphone-duo"), "before pre-orders");
  assert.ok(featuredLaunches("2026-10-16").some((l) => l.key === "iphone-duo"), "pre-order day");
  assert.deepEqual(featuredLaunches("2027-06-01"), []);
});

test("Fold8 and Fold8 Ultra each match their own product; most stores, then cheapest", () => {
  const items = [
    p("samsung-galaxy-z-fold8-ultra", "Samsung Galaxy Z Fold8 Ultra", 2999, 7),
    p("samsung-galaxy-z-fold8-graphite", "Samsung Galaxy Z Fold8 Graphite", 2799, 2),
    p("samsung-galaxy-z-fold8", "Samsung Galaxy Z Fold8", 2699, 7),
    p("samsung-galaxy-z-fold7", "Samsung Galaxy Z Fold7", 1999, 9),
  ];
  const fold = byKey("galaxy-z-fold8");
  assert.equal(matchLaunch(fold, items)?.slug, "samsung-galaxy-z-fold8");
  assert.equal(matchLaunch(byKey("galaxy-z-fold8-ultra"), items)?.slug, "samsung-galaxy-z-fold8-ultra");
  assert.equal(matchLaunch(fold, [items[3]]), null);
});

test("a released launch no store lists is left out; the region's own price is shown", () => {
  const read = () => [p("apple-iphone-duo", "Apple iPhone Duo", 3497, 7)];
  const row = hotLaunches("au", "2026-11-03", read as never);
  assert.deepEqual(row.map((h) => [h.launch.key, h.product?.bestPrice, h.status]), [["iphone-duo", 3497, "new"]]);
  const pre = hotLaunches("au", "2026-10-18", (() => []) as never);
  assert.deepEqual(pre.map((h) => [h.launch.key, h.product, h.status]), [["iphone-duo", null, "pre-order"]]);
});

test("the real catalogue: every region shows the iPhone Duo and the Fold8", () => {
  // lib/catalog.ts imports "server-only": read it under the react-server condition, as tests/client-data.test.ts does.
  const code = `import { getSummaries } from "./src/lib/catalog.ts"; import { hotLaunches } from "./src/lib/launches.ts";
    const out = {}; for (const r of ["au", "uk", "us"]) out[r] = hotLaunches(r, "2026-11-03", getSummaries).map((h) => [h.launch.key, h.product?.slug, h.product?.bestPrice, h.product?.retailerCount]);
    console.log(JSON.stringify(out));`;
  const out = JSON.parse(execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--input-type=module", "-e", code], { encoding: "utf8", maxBuffer: 64 << 20 }).trim().split("\n").pop()!);
  for (const r of ["au", "uk", "us"]) {
    const keys = out[r].map((h: string[]) => h[0]);
    assert.ok(keys.includes("iphone-duo"), `${r}: ${keys}`);
    assert.ok(keys.includes("galaxy-z-fold8"), `${r}: ${keys}`);
  }
  console.log(JSON.stringify(out));
});
