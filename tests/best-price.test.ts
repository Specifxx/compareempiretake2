// "Best price" row treatment (owner, 2026-11-18): the cheapest store row is loud (green ring, solid green pill) only when its link
// pays us; a plain non-affiliate store gets a small neutral tag, and a note only when an eBay row is on the list.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { BEST_TAG_CLASS, bestPriceHint, bestTreatment } from "../src/lib/best-price";

test("a non-affiliate cheapest row is plain; a paid-link cheapest row stays loud; other rows are unmarked", () => {
  assert.equal(bestTreatment(true, false), "plain");
  assert.equal(bestTreatment(true, true), "loud");
  assert.equal(bestTreatment(false, true), null);
  assert.equal(bestTreatment(false, false), null);
});

test("the plain tag has no green and no fill; the loud pill keeps its green", () => {
  assert.doesNotMatch(BEST_TAG_CLASS.plain, /save|green|bg-/);
  assert.match(BEST_TAG_CLASS.loud, /bg-save/);
});

test("the hint appears only with an eBay row, names only eBay (no trading-card marketplace here) and never says it is cheaper", () => {
  assert.equal(bestPriceHint({ ebay: false }), null);
  const h = bestPriceHint({ ebay: true });
  assert.equal(h, "Prices and stock change: also check eBay");
  assert.doesNotMatch(h ?? "", /cheaper|TCGplayer/i);
});

test("the store row wears the ring only when loud, and shows the tag and note through the helper", () => {
  const src = fs.readFileSync("src/components/PhoneOffers.tsx", "utf8");
  assert.match(src, /\$\{loud \? PIN_OUTLINE\.cheapest : ""\}/);
  assert.match(src, /bestTreatment\(i === 0 && o\.inStock && !ebayCheapest, link\.paid\)/);
  assert.match(src, /data-best-tag="plain"/);
  assert.match(src, /data-best-note=""/);
});
