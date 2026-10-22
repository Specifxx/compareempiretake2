import { test } from "node:test";
import assert from "node:assert/strict";
import { looksLikePhone } from "../scripts/scrapers/filter";

test("keeps new unlocked phones", () => {
  assert.ok(looksLikePhone("Apple iPhone 17 Pro 256GB (Deep Blue)"));
  assert.ok(looksLikePhone("HONOR X9d 5G (Dual Sim, 256GB/12GB, 108MP, AU Version) - Sunrise Gold"));
});

test("drops refurbished, carrier-locked and accessories", () => {
  assert.ok(!looksLikePhone("apple iphone 13 pro max 128gb grey refurbished very good"));
  assert.ok(!looksLikePhone("Telstra Samsung Galaxy A16 5G 128GB"));
  assert.ok(!looksLikePhone("OPPO Find X5 Lite 5G (256GB/8GB, Opt) - Starry Black"));
  assert.ok(!looksLikePhone("Samsung Galaxy S26 Ultra Clear Case 256GB"));
});
