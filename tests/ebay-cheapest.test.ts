// Owner, 2026-11-18: the NEW eBay listing may be "Cheapest" (under the cheapest store, not more than 25% under it); the store's own tag then goes.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("eBay's listing is Cheapest when its price with postage is genuinely under the cheapest store, and the store tag drops", () => {
  const row = readFileSync(new URL("../src/components/EbayListingRow.tsx", import.meta.url), "utf8");
  const offers = readFileSync(new URL("../src/components/PhoneOffers.tsx", import.meta.url), "utf8");
  assert.match(row, /export const EBAY_MAX_UNDER_STORES = 0\.75;/);
  assert.match(row, /cheapest !== undefined && total < cheapest && total >= cheapest \* EBAY_MAX_UNDER_STORES/);
  assert.match(row, /winner \? "Cheapest" : "Below the stores"/);
  assert.match(offers, /i === 0 && o\.inStock && !ebayCheapest/);
});
