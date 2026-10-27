import { test } from "node:test";
import assert from "node:assert/strict";
import { codes, gpuChip, mergeTarget, parseProduct } from "../src/lib/match";
import type { RawOffer } from "../src/lib/types";

const o = (title: string, extra: Partial<RawOffer> = {}) => ({ retailer: "jbhifi", sku: "x", url: "u", price: 1, inStock: true, title, ...extra }) as RawOffer;
const key = (t: string, cat: Parameters<typeof parseProduct>[1], extra?: Partial<RawOffer>) => parseProduct(o(t, extra), cat)?.key;

test("TVs match across stores by brand, size and series", () => {
  const a = key('Samsung 65" QN90F Neo QLED 4K Mini LED Smart TV [2025]', "tvs");
  assert.ok(a);
  assert.equal(key("Samsung 65 Inch QN90F Neo QLED 4K Smart TV QA65QN90FAWXXY", "tvs"), a);
  // A different size or year is a different TV.
  assert.notEqual(key('Samsung 55" QN90F Neo QLED 4K Smart TV', "tvs"), a);
  assert.notEqual(key('Samsung 65" QN90D Neo QLED 4K Smart TV', "tvs"), a);
  assert.equal(key('LG 65" C5 OLED evo 4K Smart TV OLED65C5PSA', "tvs"), key('LG 65 Inch OLED evo C5 4K Smart TV', "tvs"));
});

test("full part numbers merge into the series only when unambiguous", () => {
  assert.equal(mergeTarget("QA65QN90FAWXXY", [{ key: "a", code: "QN90F" }]), "a");
  assert.equal(mergeTarget("QA65QN90FAWXXY", [{ key: "a", code: "QN90F" }, { key: "b", code: "QN90FA" }]), undefined);
});

test("monitors use the model code", () => {
  assert.equal(key('Dell UltraSharp 27" U2724D QHD IPS Monitor', "monitors"), key("Dell U2724D 27 inch UltraSharp QHD Monitor", "monitors"));
  assert.notEqual(key('Dell UltraSharp 27" U2724D QHD IPS Monitor', "monitors"), key('Dell UltraSharp 27" U2724DE QHD Monitor', "monitors"));
});

test("graphics cards: same card in any word order, but OC and memory matter", () => {
  assert.equal(gpuChip("ASUS TUF Gaming GeForce RTX 5070 Ti OC 16GB"), "RTX 5070 Ti");
  assert.equal(gpuChip("Sapphire Pulse Radeon RX 9070 XT 16GB"), "RX 9070 XT");
  const a = key("ASUS TUF Gaming GeForce RTX 5070 Ti OC Edition 16GB GDDR7", "graphics-cards");
  assert.equal(key("ASUS GeForce RTX 5070 Ti TUF Gaming OC 16GB Graphics Card", "graphics-cards"), a);
  assert.notEqual(key("ASUS TUF Gaming GeForce RTX 5070 Ti 16GB GDDR7", "graphics-cards"), a);
  assert.notEqual(key("ASUS TUF Gaming GeForce RTX 5070 OC 12GB", "graphics-cards"), a);
});

test("tablets keep chip, size and connectivity apart", () => {
  const air = parseProduct(o("Apple iPad Air 11-inch (M3) Wi-Fi 256GB - Space Grey"), "tablets")!;
  assert.equal(air.brand, "Apple");
  assert.equal(air.variant.id, "256gb-wifi");
  assert.equal(parseProduct(o('Apple iPad Air 11" M3 Wi-Fi + Cellular 256GB (Blue)'), "tablets")!.variant.id, "256gb-cellular");
  assert.equal(parseProduct(o('Apple iPad Air 11" M3 Wi-Fi + Cellular 256GB (Blue)'), "tablets")!.key, air.key);
  assert.notEqual(parseProduct(o("Apple iPad Air 11-inch (M2) Wi-Fi 256GB - Space Grey"), "tablets")!.key, air.key);
  assert.notEqual(parseProduct(o("Apple iPad Air 13-inch (M3) Wi-Fi 256GB - Space Grey"), "tablets")!.key, air.key);
});

