// Owner, 2026-11-12: no Amazon row without a live Amazon price.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("the phone Amazon row needs a live price", () => {
  const src = readFileSync(new URL("../src/components/PhoneOffers.tsx", import.meta.url), "utf8");
  assert.match(src, /const amazonHref = live\?\.price \? /);
});

test("Check Amazon (owner, 2026-11-17): an unpriced ordinary row after the store list, page and quick view", () => {
  const s = readFileSync(new URL("../src/components/PhoneOffers.tsx", import.meta.url), "utf8");
  assert.match(s, /const unpricedHref = !amazonHref && amazonStore\(region\)/);
  assert.match(s, /part !== "rows" && unpricedHref && <AmazonRow/);
  assert.doesNotMatch(s, /amazonAlso/);
});
