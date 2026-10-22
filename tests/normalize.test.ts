import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTitle } from "../src/lib/normalize";

const same = [
  "Apple iPhone 17 Pro 256GB (Deep Blue)",
  "Apple iPhone 17 Pro 256GB - Deep Blue",
  "Apple iPhone 17 Pro 256GB Deep Blue",
];

test("the same phone matches across retailers", () => {
  const parsed = same.map((t) => parseTitle(t)!);
  for (const p of parsed) {
    assert.equal(p.key, "appleiphone17pro");
    assert.equal(p.storageGb, 256);
    assert.equal(p.colour, "Deep Blue");
    assert.equal(p.model, "iPhone 17 Pro");
  }
});

test("mobileciti spec lists", () => {
  const p = parseTitle("Samsung Galaxy S26+ Plus 5G (Dual Sim, 256GB/12GB, 6.7'', SM-S947B) - Sky Blue")!;
  assert.equal(p.key, "samsunggalaxys26plus");
  assert.equal(p.storageGb, 256);
  assert.equal(p.colour, "Sky Blue");
  assert.equal(parseTitle("Samsung Galaxy S26+ 512GB Sky Blue")!.key, "samsunggalaxys26plus");
});

test("nothing phone parentheses are part of the name", () => {
  const p = parseTitle("NOTHING Phone (3a) Pro 5G 256GB (Black)")!;
  assert.equal(p.model, "Phone (3a) Pro");
  assert.equal(p.colour, "Black");
  assert.equal(parseTitle("Nothing Phone (3a) Pro 256GB Black")!.key, p.key);
});

test("motorola and honor naming quirks", () => {
  assert.equal(parseTitle("Motorola g06 4G 64GB Tapestry Blue")!.key, parseTitle("Motorola moto g06 64GB - Blue")!.key);
  assert.equal(parseTitle("Honor Magic 8 Pro 512GB Sunrise Gold")!.key, parseTitle("HONOR Magic8 Pro 512GB - Black")!.key);
});

test("terabytes and 4G LTE", () => {
  assert.equal(parseTitle("Apple iPhone 17 Pro Max 1TB Cosmic Orange")!.storageGb, 1024);
  const p = parseTitle("Samsung Galaxy A17 4G LTE 128GB Black")!;
  assert.equal(p.model, "Galaxy A17");
  assert.equal(p.colour, "Black");
});

test("RAM/storage pairs are not part of the model", () => {
  assert.equal(parseTitle("Nokia C02 2/32GB Charcoal")!.model, "C02");
});

test("titles without storage parse only when allowed", () => {
  assert.equal(parseTitle("Samsung Galaxy S26 Plus"), null);
  const p = parseTitle("Samsung Galaxy S26 Plus", { allowNoStorage: true })!;
  assert.equal(p.key, "samsunggalaxys26plus");
  assert.equal(p.storageGb, 0);
  assert.equal(parseTitle("Samsung Google Pixel 10 Pro XL", { allowNoStorage: true })!.key, "googlepixel10proxl");
  assert.equal(parseTitle("Apple iPhone 17 Pro", { allowNoStorage: true })!.model, "iPhone 17 Pro");
});

test("screen sizes in names don't split a phone", () => {
  const k = parseTitle("Samsung Galaxy S26 Ultra 256GB Black")!.key;
  assert.equal(parseTitle('Samsung Galaxy 6.9" Galaxy S26 Ultra 256GB Black')!.key, k);
  assert.equal(parseTitle("Samsung Galaxy S25 Ultra 6.9in 256GB")!.key, parseTitle("Samsung Galaxy S25 Ultra 256GB")!.key);
  assert.equal(parseTitle('OPPO 6.32" Reno16 Pro 512GB')!.key, "opporeno16pro");
  assert.equal(parseTitle("Samsung Galaxy A16 6.7in FHD AMOLED 128GB")!.model, "Galaxy A16");
});

test("less common brands parse", () => {
  assert.equal(parseTitle("Ruio Titan 128GB Smart Phone - Black")!.brand, "RUIO");
  assert.equal(parseTitle("HUAWEI Pura 80 Pro 512GB - Black")!.brand, "Huawei");
  assert.equal(parseTitle("Meizu 22 256GB Grey")!.brand, "Meizu");
});
