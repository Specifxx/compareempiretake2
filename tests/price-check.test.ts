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

// Reddit feedback, 2026-11-07: an RRP to check prices against, sale vs everyday, and prices far above the rest.
import { aboveRrp, storePriceKind, storeRrp, unusuallyHigh } from "../src/lib/price-check";

const off = (retailer: string, price: number, wasPrice?: number) => ({ retailer, sku: retailer, title: "", url: "", price, wasPrice, colour: "", inStock: true }) as Parameters<typeof storeRrp>[0][number];

test("RRP: the 'was' price two or more stores state; a lone or tied one is none", () => {
  // LEGO 75455 on 7 Nov: four stores say was $279.99; Kidstuff charges $319.99.
  const boba = [off("toyworld", 269.99, 279.99), off("toyworldbendigo", 269.99, 279.99), off("brickbuilder", 279, 279.99), off("kidstuff", 319.99), off("toysrus", 279.99)];
  const rrp = storeRrp(boba);
  assert.deepEqual(rrp, { price: 279.99, stores: 3 });
  assert.equal(aboveRrp(319.99, rrp), true);
  assert.equal(aboveRrp(279.99, rrp), false);
  assert.equal(aboveRrp(280.5, rrp), false, "rounding is not above");
  assert.equal(storeRrp([off("a", 90, 100), off("b", 95)]), undefined, "one store's was price");
  assert.equal(storeRrp([off("a", 90, 100), off("b", 95, 100), off("c", 90, 120), off("d", 92, 120)]), undefined, "two groups as big");
  assert.equal(storeRrp([off("a", 90, 100), off("a", 91, 100)]), undefined, "one store twice");
  assert.equal(storeRrp([off("a", 200, 100), off("b", 210, 100)]), undefined, "a was price under every price");
});

test("sale vs everyday needs four weeks of that store's prices", () => {
  const days = (n: number, price: number) => Array.from({ length: n }, (_, i) => [new Date(Date.parse("2026-10-01") + i * 864e5).toISOString().slice(0, 10), price] as [string, number]);
  const h = days(35, 100);
  assert.deepEqual(storePriceKind(80, h, "2026-11-07"), { kind: "sale", usual: 100 });
  assert.deepEqual(storePriceKind(100, h, "2026-11-07"), { kind: "everyday", usual: 100 });
  assert.deepEqual(storePriceKind(110, h, "2026-11-07"), { kind: "up", usual: 100 });
  assert.equal(storePriceKind(80, days(10, 100), "2026-11-07"), undefined);
  assert.equal(storePriceKind(80, undefined, "2026-11-07"), undefined);
});

test("unusually high: 35% over the other stores' median, with three or more of them", () => {
  assert.equal(unusuallyHigh(140, [100, 100, 102]), true);
  assert.equal(unusuallyHigh(130, [100, 100, 102]), false);
  assert.equal(unusuallyHigh(200, [100, 100]), false);
});
