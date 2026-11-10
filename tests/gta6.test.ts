// The GTA 6 hub (lib/gta6.ts): only PS5 and Xbox Series consoles, in stock, most stores first; every fact sourced to Rockstar.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GTA6, GTA6_ACCESSORIES, GTA6_REGIONS, gta6Consoles } from "../src/lib/gta6";
import type { PhoneSummary } from "../src/lib/catalog";

const c = (name: string, bestPrice: number, retailerCount: number, extra: Partial<PhoneSummary> = {}): PhoneSummary =>
  ({ slug: name, name, model: name, bestPrice, retailerCount, href: `/consoles/${name}`, category: "consoles", brand: "x", inStock: true, ...extra }) as unknown as PhoneSummary;

test("only PlayStation 5 and Xbox Series consoles, in stock, most stores then cheapest", () => {
  const out = gta6Consoles([
    c("Nintendo Switch 2 Console", 500, 9),
    c("MSI Claw 8 Handheld Gaming Console", 900, 4),
    c("Sony PlayStation 5 Slim Console", 600, 3),
    c("Microsoft Xbox Series X", 650, 5),
    c("Microsoft Xbox Series S", 400, 5),
    c("PS5 DualSense Controller", 100, 8),
    c("Sony PlayStation 5 Pro", 1000, 9, { inStock: false }),
  ]);
  assert.deepEqual(out.map((p) => p.name), ["Microsoft Xbox Series S", "Microsoft Xbox Series X", "Sony PlayStation 5 Slim Console"]);
});

test("the facts are Rockstar's, dated and checked; the hub exists in the regions that have consoles", () => {
  assert.equal(GTA6.releaseDate, "2026-11-19");
  assert.match(GTA6.source.url, /^https:\/\/www\.rockstargames\.com\/newswire\//);
  assert.deepEqual(GTA6_REGIONS, ["au", "us", "uk"]);
  assert.equal(new Set(GTA6_ACCESSORIES.map((a) => a.key)).size, GTA6_ACCESSORIES.length);
});

test("the hub is in the sitemap, IndexNow and the page routes", () => {
  const seo = readFileSync("src/lib/seo.ts", "utf8");
  assert.match(seo, /"\/gta-6"/);
  assert.match(readFileSync("scripts/indexnow.ts", "utf8"), /gta-6/);
  for (const r of ["", "us/", "uk/"]) assert.match(readFileSync(`src/app/${r}gta-6/page.tsx`, "utf8"), /Gta6View/);
});
