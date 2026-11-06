import { test } from "node:test";
import assert from "node:assert/strict";
import { codes, gpuChip, mergeTarget, parseProduct, sharedCodeMerges } from "../src/lib/match";
import { productCodes } from "../src/lib/match-more";
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

test("laptops under one part number split on the stated CPU, drive and screen size", async () => {
  const { conflicts, laptopSignature } = await import("../src/lib/match");
  assert.ok(conflicts(laptopSignature('Dell Pro 14 Plus PB14250 14" FHD+ AI CoPilot+ Laptop - Intel Ultra 5-238V vPro 32GB 512GB W11 Pro'), laptopSignature('Dell Pro 14 Plus PB14250 14" FHD+ AI CoPilot+ Laptop - Intel Ultra 7-268V vPro 32GB')));
  assert.ok(conflicts(laptopSignature('ASUS BR1104FTA 11.6" Touch Rugged Education Laptop - Intel N150 8GB 128GB W11P'), laptopSignature('ASUS BR1104FTA 11.6" Touch Rugged Education Laptop - Intel N150 8GB 256GB W11P')));
  assert.ok(conflicts(laptopSignature('ASUS BR1104FTA 11.6" Touch Rugged Education Laptop - Intel N150 8GB 128GB W11P'), laptopSignature('ASUS BR1104FTA 12.2" Touch Rugged Education Laptop - Intel N150 8GB 128GB W11P')));
  assert.ok(conflicts(laptopSignature('Asus UM3406 Zenbook 14" WUXGA Touchscreen Laptop (Ryzen AI 5)[1TB]'), laptopSignature('Asus UM3406 Zenbook 14" WUXGA Touchscreen Copilot+ AI PC Laptop (Ryzen AI 7)[1TB]')));
  assert.ok(conflicts(laptopSignature('Microsoft Surface Laptop 8 13.8" Copilot+ PC Snapdragon 35 cm (13.8") Touchscreen 64 GB LPDDR5x-SDRAM 1 TB SSD'), laptopSignature('Microsoft Surface Laptop 8 15" Copilot+ PC Snapdragon 38.1 cm (15") Touchscreen 64 GB LPDDR5x-SDRAM 1 TB SSD')));
  // The same configuration in two stores' words still agrees.
  assert.ok(!conflicts(laptopSignature("LG gram Pro Laptop 17-Inch Intel Core Ultra 7 32GB RAM 1TB SSD in Black - 17Z90U-H.AU87U1"), laptopSignature("LG gram Pro 17 Inch Copilot+ PC, Windows 11 Home, Lightweight Dual AI Touchscreen Laptop, Intel Core Ultra 7, 32GB RAM, 1TB SSD, Black")));
  assert.equal(parseProduct(o("Microsoft Surface Pro, 13-inch (12th Edition) Essentials Bundle - Snapdragon X2 Plus (10 Core) with LCD display, Platinum, 16 GB RAM, 256 GB SSD"), "tablets"), null);
  assert.equal(parseProduct(o("Dell XPS 13 Laptop Bundle with Sleeve and Mouse"), "laptops"), null);
});

test("tablets under one name split on RAM and edition", async () => {
  const { conflicts } = await import("../src/lib/match");
  const a = parseProduct(o("Microsoft Surface Pro, 13-inch (12th Edition) - Snapdragon X2 Plus (10 Core) with LCD display, Black, 16 GB RAM, 512 GB SSD"), "tablets")!;
  const b = parseProduct(o("Microsoft Surface Pro, 13-inch (12th Edition) - Snapdragon X2 Plus (10 Core) with LCD display, Black, 24 GB RAM, 512 GB SSD"), "tablets")!;
  const c = parseProduct(o("Microsoft Surface Pro, 13-inch (11th Edition) - Snapdragon X Plus (10 Core), with LCD display, Dune, Wi-Fi, 16 GB RAM, 512 GB SSD"), "tablets")!;
  assert.equal(a.key, b.key);
  assert.ok(conflicts(a.discriminator!, b.discriminator!));
  assert.ok(conflicts(a.discriminator!, c.discriminator!));
  // A store that states no RAM agrees with every RAM figure; a Galaxy Tab's "6GB RAM 128GB" is the 128GB tablet.
  const d = parseProduct(o("Samsung Galaxy Tab A11+ (X236 6GB RAM 128GB 5G) Silver"), "tablets")!;
  const e = parseProduct(o("Samsung Galaxy Tab A11+ 5G 128GB - Grey"), "tablets")!;
  assert.equal(d.key, e.key);
  assert.equal(d.variant.id, e.variant.id);
  assert.ok(!conflicts(d.discriminator!, e.discriminator!));
});

