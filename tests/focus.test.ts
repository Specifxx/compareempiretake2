import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { CATEGORIES } from "../src/lib/categories";
import { demandPaths, FOCUS, focusReason, isRetired, RETIRED_CATEGORIES } from "../src/lib/focus";
import { dataPath, REGION_IDS } from "../src/lib/region";
import type { CategoryId, Phone } from "../src/lib/types";

// The focus cull (owner, 2026-11-07; DECISIONS.md "The focus cull").
const product = (o: Partial<Phone> & { inStock?: boolean; preorder?: boolean }): Phone =>
  ({
    slug: "x",
    name: "X",
    brand: "Apple",
    bestPrice: 1500,
    retailerCount: 3,
    variants: [{ id: "std", label: "", storageGb: 0, bestPrice: o.bestPrice ?? 1500, offers: [{ retailer: "jbhifi", sku: "1", title: "", url: "", price: 1500, colour: "", inStock: o.inStock ?? true, preorder: o.preorder }] }],
    ...o,
  }) as Phone;
const none = new Set<string>();

test("every category is either kept with a rule or retired, never both", () => {
  for (const c of CATEGORIES) assert.ok(!!FOCUS[c.id] !== isRetired(c.id), c.id);
  for (const [c, to] of Object.entries(RETIRED_CATEGORIES)) if (to) assert.ok(FOCUS[to], `${c} redirects to a kept category`);
  assert.ok(CATEGORIES.filter((c) => c.live).every((c) => !isRetired(c.id)));
});

test("next.config.mjs redirects exactly the retired categories, to the same places", async () => {
  const src = readFileSync("next.config.mjs", "utf8");
  const block = src.match(/const RETIRED = (\{[\s\S]*?\});/)?.[1];
  assert.ok(block, "RETIRED map in next.config.mjs");
  const map = Function(`return (${block})`)() as Record<string, string | null>;
  assert.deepEqual(map, RETIRED_CATEGORIES);
  const config = (await import(pathToFileURL(path.resolve("next.config.mjs")).href)).default;
  const redirects = (await config.redirects()) as { source: string; destination: string; permanent: boolean }[];
  const to = (s: string) => redirects.find((r) => r.source === s)?.destination;
  assert.equal(to("/fridges"), "/au");
  assert.equal(to("/us/fridges/:slug"), "/");
  assert.equal(to("/uk/ram/:slug"), "/uk/graphics-cards");
  assert.equal(to("/browse/coffee-gear/:page"), "/coffee-machines");
  assert.equal(to("/sg/deals/air-fryers"), "/sg");
  assert.equal(to("/phones/:slug"), undefined, "kept categories are never redirected");
});

test("a current flagship at a real price, sold by two stores, is kept; budget, unknown brands and sold-out are not", () => {
  assert.equal(focusReason(product({}), "phones", "au", none), "focus");
  assert.equal(focusReason(product({ bestPrice: 299 }), "phones", "au", none), null, "budget phone (A$600 floor)");
  assert.equal(focusReason(product({ brand: "Doro" }), "phones", "au", none), null);
  assert.equal(focusReason(product({ inStock: false }), "phones", "au", none), null);
  assert.equal(focusReason(product({ inStock: false, preorder: true }), "phones", "au", none), "focus", "a pre-order is on sale");
  assert.equal(focusReason(product({ brand: "Sony", bestPrice: 1200, retailerCount: 1 }), "headphones", "uk", none), null, "a one-store page in the UK compares nothing");
  assert.equal(focusReason(product({ brand: "Sony", bestPrice: 300, retailerCount: 1 }), "headphones", "us", none), "focus", "the US keeps one-store pages");
  assert.equal(focusReason(product({ retailerCount: 1 }), "phones", "uk", none), "focus", "flagship devices are kept at one store");
  assert.equal(focusReason(product({}), "fridges" as CategoryId, "au", none), null, "retired");
});

test("Search Console demand and the launch calendar override the rules", () => {
  const cheap = product({ slug: "samsung-galaxy-a17", brand: "Samsung", bestPrice: 299 });
  assert.equal(focusReason(cheap, "phones", "au", new Set(["/phones/samsung-galaxy-a17"])), "demand");
  assert.equal(focusReason(cheap, "phones", "uk", new Set(["/phones/samsung-galaxy-a17"])), null, "demand is per region");
  assert.equal(focusReason(product({ name: "Samsung Galaxy Z Fold8 Ultra", brand: "Samsung", retailerCount: 1, bestPrice: 10 }), "phones", "uk", none), "launch");
  assert.deepEqual(demandPaths({ "/a": [1, 2, 3], "/b": [0, 19, 3], "/c": [0, 20, 3] }), ["/a", "/c"]);
});

test("the committed catalogues hold only products in focus, and no retired category", () => {
  const demand = new Set<string>(JSON.parse(readFileSync("data/focus/demand.json", "utf8")).paths);
  let n = 0;
  for (const region of REGION_IDS)
    for (const c of CATEGORIES) {
      const f = `${dataPath(region, c.id)}/catalog.json`;
      if (!existsSync(f)) continue;
      assert.ok(!isRetired(c.id), `${f} is a retired category`);
      for (const p of JSON.parse(readFileSync(f, "utf8")).phones as Phone[]) {
        assert.ok(focusReason(p, c.id, region, demand), `${region}/${c.id}/${p.slug}`);
        n++;
      }
    }
  assert.ok(n > 1000 && n < 20000, `${n} products`);
});

test("the daily import runs the cull after the catalogues and before eBay, Amazon and IndexNow", () => {
  const wf = readFileSync(".github/workflows/refresh-prices.yml", "utf8");
  const at = (s: string) => wf.indexOf(s);
  assert.ok(at("scripts/focus-catalog.ts") > at("build-catalog.ts --region sg"));
  assert.ok(at("scripts/focus-catalog.ts") < at("scripts/ebay-prices.ts"));
  assert.match(readFileSync("scripts/scrape-categories.ts", "utf8"), /isRetired\(cat\)\) continue/);
});
