import test from "node:test";
import assert from "node:assert/strict";
import { bigStoresFor } from "../src/lib/big-stores";

test("each region links its own big chains to the store's own search", () => {
  const au = bigStoresFor("au", "headphones", "Sony WH-1000XM5");
  assert.ok(au.some((s) => s.name === "Harvey Norman" && s.url.startsWith("https://www.harveynorman.com.au/") && s.url.includes("Sony%20WH-1000XM5")));
  assert.ok(bigStoresFor("us", "tvs", "LG C4").some((s) => s.name === "Best Buy"));
  assert.ok(bigStoresFor("uk", "laptops", "MacBook Air").some((s) => s.name === "Currys"));
});

test("category limits apply and an empty query links nothing", () => {
  assert.ok(!bigStoresFor("us", "robot-vacuums", "Roborock Q8").some((s) => s.name === "Newegg"));
  assert.deepEqual(bigStoresFor("au", "tvs", "  "), []);
});