test("desktops under one model code split on their configuration, and a CPU model is not the code", async () => {
  const { conflicts } = await import("../src/lib/match");
  const a = parseProduct(o("Lenovo ThinkCentre M70Q G6 Tiny PC - Ultra 7-265T 32GB 512GB WIFI+BT W11 Pro"), "desktops")!;
  const b = parseProduct(o("Lenovo ThinkCentre M70Q G6 Tiny PC - Ultra 7-265T 32GB 1TB WIFI+BT W11 Pro"), "desktops")!;
  assert.ok(conflicts(a.discriminator!, b.discriminator!));
  assert.ok(conflicts(parseProduct(o("Acer Veriton X Series desktop (VX2710G) - Intel Core i5, 8GB RAM, 512GB SSD, Windows 11 Pro"), "desktops")!.discriminator!, parseProduct(o("Acer Veriton X Series desktop (VX2710G) - Intel Core i7, 16GB RAM, 512GB SSD, Windows 11 Pro"), "desktops")!.discriminator!));
  assert.ok(conflicts(parseProduct(o("Acer Predator PO3-665 Gaming Desktop - Intel Core i5-14400F, 16GB RAM, 512GB SSD, NVIDIA GeForce RTX 5060, Windows 11, Black"), "desktops")!.discriminator!, parseProduct(o("Acer Predator PO3-665 Gaming Desktop - Intel Core i5-14400F, 16GB RAM, 512GB SSD, NVIDIA GeForce RTX 5070, Windows 11, Black"), "desktops")!.discriminator!));
  // "U7-255H" and "5-235T" are processors: the Dell Pro Micro and the Dell Pro AIO 24 are different computers.
  assert.notEqual(key("Dell Pro Micro AI Desktop PC - Core Ultra 5-235T 16GB 256GB W11P", "desktops"), key('Dell Pro AIO 24 Gen 5 23.8" FHD AI All-in-One Desktop PC - Core Ultra 5-235T 16GB 512GB W11P', "desktops"));
  assert.notEqual(key("ASUS NUC 15 Pro Slim Mini PC - Intel Core 7-240H, 16GB RAM, 512GB SSD, Windows 11 Pro - 3 YR ONSITE", "desktops"), key('ASUS ExpertCenter P440 23.8" All-in-One Desktop PC Intel Core 7-240H 16GB 512GB W11P', "desktops"));
});

test("pages that every listing names by the same model code join; a disagreeing spec or another brand keeps them apart", () => {
  const codes = (...ts: string[]) => ts.map((t) => productCodes(t));
  const m = sharedCodeMerges([
    { key: "a", brand: "Sony", codes: codes("Sony WH-1000XM5 Noise Cancelling Headphones", "Sony WH-1000XM5 Noise Cancelling Headphones - Pink"), disc: [] },
    { key: "b", brand: "Sony", codes: codes("Sony WH-1000XM5 Premium Noise Cancelling Wireless Over-Ear Headphones Black", "Sony WH-1000XM5 Premium Noise Cancelling Wireless Over-Ear Headphones Silver", "Sony WH-1000XM5 Wireless Noise Cancelling Headphones Black"), disc: [] },
    { key: "c", brand: "Sony", codes: codes("Sony WF-1000XM5 True Wireless Noise Cancelling Earbuds (Black)"), disc: [] },
    // One listing without the code: not every listing names it, so it never joins on the code.
    { key: "d", brand: "Sony", codes: codes("Sony WH-1000XM5 Headphones", "Sony Noise Cancelling Headphones"), disc: [] },
    { key: "e", brand: "Bose", codes: codes("Bose WH-1000XM5 Lookalike"), disc: [] },
    // A series name shared by different products: too short, and the kits' lens codes are longer than X-T50.
    { key: "h", brand: "Siemens", codes: codes("Siemens iQ300 60cm Fridge Freezer KG36NVICG"), disc: [] },
    { key: "i", brand: "Siemens", codes: codes("Siemens iQ300 60cm Fridge Freezer KG39NVIBG", "Siemens iQ300 Fridge KG39NVIBG"), disc: [] },
    { key: "j", brand: "Fujifilm", codes: codes("Fujifilm X-T50 Mirrorless Camera Body"), disc: [] },
    { key: "k", brand: "Fujifilm", codes: codes("Fujifilm X-T50 Mirrorless Camera XC15-45mmF3.5-5.6 Lens Kit", "Fujifilm X-T50 with XC15-45mmF3.5-5.6"), disc: [] },
    { key: "f", brand: "Sony", codes: codes("Sony WH-1000XM5 Wired Edition"), disc: ["wired"] },
    { key: "g", brand: "Sony", codes: codes("Sony WH-1000XM5 Wireless Edition"), disc: ["wireless"] },
  ]);
  assert.equal(m.get("a"), "b", "the smaller page joins the larger, which keeps its URL");
  assert.equal(m.has("b"), false);
  assert.equal(m.has("c"), false, "WF is not WH");
  assert.equal(m.has("d"), false);
  assert.equal(m.has("e"), false);
  assert.equal(m.has("h"), false, "iQ300 is a series, not a model");
  assert.equal(m.has("i"), false);
  assert.equal(m.has("j"), false, "the X-T50 body and its lens kits stay apart");
  assert.equal(m.has("k"), false);
  assert.equal(m.get("f"), "b", "a page whose spec the target does not contradict joins it");
  assert.equal(m.has("g"), false, "a stated spec that disagrees with the page's (now wired) keeps it apart");
});

test("productCodes keeps model codes and drops figures, buses and chips", () => {
  assert.deepEqual(productCodes("Samsung Galaxy S26 5G (Dual Sim, 256GB/12GB, 6.3'', SM-S942B) - Black"), ["SM-S942B"]);
  assert.deepEqual(productCodes("Breville the Barista Express BES870BSS 1600W 15 Bar Wi-Fi 6 DDR5 i5-13400F 10.4L"), ["BES870BSS"]);
  assert.deepEqual(productCodes("Sony 65 inch 4K TV"), []);
});
