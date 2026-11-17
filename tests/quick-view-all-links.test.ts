import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Owner, 2026-11-17: the quick view opens from every product link. The 2026-11-10 redesign had unmounted it on Compare Empire.
test("the quick view is mounted in the root layout", () => {
  assert.match(readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8"), /<QuickView \/>/);
});

test("the quick view handles any product-page link, not only data-qv tiles", () => {
  const s = readFileSync(new URL("../src/components/QuickView.tsx", import.meta.url), "utf8");
  assert.match(s, /parseHref\(href\)/);
  assert.match(s, /closest\("a\[href\]"\)/);
});
