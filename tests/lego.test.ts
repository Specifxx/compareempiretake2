// LEGO sets are matched by set number only (scripts/scrapers/lego.ts, src/lib/match-more.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { NOT_A_SET, setFromSku, setFromTitle } from "../scripts/scrapers/lego";
import { parseProduct } from "../src/lib/match";
import { legoTheme } from "../src/lib/match-more";
import type { RawOffer } from "../src/lib/types";

const offer = (title: string, mpn?: string): RawOffer => ({ retailer: "toysrus", sku: "x", title, url: "https://x", price: 99, inStock: true, mpn, brand: "LEGO" }) as RawOffer;

test("the set number comes from the SKU when the store prints it", () => {
  assert.equal(setFromSku("LEG-42171"), "42171");
  assert.equal(setFromSku("LEG75447"), "75447");
  assert.equal(setFromSku("LEG-71053-BOX"), undefined, "a box of blind bags is not the single set");
  assert.equal(setFromSku("260070KS"), undefined);
  assert.equal(setFromSku("5702017815824"), undefined, "a barcode is not a set number");
});

test("the set number comes from the title when it is the only one", () => {
  assert.equal(setFromTitle("LEGO 77053 Animal Crossing Stargazing with Celeste"), "77053");
  assert.equal(setFromTitle("11205 Sweet Treat Mountain & Kitty Garden"), "11205");
  assert.equal(setFromTitle("LEGO Technic Mercedes-Amg F1 W14 E Performance 42171"), "42171");
  assert.equal(setFromTitle("LEGO Icons Natural History Museum 10326 4,014 pieces 18+"), "10326");
  assert.equal(setFromTitle("LEGO City 2026 Advent Calendar 60436"), "60436", "a year is not a set number");
  assert.equal(setFromTitle("LEGO 75447 and 75448 Star Wars bundle"), undefined, "two sets: neither");
  assert.equal(setFromTitle("STAR WARS - The Razor Crest"), undefined);
});

test("things that are not a sealed set are refused", () => {
  for (const t of ["Key Chain LEGO Light Halloween", "LEGO Minifigures Shrek Series 36pcs Box Set 71053", "Happy Brick Land display frame for 10326", "LEGO Star Wars Storage Head", "LEGO Ninjago bundle 71842 + 71845", "LEGO Batman Video Game PS5"])
    assert.ok(NOT_A_SET.test(t), t);
  for (const t of ["LEGO Technic Bugatti Chiron Pur Sport Hypercar 42222", "LEGO Icons Natural History Museum 10326", "LEGO Friends Heartlake City School Bus 42672"]) assert.ok(!NOT_A_SET.test(t), t);
});

test("every store's wording of a set becomes one product", () => {
  const a = parseProduct(offer("LEGO Star Wars The Razor Crest 75447", "75447"), "lego");
  const b = parseProduct(offer("STAR WARS - The Razor Crest 75447", "75447"), "lego");
  assert.ok(a && b);
  assert.equal(a.key, b.key);
  assert.equal(b.model, "Star Wars The Razor Crest 75447");
  assert.notEqual(a.key, parseProduct(offer("LEGO Star Wars The Razor Crest 75448", "75448"), "lego")!.key);
  assert.equal(parseProduct(offer("LEGO Star Wars The Razor Crest"), "lego"), null, "no set number, no product");
});

test("themes", () => {
  assert.equal(legoTheme("LEGO Creator 3in1 Space Astronaut 31152"), "Creator 3in1");
  assert.equal(legoTheme("LEGO Pokemon Pikachu 72152"), "Pokémon");
  assert.equal(legoTheme("LEGO Brick Bucket 10001"), undefined);
});
