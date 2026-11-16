// Owner, 2026-11-12: no Amazon row without a live Amazon price.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("the phone Amazon row needs a live price", () => {
  const src = readFileSync(new URL("../src/components/PhoneOffers.tsx", import.meta.url), "utf8");
  assert.match(src, /const amazonHref = live\?\.price \? /);
});

test("Amazon also-line: one unpriced line in the marketplaces box, product page only, only for a matched ASIN", () => {
  const s = readFileSync(new URL("../src/components/PhoneOffers.tsx", import.meta.url), "utf8");
  assert.match(s, /const amazonAlso = !compact && !amazonHref && found\?\.url \? found\.url : null;/);
});
