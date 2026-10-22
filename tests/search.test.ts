import { test } from "node:test";
import assert from "node:assert/strict";
import { search } from "../src/lib/search";

const items = ["Apple iPhone 17", "Apple iPhone 17 Pro", "Apple iPhone 17 Pro Max", "Samsung Galaxy S26 Ultra", "Samsung Galaxy S26", "Google Pixel 10a"].map((name) => ({ name }));

test("exact model ranks first", () => {
  assert.equal(search(items, "iphone 17")[0].name, "Apple iPhone 17");
});
test("shorthand and typos", () => {
  assert.equal(search(items, "s26u")[0].name, "Samsung Galaxy S26 Ultra");
  assert.equal(search(items, "iphnoe 17 pro max")[0].name, "Apple iPhone 17 Pro Max");
  assert.equal(search(items, "pixel 10a")[0].name, "Google Pixel 10a");
});
test("no match returns nothing", () => {
  assert.equal(search(items, "nokia").length, 0);
});
