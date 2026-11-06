// Unique facts on product pages (DECISIONS.md, 2026-11-06 "Every comparable US and UK product in the sitemap").
import { test } from "node:test";
import assert from "node:assert/strict";
import { categoryPosition, priceMove } from "../src/lib/product-facts";

const p = (slug: string, bestPrice: number) => ({ slug, bestPrice });

test("category position: share of dearer peers, rank from the cheapest and the median", () => {
  const peers = [p("a", 100), p("b", 200), p("c", 300), p("d", 400), p("e", 500)];
  assert.deepEqual(categoryPosition(peers[1], peers), { peers: 5, cheaperThanPct: 60, median: 300, rank: 2 });
  assert.equal(categoryPosition(peers[0], peers)?.rank, 1);
  assert.equal(categoryPosition(peers[4], peers)?.cheaperThanPct, 0);
  assert.equal(categoryPosition(peers[0], [...peers, p("f", 600)])?.median, 350, "even count: mean of the middle two");
});

test("category position says nothing below five priced peers", () => {
  assert.equal(categoryPosition(p("a", 100), [p("a", 100), p("b", 200), p("c", 0), p("d", 300)]), undefined);
});

test("price move: today's cheapest option against about 30 days ago, never under a week", () => {
  const series = {
    v1: [["2026-10-01", 999], ["2026-10-08", 949], ["2026-11-06", 899]] as [string, number][],
    v2: [["2026-10-08", 1099], ["2026-11-06", 879]] as [string, number][],
  };
  assert.deepEqual(priceMove(series), { days: 29, from: 949, to: 879 });
  assert.deepEqual(priceMove({ v: [["2026-10-30", 500], ["2026-11-06", 520]] }), { days: 7, from: 500, to: 520 });
  assert.equal(priceMove({ v: [["2026-11-01", 500], ["2026-11-06", 450]] }), undefined, "five days of history");
  assert.equal(priceMove({}), undefined);
});
