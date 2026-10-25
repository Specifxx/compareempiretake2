import { test } from "node:test";
import assert from "node:assert/strict";
import { amazonAuLink } from "../src/lib/amazon";

test("ASIN links go straight to the product page with the tag", () => {
  assert.equal(amazonAuLink("B0DGHYDZR9"), "https://www.amazon.com.au/dp/B0DGHYDZR9?tag=compareempire-22");
});

test("anything else becomes an Amazon AU search with the tag", () => {
  assert.equal(amazonAuLink("Apple iPhone 17 Pro 256GB"), "https://www.amazon.com.au/s?k=Apple%20iPhone%2017%20Pro%20256GB&tag=compareempire-22");
  assert.ok(amazonAuLink("b0dghydzr9").includes("/s?k="), "lower-case is a search term, not an ASIN");
});
