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

test("each region's Amazon carries that store's own tag, and the UK none until it has one", async () => {
  const { amazonLink, amazonStore } = await import("../src/lib/amazon");
  assert.equal(amazonLink("au", "Dyson V15"), "https://www.amazon.com.au/s?k=Dyson%20V15&tag=compareempire-22");
  assert.equal(amazonLink("us", "Dyson V15", "product"), "https://www.amazon.com/s?k=Dyson%20V15&tag=riftcompare-20&ascsubtag=ce-us-product");
  assert.equal(amazonLink("us", "B0DGHYDZR9"), "https://www.amazon.com/dp/B0DGHYDZR9?tag=riftcompare-20");
  assert.equal(amazonStore("uk"), null, "no UK Associates tag yet: no untagged Amazon UK link");
  assert.equal(amazonLink("uk", "Dyson V15"), null);
});
