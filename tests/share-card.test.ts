import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ogImage, parseRows } from "../src/lib/og";

test("share card rows round-trip through the URL and bad rows are dropped", () => {
  const url = ogImage({ title: "Compare prices", kind: "home", rows: [{ s: "JB Hi-Fi", p: 297 }, { s: "Harvey|Norman~", p: 299.5 }], extra: ["https://a/1.jpg", "http://b/2.jpg"] });
  const q = new URL(url, "https://x").searchParams;
  assert.deepEqual(parseRows(q.get("d")), [{ s: "JB Hi-Fi", p: 297 }, { s: "Harvey Norman", p: 299.5 }]);
  assert.deepEqual(q.getAll("x"), ["https://a/1.jpg"]);
  assert.deepEqual(parseRows("A~abc|~5|B~-1|C~12"), [{ s: "C", p: 12 }]);
});

test("the share card is cached a week on the CDN and its rows are in-stock outright store prices", () => {
  const route = readFileSync("src/app/og/route.tsx", "utf8");
  assert.match(route, /s-maxage=604800/);
  const pick = readFileSync("src/lib/share-rows.ts", "utf8");
  assert.match(pick, /o\.inStock/);
  assert.match(pick, /kind === "plan"/);
  // eBay is never a store row: the picker reads only store offers.
  assert.doesNotMatch(pick, /\.ebay/);
});

test("the share card never fetches or draws a store photo (Vercel CPU, DECISIONS.md 2026-11-08)", () => {
  const route = readFileSync("src/app/og/route.tsx", "utf8");
  assert.doesNotMatch(route, /<img |function photo|q\.get\("i"\)|q\.getAll\("x"\)/);
});

test("noindex product pages share the region's static card instead of drawing their own (CE-1, 2026-11-10)", async () => {
  const { staticShareCard } = await import("../src/lib/og");
  for (const r of ["au", "us", "uk", "ca", "sg"] as const) {
    assert.equal(staticShareCard(r), `/share/${r}.png`);
    assert.ok(readFileSync(`public/share/${r}.png`).length > 10_000, r);
  }
  const view = readFileSync("src/views/ProductView.tsx", "utf8");
  assert.match(view, /productIndexable\(p\) \? shareCard\(p\) : staticShareCard/);
});
