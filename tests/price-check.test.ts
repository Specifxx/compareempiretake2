import { test } from "node:test";
import assert from "node:assert/strict";
import { priceCheck, shortDate, wasCheck } from "../src/lib/price-check";
import type { Offer } from "../src/lib/types";

const days = (n: number, price: (i: number) => number) =>
  Array.from({ length: n }, (_, i) => [new Date(Date.UTC(2026, 8, 1) + i * 864e5).toISOString().slice(0, 10), price(i)] as [string, number]);
const name = () => "JB Hi-Fi";

test("short history is 'new', not a verdict", () => {
  const c = priceCheck({ price: 1799, best: [["2026-10-22", 1799]], stores: {}, storeName: name, today: "2026-10-22" });
  assert.equal(c.verdict, "new");
});

test("lowest, usual and above against the recorded range", () => {
  const best = days(30, () => 1999);
  const today = best.at(-1)![0];
  assert.equal(priceCheck({ price: 1799, best, stores: {}, storeName: name, today }).verdict, "lowest");
  assert.equal(priceCheck({ price: 1999, best: [...best.slice(0, 10), ...days(20, () => 1899).map(([d], i) => [best[10 + i][0], 1899] as [string, number])], stores: {}, storeName: name, today }).verdict, "above");
  // A price that never moved is its usual price, not a record low.
  assert.equal(priceCheck({ price: 1999, best, stores: {}, storeName: name, today }).verdict, "usual");
});

test("falls back to the cheapest store's archived history", () => {
  const today = "2026-10-22";
  const c = priceCheck({ price: 1799, best: [[today, 1799]], stores: { jbhifi: [["2026-09-11", 1999], ["2026-10-01", 1999]] }, cheapest: "jbhifi", storeName: name, today });
  assert.equal(c.chartLabel, "Price at JB Hi-Fi");
  assert.equal(c.verdict, "lowest");
});

test("a 'was' price nobody ever charged is called out", () => {
  const o = { retailer: "jbhifi", price: 1499, wasPrice: 1999 } as Offer;
  const today = "2026-12-31";
  assert.equal(wasCheck(o, days(30, () => 1599), "JB Hi-Fi", today)!.status, "never");
  assert.equal(wasCheck(o, days(30, (i) => (i < 5 ? 1999 : 1599)), "JB Hi-Fi", today)!.status, "backed");
  assert.equal(wasCheck(o, days(3, () => 1599), "JB Hi-Fi", today)!.status, "unknown");
  // Today's price can't vouch for today's "was" claim.
  assert.equal(wasCheck(o, [[today, 1999]], "JB Hi-Fi", today)!.status, "unknown");
});

test("old history with nothing recent is not a verdict", () => {
  const c = priceCheck({ price: 1799, best: [["2026-10-22", 1799]], stores: { jbhifi: [["2024-01-01", 1999], ["2024-03-01", 1999]] }, cheapest: "jbhifi", storeName: name, today: "2026-10-22" });
  assert.equal(c.verdict, "new");
});

test("dates show the year from the catalogue's day, never the clock", () => {
  // Product pages are rendered on a UTC server, cached and hydrated in the visitor's browser: at New Year the
  // two clocks disagree, so the year must come from the data both sides see.
  assert.equal(shortDate("2026-03-12", "2026-12-31"), "12 Mar");
  assert.equal(shortDate("2026-03-12", "2027-01-01"), "12 Mar 2026");
  const c = priceCheck({ price: 1799, best: [["2026-12-31", 1799]], stores: {}, storeName: name, today: "2027-01-01" });
  assert.equal(c.points.at(-1)![0], "2027-01-01", "the last point is the catalogue's day, which PriceCheckCard uses");
  assert.match(c.detail, /31 Dec 2026/);
});