test("MacBooks match on size, chip, memory and storage", () => {
  const a = key("Apple MacBook Air 13-inch with M4 Chip, 512GB/16GB (Midnight)", "laptops");
  assert.ok(a);
  assert.equal(key('Apple MacBook Air 13" M4 16GB RAM 512GB SSD - Sky Blue', "laptops"), a);
  assert.notEqual(key('Apple MacBook Air 13" M4 24GB RAM 512GB SSD - Sky Blue', "laptops"), a);
});

test("accessories and refurbished are not products", () => {
  assert.equal(parseProduct(o('Samsung 65" TV Wall Mount Bracket'), "tvs"), null);
  assert.equal(parseProduct(o("Apple iPad Air 11-inch Smart Folio Case"), "tablets"), null);
  assert.equal(parseProduct(o('Dell 27" Monitor Refurbished'), "monitors"), null);
});

test("codes skip specs", () => {
  assert.deepEqual(codes("LG 27GR93U 4K 144Hz HDMI2.1 32GB"), ["27GR93U"]);
});

test("Galaxy Tab model numbers are not Apple chips", () => {
  const p = parseProduct(o("Samsung Galaxy Tab A11+ 128GB Wi-Fi Grey"), "tablets")!;
  assert.match(p.model, /A11\+/);
});

test("monitor sizes and model suffixes stay apart", () => {
  assert.notEqual(key('Samsung 24-inch Odyssey G30D FHD Gaming Monitor', "monitors"), key('Samsung 27" Odyssey G30D FHD Gaming Monitor', "monitors"));
  assert.equal(mergeTarget("491CQPX", [{ key: "a", code: "491CQP" }]), undefined);
});

test("laptop series names are not part numbers", () => {
  assert.notEqual(key("Alienware 16 Area-51 Gaming Laptop", "laptops"), key("Alienware 18 Area-51 Gaming Laptop", "laptops"));
  assert.notEqual(key("Dell 14 Plus 2-in-1 Laptop", "laptops"), key("Dell 16 Plus 2-in-1 Laptop", "laptops"));
});

test("conflicting specs split a group, missing ones don't", async () => {
  const { conflicts } = await import("../src/lib/match");
  assert.ok(conflicts("165", "240"));
  assert.ok(!conflicts("", "240"));
  assert.ok(conflicts("i714650hx|RTX 5050|16|1024", "i714650hx|RTX 5060|16|1024"));
  assert.ok(!conflicts("i714650hx||16|", "|RTX 5050||1024"));
});

test("CPU model numbers are not laptop part numbers", () => {
  assert.deepEqual(codes("HP EliteBook X G2i 14 Core Ultra X7-358H 32GB 1TB"), ["G2I"]);
  assert.notEqual(
    key('HP OmniBook 7 AI 16-inch Core Ultra X7-358H/32GB/1TB SSD Laptop', "laptops", { mpn: "D32YTPA" }),
    key('HP EliteBook X G2i 14" WUXGA AI Laptop - Core Ultra X7-358H 32GB 1TB LTE 5G W11P', "laptops"),
  );
});

test("one iPad mini page per model: size, generation-or-chip naming and 'with' never split it", () => {
  const key = (t: string) => parseProduct(o(t), "tablets")!.key;
  const a17 = key("Apple iPad mini (A17 Pro) Wi-Fi 128GB - Blue");
  for (const t of [
    'Apple iPad Mini 8.3" (7th Gen) Wi-Fi 128GB (Blue)',
    "Apple iPad mini (7th Generation) 128GB Wi-Fi in Blue - MXN73LL/A",
    "Apple 8.3-Inch iPad mini with A17 Pro chip, 512GB, Wi-Fi Only, 12MP (Space Gray)",
    "Apple iPad mini 7th Gen 8.3in Wi-Fi+Cellular 128GB - Blue",
  ])
    assert.equal(key(t), a17, t);
  assert.equal(parseProduct(o("Apple iPad mini 7th Gen 8.3in Wi-Fi+Cellular 128GB - Blue"), "tablets")!.variant.id, "128gb-cellular");
  assert.notEqual(key("Apple iPad mini (A20 Pro) Wi-Fi + Cellular 128GB Standard Glass - Midnight"), a17);
  assert.equal(key("Apple 8.3 inch iPad Mini - WiFi 64GB - Space Grey"), key("Apple iPad Mini Wi-Fi 128GB - Space Grey"));
});
