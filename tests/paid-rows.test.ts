// Owner, 2026-11-12: no Amazon row without a live Amazon price.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("the phone Amazon row needs a live price", () => {
  const src = readFileSync(new URL("../src/components/PhoneOffers.tsx", import.meta.url), "utf8");
  assert.match(src, /const amazonHref = live\?\.price \? /);
});

test("Check Amazon (owner, 2026-11-17): an unpriced affiliate row at the top with eBay (owner, 2026-11-17 reversal), page and quick view", () => {
  const s = readFileSync(new URL("../src/components/PhoneOffers.tsx", import.meta.url), "utf8");
  assert.match(s, /const unpricedHref = !amazonHref && amazonStore\(region\)/);
  assert.match(s, /\) : unpricedHref \? \(\s+<AmazonRow/);
  assert.doesNotMatch(s, /amazonAlso/);
});

test("affiliate rows lead the store list on the page and in the quick view (owner, 2026-11-17)", () => {
  for (const f of ["PhoneOffers", "QuickView"]) {
    const s = readFileSync(new URL(`../src/components/${f}.tsx`, import.meta.url), "utf8");
    assert.doesNotMatch(s, /\{i === 0 && <li><PinnedMarketplaces/, `${f}: pinned rows must not sit after the first store`);
    assert.match(s, /<li><PinnedMarketplaces[^\n]*part="rows" \/><\/li>\}?\n\s+\{rows\.map/);
  }
});

test("eBay first, then Amazon (priced or Check), above the stores (owner, 2026-11-17, final)", () => {
  const s = readFileSync(new URL("../src/components/PhoneOffers.tsx", import.meta.url), "utf8");
  assert.match(s, /const paidRows = \[ebayNode, amazonNode\];/);
});
