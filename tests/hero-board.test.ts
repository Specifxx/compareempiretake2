// The home hero's one picture: today's real store prices for one product (components/HeroBoard.tsx, DECISIONS.md 2026-11-27).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boardRows, widestGap, BOARD_ROWS } from "../src/components/HeroBoard";

const o = (retailer: string, price: number, extra: Record<string, unknown> = {}) => ({ retailer, price, inStock: true, kind: "outright", ...extra });
const deal = (offers: ReturnType<typeof o>[]) => ({ variant: { offers } }) as never;

test("board rows: in-stock outright prices only, cheapest first, one per store, at most five", () => {
  const rows = boardRows(deal([o("b", 900), o("a", 800), o("a", 850), o("c", 700, { inStock: false }), o("d", 600, { kind: "plan" }), o("e", 950), o("f", 990), o("g", 999), o("h", 1000)]));
  assert.deepEqual(rows.map((r) => r.retailer), ["a", "b", "e", "f", "g"]);
  assert.equal(rows.length, BOARD_ROWS);
});

test("widest gap: three stores or more, the biggest real spread, never a listing error", () => {
  const flat = deal([o("a", 100), o("b", 100), o("c", 100)]);
  const wide = deal([o("a", 700), o("b", 900), o("c", 1000)]);
  const silly = deal([o("a", 500), o("b", 900), o("c", 1000)]);
  const two = deal([o("a", 100), o("b", 1000)]);
  assert.equal(widestGap([flat, two, silly, wide]), 3);
  assert.equal(widestGap([flat, two]), -1, "a flat gap draws nothing");
});

test("the hero has no pill above the headline and draws real data only", () => {
  const home = readFileSync(new URL("../src/views/HomeView.tsx", import.meta.url), "utf8");
  assert.ok(home.indexOf("<CreatorsCornerBadge />") > home.indexOf("</h1>"), "the creators link sits under the headline");
  assert.ok(home.indexOf("<ChristmasBanner") > home.indexOf("</h1>"), "the season's line sits under the headline");
  assert.match(home, /<HeroBoard deals=\{getDeals\(/);
});
