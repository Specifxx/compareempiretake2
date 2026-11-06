/** Fixes from a US shopper's review of the site (2026-11-06, DECISIONS.md). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseTitle, storageLabel } from "../src/lib/normalize";
import { ebayTitleMatches } from "../src/lib/ebay-match";
import { foldBrands, tidyName } from "../src/lib/product-names";
import { isMoreAccessory } from "../src/lib/match-more";
import type { Phone } from "../src/lib/types";

test("a store's code or barcode after the name comes off it; real names stay", () => {
  assert.equal(tidyName("Xbox Series S in Robot White - 196388421343"), "Xbox Series S in Robot White");
  assert.equal(tidyName("gram Pro Laptop 17-Inch Intel Core Ultra 7 32GB RAM 1TB SSD in Black - 17Z90U-H.AU87U1"), "gram Pro Laptop 17-Inch Intel Core Ultra 7 32GB RAM 1TB SSD in Black");
  assert.equal(tidyName("ACEMAGIC M1A PRO Mini PC US 128GB RAM +0GB SSD"), "ACEMAGIC M1A PRO Mini PC US 128GB RAM");
  assert.equal(tidyName("Galaxy S25 Ultra"), "Galaxy S25 Ultra");
  assert.equal(tidyName("Sonos Era 300 - Black"), "Sonos Era 300 - Black", "a colour is not a code");
  assert.equal(tidyName("Wireless Headphones - 2026"), "Wireless Headphones - 2026", "a year is too short to be a code");
});

test("no storage is no label, never 0GB", () => {
  assert.equal(storageLabel(0), "");
  assert.equal(storageLabel(256), "256GB");
  assert.equal(storageLabel(1024), "1TB");
});

const product = (brand: string, model: string, category: Phone["category"] = "cameras") =>
  ({ brand, model, name: `${brand} ${model}`, category, slug: `${brand}-${model}`.toLowerCase().replace(/[^a-z0-9]+/g, "-") }) as Phone;

test("brand spellings fold into one; a distributor gives way to the maker; moved brand slugs are reported", () => {
  const all = [
    product("Leica", "Q3"), product("Leica", "M11"), product("LEICA CAMERA INC.", "SL3"),
    product("Sunbrite", "Veranda 3"), product("SunBrite", "Pro 2"), product("Sunbrite", "Signature 2"),
    product("HP", "OmniBook 5", "laptops"), product("Hewlett Packard", "ZBook", "laptops"),
    product("VITECH IMAGING DISTRIBUTION", "Nilox NX MINI-UP Action Camera"),
    product("DRONE NERDS INC.", "DJI Mini 5 Pro", "drones"), product("DJI", "Avata 2", "drones"),
    product("LOGITECH INC.", "G502 X Lightspeed", "headphones"), product("Logitech", "G Pro X", "headphones"),
  ];
  const moves = foldBrands(all);
  assert.deepEqual(all.map((p) => p.brand), ["Leica", "Leica", "Leica", "Sunbrite", "Sunbrite", "Sunbrite", "HP", "HP", "Nilox", "DJI", "DJI", "Logitech", "Logitech"]);
  assert.equal(all[8].name, "Nilox NX MINI-UP Action Camera", "the distributor leaves the name");
  assert.equal(all[2].name, "Leica SL3");
  assert.equal(moves.get("hewlett-packard"), "hp");
  assert.equal(moves.get("leica-camera-inc-"), "leica");
  assert.equal(moves.has("sunbrite"), false, "a slug that still exists does not move");
});

test("an eBay title must name every model word whole: an R100 is not an R10", () => {
  const r10 = product("Canon", "EOS R10 Mirrorless Camera");
  assert.equal(ebayTitleMatches(r10, "Canon EOS R100 Mirrorless Camera with 18-45mm Lens - Black"), false);
  assert.equal(ebayTitleMatches(r10, "Canon EOS R10 24.2MP Mirrorless Digital Camera Body Black 4K Video APS-C RF"), true);
  assert.equal(ebayTitleMatches(product("Canon", "EOS R10"), "Canon EOS R10 24.2MP Mirrorless Digital Camera Body"), true);
  const a57 = product("Samsung", "Galaxy A57", "phones");
  assert.equal(ebayTitleMatches(a57, "Samsung Galaxy A57 5G 512GB/256GB/128GB Unlocked Dual SIM GSM Smartphone - New"), false, "a multi-storage listing");
  assert.equal(ebayTitleMatches(a57, "Samsung Galaxy A57 5G 256GB International Version Unlocked"), false, "a grey import");
  assert.equal(ebayTitleMatches(a57, "Samsung Galaxy A57 5G 256GB Unlocked Awesome Gray"), true);
});

test("a phone made for another market is not the local phone", () => {
  assert.equal(parseTitle("Samsung Galaxy A57 256GB (Latin America Version) Unlocked Cell Phone in Awesome Gray"), null);
  assert.equal(parseTitle("Google Pixel 10 128GB International Version - Obsidian"), null);
  assert.ok(parseTitle("Samsung Galaxy A57 256GB Awesome Gray"));
});

test("camera bags, holsters, books and supplies are not cameras", () => {
  for (const t of [
    "Manfrotto Advanced III 3L Camera Holster - Medium", "Peak Design Camera Cube v2 Smedium", "Tenba BYOB 13 Camera Insert",
    "Leica Pocket Book - 9th Edition", "Canon CarePAK Plus 2 Year for PowerShots $500 - $1499.99", "Fujifilm DX100 Ink Cartridge Pink",
    "Leica Rope Key Chain", "Manfrotto 155BKL Tilt-Top Head Without Camera Platform", "GoPro Boom + Adhesive Mounts",
    "Garmin BC 40 Wireless Backup Camera", "ProMaster Cold Weather Camera Parka",
  ]) assert.equal(isMoreAccessory("cameras", t), true, t);
  for (const t of [
    "Nilox NX MINI-UP Action Camera", "Fujifilm Instax Mini 12 Instant Camera", "Canon EOS R10 Mirrorless Camera Body",
    "Nikon Z7II Mirrorless Digital Camera Body with Nikon FTZ II Mount Adapter", "Sony Alpha a7 IV Full-Frame E-mount Camera",
  ]) assert.equal(isMoreAccessory("cameras", t), false, t);
});

test("ads sit under the cheapest store, never above it, on the product page and in the quick view", () => {
  for (const f of ["src/components/PhoneOffers.tsx", "src/components/QuickView.tsx"]) {
    const src = readFileSync(f, "utf8");
    assert.match(src, /i === 0 && <li><PinnedMarketplaces[^>]*part="rows"/, f);
    assert.doesNotMatch(src, /<PinnedMarketplaces[^>]*\/>\s*\{(rows\.length|tab === "outright")/, `${f}: no ad block above the store list`);
  }
});

test("US pages say what US prices are: no GST, no \"this phone\" on a TV, no phone-only 404", () => {
  assert.doesNotMatch(readFileSync("src/components/PhoneOffers.tsx", "utf8"), /Prices include GST/);
  assert.doesNotMatch(readFileSync("src/views/ProductView.tsx", "utf8"), /for this phone/);
  assert.doesNotMatch(readFileSync("src/app/not-found.tsx", "utf8"), /phone may have/);
});

test("\"See all results\" opens the best match's category in the visitor's region, never Australia's phones", async () => {
  const { allResultsHref } = await import("../src/components/SearchBox");
  assert.equal(allResultsHref("S90H 65", [{ href: "/us/tvs/samsung-s90h-oled-4k-smart-tv-65-2026" }], "us"), "/us/tvs?q=S90H%2065");
  assert.equal(allResultsHref("pixel", [{ href: "/phones/google-pixel-10" }], "au"), "/phones?q=pixel");
  assert.equal(allResultsHref("zzz", [], "uk"), "/uk/browse");
});

test("\"PS5\" finds the PlayStation 5 the stores spell out", async () => {
  const { search } = await import("../src/lib/search");
  const hits = search([{ name: "HyperX Cloud Stinger 2 Core Gaming Headset PS5-PS4" }, { name: "Sony PlayStation 5 Slim Console" }], "ps5");
  assert.equal(hits[0].name, "Sony PlayStation 5 Slim Console");
});
