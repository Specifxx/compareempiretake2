import { test } from "node:test";
import assert from "node:assert/strict";
import { priceFromHtml } from "../scripts/backfill-archive";

test("reads archived prices from meta, JSON-LD or Magento markup", () => {
  assert.equal(priceFromHtml('<meta property="product:price:amount" content="1,799.00">'), 1799);
  assert.equal(priceFromHtml('<script type="application/ld+json">{"@type":"Product","offers":{"@type":"Offer","price":"1499"}}</script>'), 1499);
  assert.equal(priceFromHtml('<span data-price-amount="697" data-price-type="finalPrice">'), 697);
  assert.equal(priceFromHtml("<p>nothing</p>"), undefined);
});
