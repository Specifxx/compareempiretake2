import { test } from "node:test";
import assert from "node:assert/strict";
import { categorySpecs, parseProduct } from "../src/lib/match";
import { cpuName, ownTitles, panelOf, phoneSpecs, resolutionOf } from "../src/lib/specs";
import { curatedSheet, withCurated } from "../src/lib/specs-curated";
import type { RawOffer } from "../src/lib/types";

const row = (extra: [string, string][] | undefined, k: string) => extra?.find(([x]) => x === k)?.[1];

test("laptop processors read in every spelling stores use (titles from the AU and US imports, 2026-11-06)", () => {
  const cases: [string, string][] = [
    ["ASUS ProArt P16 H7606WX 16in 4K OLED 120Hz Touch Ryzen AI 9 HX 370 RTX 5090 2TB SSD 64GB RAM W11P Laptop", "AMD Ryzen AI 9 HX 370"],
    ["ASUS ProArt P16 16\" 120Hz 4K Copilot+ Laptop RAI 9 HX 370 64GB 2TB RTX5080 W11P", "AMD Ryzen AI 9 HX 370"],
    ["HP ZBook Fury G1i 16in WUXGA Touch U7-265HX RTX Pro 3000 1TB SSD 32GB RAM W11P Laptop", "Intel Core Ultra 7 265HX"],
    ["ASUS ROG Zephyrus Duo 16 16in 3K OLED 120Hz Touchscreen Ultra 9 386H RTX 5070 Ti 1TB SSD 32GB RAM W11H Gaming Laptop", "Intel Core Ultra 9 386H"],
    ["ASUS Zenbook Duo 14in 3K OLED Core Ultra X7 358H 1TB SSD 32GB RAM W11H Laptop", "Intel Core Ultra X7 358H"],
    ["ASUS ROG Flow Z13 13.4in 2.5K IPS Ryzen AI MAX+ 395 1TB SSD 32GB RAM W11H Gaming Laptop", "AMD Ryzen AI Max+ 395"],
    ["HP EliteBook 8 G1i 16in WUXGA Ai Ultra 7-256V 512GB SSD 16GB RAM W11P Laptop", "Intel Core Ultra 7 256V"],
    ["ASUS TUF Gaming F16 16in FHD+ 165Hz i7-14650HX RTX 5070 1TB SSD 16GB RAM W11H Gaming Laptop", "Intel Core i7-14650HX"],
    ["ASUS ZenBook 14 UX3407NA 14in WUXGA OLED Snapdragon X2 Elite X2E88100 1TB SSD 32GB RAM W11H Laptop", "Snapdragon X2 Elite"],
    ["ASUS Vivobook Go 14 E1404FA 14in FHD AMD Athlon Silver 128GB SSD 4GB RAM W11H Laptop", "AMD Athlon Silver"],
    ["MSI Prestige N16 Flip AI+ 16-Inch OLED Touchscreen 2-in-1 Laptop NVIDIA RTX Spark N1X 32GB RAM 1TB SSD", "NVIDIA N1X"],
    ["Apple MacBook Air 13-inch M4 chip 16GB 256GB", "Apple M4"],
  ];
  for (const [t, want] of cases) assert.equal(cpuName(t), want, t);
  // A storage figure is not a model number, and a Galaxy Tab "Ultra 5G" is not an Intel chip.
  assert.equal(cpuName("Lenovo IdeaPad Ryzen 5 512GB SSD 16GB"), "AMD Ryzen 5");
  assert.equal(cpuName("Samsung Galaxy Tab S11 Ultra 5G 256GB"), undefined);
});

