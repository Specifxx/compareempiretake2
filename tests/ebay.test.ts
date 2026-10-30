import { test } from "node:test";
import assert from "node:assert/strict";
import { EBAY_CAMPAIGN_ID, ebayAffiliate, ebaySearch } from "../src/lib/ebay";

test("eBay links use the one family campaign and a ce- customid", () => {
  assert.equal(EBAY_CAMPAIGN_ID, "5339155912");
  const u = new URL(ebaySearch("iphone", { customid: "home" }));
  assert.equal(u.searchParams.get("campid"), "5339155912");
  assert.equal(u.searchParams.get("customid"), "ce-home");
  assert.equal(new URL(ebaySearch("iphone")).searchParams.get("customid"), "ce");
});

test("a stored listing is re-tagged onto today's campaign and tag", () => {
  const old = "https://www.ebay.com.au/itm/1?mkevt=1&mkcid=1&mkrid=705-53470-19255-0&campid=5339155911&customid=au-phones&toolid=10049";
  const u = new URL(ebayAffiliate(old, "p-phones-x-listing", "au"));
  assert.equal(u.searchParams.get("campid"), "5339155912");
  assert.equal(u.searchParams.get("customid"), "ce-p-phones-x-listing");
  assert.equal(u.searchParams.getAll("campid").length, 1);
});
