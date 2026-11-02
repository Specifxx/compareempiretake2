import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeSavedList, encodeSavedList, priceGap, shareText, shareUrl } from "../src/lib/share-link";

test("a share link keeps its own query and adds the share tags", () => {
  const u = new URL(shareUrl("https://compareempire.com", "/us/tvs/lg-c5?v=65", "product"));
  assert.equal(u.pathname, "/us/tvs/lg-c5");
  assert.equal(u.searchParams.get("v"), "65");
  assert.equal(u.searchParams.get("utm_source"), "share");
  assert.equal(u.searchParams.get("utm_medium"), "product");
});

test("the share message names a real gap between two stores, or none", () => {
  const $ = (n: number) => `$${n}`;
  assert.equal(priceGap([{ price: 100, store: "A" }, { price: 120, store: "A" }]), null);
  assert.equal(
    shareText("Pixel 10", [{ price: 1000, store: "B" }, { price: 800, store: "A" }], $),
    "Pixel 10: $800 at A vs $1000 at B. Same product, 20% less.",
  );
  assert.equal(shareText("Pixel 10", [{ price: 800, store: "A" }], $), "Pixel 10: $800 at A, prices compared across stores.");
  assert.equal(shareText("Pixel 10", [], $), "Pixel 10: prices compared across stores.");
});

test("a shared saved list carries only product paths, at most 50", () => {
  const enc = encodeSavedList(["/phones/google-pixel-10", "/us/tvs/lg-c5", "/phones/google-pixel-10", "javascript:x"]);
  assert.equal(enc, "/phones/google-pixel-10,/us/tvs/lg-c5");
  assert.deepEqual(decodeSavedList(`?l=${encodeURIComponent(enc)}`), ["/phones/google-pixel-10", "/us/tvs/lg-c5"]);
  assert.deepEqual(decodeSavedList("?l=/admin/x/y,<b>,/phones/ok"), ["/phones/ok"]);
  assert.equal(decodeSavedList("?x=1"), null);
  assert.equal(encodeSavedList(Array.from({ length: 70 }, (_, n) => `/phones/p${n}`)).split(",").length, 50);
});
