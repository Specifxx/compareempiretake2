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

test("exact model numbers: digits are not a prefix of a longer number, storage in the query is optional", () => {
  const tvs = ["Samsung 65\" Neo QLED QN90F 4K Smart TV", "Samsung 75\" Neo QLED QN900F 8K Smart TV", "Samsung QN90H Neo QLED 85-Inch TV"].map((name) => ({ name }));
  assert.deepEqual(search(tvs, "QN90F").map((t) => t.name), ["Samsung 65\" Neo QLED QN90F 4K Smart TV"]);
  assert.deepEqual(search(tvs, "QN900F").map((t) => t.name), ["Samsung 75\" Neo QLED QN900F 8K Smart TV"]);
  const cards = ["PNY GeForce RTX 5070 Ti OC 16G", "MSI GeForce RTX 5070 Ventus 12G", "Zotac GeForce RTX 5080 Solid 16GB"].map((name) => ({ name }));
  assert.deepEqual(search(cards, "rtx 5070 ti").map((c) => c.name), ["PNY GeForce RTX 5070 Ti OC 16G"]);
  assert.equal(search(cards, "5080")[0].name, "Zotac GeForce RTX 5080 Solid 16GB");
  assert.equal(search(items, "iphone 17 pro 256gb")[0].name, "Apple iPhone 17 Pro");
  assert.equal(search(items, "iphone 17 pro 256gb").length, 2, "the 17 Pro and 17 Pro Max, never the plain 17");
  assert.equal(search(cards, "rtx 5070 16gb").length, 2, "a capacity in the name still counts when it is there");
});

test("a model code the stores name is searchable", () => {
  const phones = [{ name: "Samsung Galaxy S26", codes: ["SM-S942B"] }, { name: "Samsung Galaxy S26+", codes: ["SM-S947B"] }, { name: "Samsung Galaxy S26 Ultra" }];
  assert.deepEqual(search(phones, "SM-S947B").map((p) => p.name), ["Samsung Galaxy S26+"]);
  assert.equal(search(phones, "s942b")[0].name, "Samsung Galaxy S26");
  assert.equal(search(phones, "galaxy s26")[0].name, "Samsung Galaxy S26", "names still rank as before");
});