test("one stray listing no longer decides a monitor's resolution or panel (LG 27GM950B, Bill's US review)", () => {
  const titles = [
    "LG UltraGear 27-Inch OLED Gaming Monitor 2K WQHD 240Hz in Gray - 27GX704A",
    "LG 27GX790B-B 27-Inch Ultragear QHD (3440 x 1440) OLED Gaming Monitor Dual Mode",
    "LG 27GM950B-B 27-inch Ultragear evo 5K (5120 x 2880) IPS Mini-LED Gaming Monitor",
    "LG 27GM950B-B 27-inch Ultragear evo 5K (5120 x 2880) IPS Mini-LED Gaming Monitor",
  ];
  const own = ownTitles(titles, undefined, "LG 27GM950B-B 27-inch Ultragear evo 5K");
  assert.equal(own.length, 4, "no codes given: every title");
  const s = categorySpecs("monitors", ownTitles(titles, ["27GM950B-B"], "LG 27GM950B-B 27-inch Ultragear evo 5K"));
  assert.equal(row(s.extra, "Resolution"), "5K");
  assert.equal(row(s.extra, "Panel"), "Mini LED IPS");
  assert.equal(resolutionOf("LG QHD 32-Inch Computer Monitor 32QN600-B, Black"), "QHD (1440p)");
  assert.equal(resolutionOf("LG UltraGear evo AI GM9 27GM950B-B 27\" 5K (5120x2880) Hyper Mini LED IPS Dual Mode165Hz/330Hz"), "5K");
  assert.equal(panelOf("Samsung 65\" Neo QLED 4K QN90F"), "Neo QLED (Mini LED)");
});

test("\"27-Inch\" is a size, not a model code: different LG monitors stay apart", () => {
  const o = (title: string) => ({ retailer: "us-abt", sku: "x", url: "u", price: 1, inStock: true, title, brand: "LG" }) as RawOffer;
  const a = parseProduct(o("LG UltraGear 27-Inch OLED Gaming Monitor 2K WQHD 240Hz in Gray - 27GX704A"), "monitors");
  const b = parseProduct(o("LG 27GM950B-B 27-inch Ultragear evo 5K (5120 x 2880) IPS Mini-LED Gaming Monitor"), "monitors");
  assert.ok(a && b);
  assert.notEqual(a.key, b.key);
  const c = parseProduct(o("LG 32G600A-B 32-inch Ultragear QHD (2560 x 1440) Curved Gaming Monitor, Black"), "monitors");
  const d = parseProduct(o("LG QHD 32-Inch Computer Monitor 32QN600-B, Black"), "monitors");
  assert.notEqual(c!.key, d!.key);
});

test("phone figures are voted over the titles", () => {
  const s = phoneSpecs("Galaxy A56", ["Samsung Galaxy A56 5G 128GB 6.7\" 50MP", "Samsung Galaxy A56 6.7-inch 5000mAh", "Samsung Galaxy A56 6.6\""]);
  assert.equal(s.screenInches, 6.7);
  assert.equal(s.batteryMah, 5000);
});

test("a curated sheet reaches the model's colours and editions, never a sibling model", () => {
  const sheet = (brand: string, model: string) => curatedSheet({ category: "phones", brand, model });
  assert.equal(sheet("Apple", "iPhone 16 Ultramarine")?.screenInches, 6.1);
  assert.equal(sheet("Apple", "iPhone 16 Plus Teal")?.screenInches, 6.7);
  assert.equal(sheet("Samsung", "Galaxy S26 Ultra Enterprise Edition Black")?.batteryMah, 5000);
  assert.equal(sheet("Samsung", "Galaxy Fold7 Silver Shadow")?.screenInches, 8);
  assert.equal(sheet("Motorola", "Moto Edge 50 Neo")?.chip, "Dimensity 7300");
  // No sheet for these models: a shorter one must not stand in.
  assert.equal(sheet("Google", "Pixel 12a"), undefined);
  assert.equal(sheet("Samsung", "Galaxy S26 Edge"), undefined);
  assert.equal(sheet("Apple", "iPhone 17 Plus"), undefined);
  assert.equal(sheet("OPPO", "Reno 12 FS"), undefined); // Reno12's sheet, a different phone
  assert.equal(sheet("OPPO", "Reno16 F Pro"), undefined);
  // Sizes and store suffixes are not part of the model.
  assert.equal(sheet("Motorola", "moto G05 Denim Blue")?.chip, "Helio G81");
  assert.equal(sheet("Motorola", "moto g57 17.3 cm")?.batteryMah, 5200);
  assert.equal(sheet("OPPO", "Find X10 Graphite6.9\"")?.screenInches, 6.59);
  // Curated figures beat a title's.
  assert.equal(withCurated({ category: "phones", brand: "Apple", model: "iPhone 16" }, { screenInches: 6.7 }).screenInches, 6.1);
});
