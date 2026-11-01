// The eBay pass spends its daily calls on what people search for (scripts/ebay-prices.ts, DECISIONS.md
// "eBay quota follows Google search demand", 2026-11-01).
import { test } from "node:test";
import assert from "node:assert/strict";
import { demand, searchDemand } from "../scripts/ebay-prices";
import type { Phone } from "../src/lib/types";

const p = (o: Partial<Phone>) => ({ slug: "x", brand: "B", model: "M", bestPrice: 500, retailerCount: 3, generation: 10, category: "tvs", ...o }) as unknown as Phone;
const slugs = { au: new Map([["apple-iphone-17", ["phones"]], ["samsung-galaxy-s26", ["phones"]]]), us: new Map(), uk: new Map() };
const cats = new Set(["phones", "robot-vacuums", "tvs"]);
const file = {
  updatedAt: new Date().toISOString(),
  days: 56,
  pages: {
    "/phones/apple-iphone-17": [1, 40, 12] as [number, number, number],
    "/us/robot-vacuums": [0, 22000, 5.5] as [number, number, number],
    "/compare/apple-iphone-17-vs-samsung-galaxy-s26": [0, 10, 8] as [number, number, number],
    "/guides/black-friday": [4, 240, 13] as [number, number, number],
  },
};

test("Search Console pages become product and category demand", () => {
  const d = searchDemand(file, cats, slugs);
  assert.equal(d.product.get("au:phones/apple-iphone-17"), 20 + 40 + 5);
  assert.equal(d.product.get("au:phones/samsung-galaxy-s26"), 5);
  assert.equal(d.category.get("us:robot-vacuums"), 22000);
  assert.equal(d.product.size, 2, "guides credit nothing");
});

test("a searched page outranks an unsearched one stocked by more stores", () => {
  const d = searchDemand(file, cats, slugs);
  const searched = demand(p({ slug: "apple-iphone-17", category: "phones", retailerCount: 2 } as Partial<Phone>), "au", d);
  const unsearched = demand(p({ slug: "other", category: "phones", retailerCount: 9 } as Partial<Phone>), "au", d);
  assert.ok(searched > unsearched * 1.5);
});

test("expensive products outrank cheap ones, and a searched category lifts its products", () => {
  assert.ok(demand(p({ bestPrice: 1000 }), "au") > 3 * demand(p({ bestPrice: 50 }), "au"));
  const d = searchDemand(file, cats, slugs);
  assert.ok(demand(p({ category: "robot-vacuums" } as Partial<Phone>), "us", d) > 1.5 * demand(p({ category: "robot-vacuums" } as Partial<Phone>), "us"));
});

test("no demand file falls back to store signals", () => {
  const d = searchDemand(null, cats, slugs);
  assert.equal(d.product.size + d.category.size, 0);
  assert.ok(demand(p({ retailerCount: 9 }), "au", d) > demand(p({ retailerCount: 1 }), "au", d));
});
