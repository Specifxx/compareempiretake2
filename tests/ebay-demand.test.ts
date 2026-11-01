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

import { plan, REFRESH_DAYS } from "../scripts/ebay-prices";

const DAY = 86_400_000;
const now = Date.parse("2026-11-01T12:00:00Z");
const ago = (d: number) => new Date(now - d * DAY).toISOString();
const c = (id: string, region: "au" | "us" | "uk", demand: number, last?: string, searched = false) => ({ id, region, demand, last, searched });

test("coverage first: every never-priced product, US first, before any repeat", () => {
  const all = [
    c("au-hot", "au", 100, ago(1), true),
    c("uk-new", "uk", 50),
    c("au-new", "au", 5),
    c("us-new-low", "us", 1),
    c("us-new-high", "us", 9),
    c("us-old", "us", 3, ago(REFRESH_DAYS + 1)),
  ];
  assert.deepEqual(plan(all, 5, now).map((x) => x.id), ["us-new-high", "us-new-low", "au-new", "uk-new", "us-old"]);
});

test("a product priced this week waits its turn; a searched one comes round after three days", () => {
  const all = [c("week-old", "us", 1, ago(REFRESH_DAYS)), c("fresh", "us", 1000, ago(2)), c("searched", "au", 1, ago(3), true), c("searched-fresh", "us", 1000, ago(1), true)];
  const q = plan(all, 2, now).map((x) => x.id);
  assert.deepEqual(q, ["week-old", "searched"]);
});

test("spare calls go to the stalest by demand, never past the allowance", () => {
  const all = [c("a", "us", 10, ago(1)), c("b", "us", 10, ago(2)), c("d", "uk", 1, ago(1))];
  assert.deepEqual(plan(all, 2, now).map((x) => x.id), ["b", "a"]);
  assert.equal(plan(all, 0, now).length, 0);
});
