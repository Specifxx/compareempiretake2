import { test } from "node:test";
import assert from "node:assert/strict";
import { EBAY_CAMPAIGN_ID, ebayAffiliate, ebayCustomId, ebaySearch } from "../src/lib/ebay";

test("eBay links use the one family campaign and a ce- customid", () => {
  assert.equal(EBAY_CAMPAIGN_ID, "5339155912");
  const u = new URL(ebaySearch("iphone", { customid: "home" }));
  assert.equal(u.searchParams.get("campid"), "5339155912");
  assert.equal(u.searchParams.get("customid"), "ce-au-home");
  assert.equal(new URL(ebaySearch("iphone")).searchParams.get("customid"), "ce-au");
});

test("a stored listing is re-tagged onto today's campaign and tag", () => {
  const old = "https://www.ebay.com.au/itm/1?mkevt=1&mkcid=1&mkrid=705-53470-19255-0&campid=5339155911&customid=au-phones&toolid=10049";
  const u = new URL(ebayAffiliate(old, "p-phones-x-listing", "au"));
  assert.equal(u.searchParams.get("campid"), "5339155912");
  assert.equal(u.searchParams.get("customid"), "ce-au-p-phones-x-listing");
  assert.equal(u.searchParams.getAll("campid").length, 1);
});

test("every eBay tag names its region second, once (owner, 2026-11-10)", () => {
  assert.equal(ebayCustomId("p-tvs-x-pinned", "us"), "ce-us-p-tvs-x-pinned", "product pages carried no region");
  assert.equal(ebayCustomId("us-cat-tvs", "us"), "ce-us-cat-tvs", "a page tag that starts with its region keeps it once");
  assert.equal(ebayCustomId("cat-cameras", "ca"), "ce-ca-cat-cameras", "a category starting ca… is not a region");
  assert.equal(ebayCustomId("sg-deals-all", "sg"), "ce-sg-deals-all");
  assert.equal(ebayCustomId("ce-us-side-ebay-tvs", "au"), "ce-us-side-ebay-tvs", "a full tag is kept");
  for (const region of ["au", "us", "uk", "ca", "sg"] as const) {
    const u = new URL(ebaySearch("tv", { customid: "p-tvs-x-top", region }));
    assert.equal(u.searchParams.get("customid"), `ce-${region}-p-tvs-x-top`);
  }
});
