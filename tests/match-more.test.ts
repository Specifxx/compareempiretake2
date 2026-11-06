import { test } from "node:test";
import assert from "node:assert/strict";
import { parseProduct } from "../src/lib/match";
import { cpuModel, ramSignature } from "../src/lib/match-more";
import type { CategoryId, RawOffer } from "../src/lib/types";

const o = (title: string, extra: Partial<RawOffer> = {}) => ({ retailer: "jbhifi", sku: "x", url: "u", price: 1, inStock: true, title, ...extra }) as RawOffer;
const p = (t: string, c: CategoryId, extra?: Partial<RawOffer>) => parseProduct(o(t, extra), c);
const key = (t: string, c: CategoryId, extra?: Partial<RawOffer>) => p(t, c, extra)?.key;

test("CPUs match on the exact model, boxed or not", () => {
  assert.deepEqual(cpuModel("AMD Ryzen 7 9800X3D 8-Core AM5 Processor"), { brand: "AMD", family: "Ryzen 7", model: "9800X3D" });
  assert.equal(key("AMD Ryzen 7 9800X3D Processor", "cpus"), key("AMD Ryzen 7 9800X3D 8 Core 16 Thread Desktop CPU AM5", "cpus"));
  assert.notEqual(key("Intel Core i5-14600K Processor", "cpus"), key("Intel Core i5 14600KF Processor", "cpus"));
  assert.equal(key("Intel Core Ultra 7 265K Desktop Processor", "cpus"), key("Intel Core Ultra 7 265K LGA1851 CPU", "cpus"));
  assert.equal(p("Noctua NH-D15 CPU Cooler for Ryzen 7", "cpus"), null);
});

test("SSDs: capacity is the variant, the line is the product", () => {
  const a = p("Samsung 990 PRO 2TB PCIe Gen4 NVMe M.2 SSD", "ssds")!;
  const b = p("Samsung 990 PRO NVMe M.2 SSD 1TB", "ssds")!;
  assert.equal(a.key, b.key);
  assert.equal(a.variant.id, "2tb");
  assert.notEqual(key("Samsung 990 PRO with Heatsink 2TB NVMe SSD", "ssds"), a.key);
});

test("RAM matches on part number, else on the full spec", () => {
  assert.equal(ramSignature("Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz CL30 Black"), "DDR5 32gb 2x16 6000 cl30");
  assert.notEqual(ramSignature("32GB (2x16GB) DDR5 6000MHz CL30"), ramSignature("32GB (2x16GB) DDR5 6400MHz CL32"));
  assert.equal(key("Corsair Vengeance RGB 32GB", "ram", { mpn: "CMH32GX5M2B6000C30" }), key("CORSAIR VENGEANCE RGB DDR5 32GB 6000", "ram", { mpn: "CMH32GX5M2B6000C30" }));
});

test("headphones: colour is not part of the product", () => {
  const a = p("Sony WH-1000XM6 Wireless Noise Cancelling Headphones - Black", "headphones")!;
  const b = p("Sony WH-1000XM6 Noise Cancelling Wireless Headphones (Midnight Blue)", "headphones")!;
  assert.equal(a.key, b.key);
  assert.equal(b.colour, "Midnight Blue");
  assert.notEqual(key("Sony WF-1000XM5 Noise Cancelling Earbuds - Black", "headphones"), a.key);
});

test("smartwatches: case size and cellular are variants", () => {
  const a = p("Apple Watch Series 11 GPS 42mm Jet Black Aluminium Case with Black Sport Band - M/L", "smartwatches")!;
  const b = p("Apple Watch Series 11 GPS + Cellular 46mm Silver Aluminium Case with Sport Loop", "smartwatches")!;
  assert.equal(a.key, b.key);
  assert.equal(a.variant.id, "42mmgps");
  assert.equal(b.variant.id, "46mmcell");
  assert.notEqual(key("Apple Watch Ultra 3 GPS + Cellular 49mm Titanium Case with Trail Loop", "smartwatches"), a.key);
});

test("consoles keep editions apart and storage as a variant", () => {
  assert.notEqual(key("PlayStation 5 Console Digital Edition", "consoles"), key("PlayStation 5 Console", "consoles"));
  assert.equal(p("Xbox Series X 1TB Console", "consoles")!.brand, "Microsoft");
  assert.equal(p("Steam Deck OLED 1TB", "consoles")!.variant.id, "1tb");
  assert.equal(p("DualSense Wireless Controller - White", "consoles"), null);
});

test("soundbars and printers use model codes", () => {
  assert.equal(key('Samsung HW-Q990F 11.1.4ch Q-Series Soundbar', "soundbars"), key("Samsung Q990F Dolby Atmos Soundbar HW-Q990F", "soundbars"));
  assert.equal(key("Epson EcoTank ET-2850 Multifunction Printer", "printers"), key("Epson ET-2850 EcoTank Wireless All-in-One Printer", "printers"));
  assert.equal(p("Epson 502 Black Ink Bottle", "printers"), null);
});

test("cameras: body and kits stay apart", () => {
  assert.notEqual(key("Sony Alpha a7 IV Mirrorless Camera Body", "cameras"), key("Sony Alpha a7 IV Mirrorless Camera with 28-70mm Lens", "cameras"));
});

test("pack counts and component codes don't merge different products", () => {
  assert.notEqual(key("TP-Link Deco BE85 BE22000 Mesh Wi-Fi 7 System - 2 Pack", "routers"), key("TP-Link Deco BE85 BE22000 Mesh Wi-Fi 7 System - 3 Pack", "routers"));
  assert.notEqual(
    key("G9 Ryzen 7 9800X3D GeForce RTX 5080 Gaming PC 61075", "desktops", { mpn: "9800X3D" }),
    key("G7 Ryzen 7 9800X3D GeForce RTX 5070 Ti Gaming PC 61022", "desktops", { mpn: "9800X3D" }),
  );
  assert.doesNotMatch(p("Samsung T7 Portable SSD 4TB", "ssds")!.model, /4TB/);
});

test("wired and wireless headsets are different products", () => {
  assert.notEqual(key("HyperX Cloud Alpha Gaming Headset", "headphones"), key("HyperX Cloud Alpha Wireless Gaming Headset", "headphones"));
});

test("appliances match on the maker's model code, and each colour code is its own product", () => {
  assert.equal(
    key("Breville the Barista Express Espresso Machine BES870BSS", "coffee-machines"),
    key("Breville Barista Express Coffee Machine - Brushed Stainless Steel", "coffee-machines", { mpn: "BES870BSS" }),
  );
  assert.notEqual(key("Breville the Barista Express BES870BSS", "coffee-machines"), key("Breville the Barista Express BES870BTR", "coffee-machines"));
  assert.equal(key("LG 635L French Door Fridge GF-L700MBL", "fridges"), key("LG 635L French Door Refrigerator", "fridges", { mpn: "GFL700MBL" }));
  assert.equal(key("Fisher & Paykel 9kg Front Load Washer WH9060P4", "washing-machines"), key("Fisher & Paykel WH9060P4 9kg Front Loader Washing Machine", "washing-machines"));
  // Capacities and wattages are never the model code.
  assert.equal(p("Ninja Foodi MAX Dual Zone Air Fryer 9.5L AF400", "air-fryers")?.code, "AF400");
  assert.equal(p("Westinghouse 1800W 524L Bottom Mount Fridge WBE5304SC", "fridges")?.code, "WBE5304SC");
});

test("appliance accessories are not appliances", () => {
  assert.equal(p("Nespresso Vertuo Capsules Variety Pack", "coffee-machines"), null);
  assert.equal(p("Dishwasher Tablets 60 pack", "dishwashers"), null);
  assert.equal(p("LG Washer Dryer Stacking Kit", "washing-machines"), null);
  assert.equal(p("Samsung Fridge Water Filter HAF-QIN", "fridges"), null);
  assert.ok(p("Dyson V15 Detect Absolute Cordless Vacuum", "vacuums"));
});

test("a figure with a unit is never the model code", () => {
  const av = { brand: "Avanti" }, cap = { brand: "Capresso" }, bull = { brand: "Bull Grills" };
  assert.notEqual(key("Avanti Inox Stovetop Espresso Maker 6 Cup 300ml", "coffee-gear", av), key("Avanti Classic Pro Stovetop Espresso Maker 6 Cup 300ml", "coffee-gear", av));
  assert.notEqual(key("Capresso MG900 10-Cup Rapid Brew Coffee Maker", "coffee-machines", cap), key("Capresso MT900 10-Cup Rapid Brew Coffee Maker", "coffee-machines", cap));
  assert.notEqual(key("Bull Grills Outlaw 30-Inch 4-Burner Built-in Gas grill Propane", "bbqs", bull), key("Bull Grills Lonestar Select 30-Inch 4-Burner Built-In Gas Grill Propane", "bbqs", bull));
  assert.equal(p("Avanti Domo Caf Coffee Plunger 800ml 6 Cup Steel", "coffee-gear", av)?.code, undefined);
  assert.equal(p("Capresso MG900 10-Cup Rapid Brew Coffee Maker", "coffee-machines", cap)?.code, "MG900");
  assert.notEqual(key("ASUS RT-AX57 Go Wireless Wifi 6 (802.11ax) AX3000 Dual Band Gigabit Router", "routers"), key("ASUS RT-BE58U Wifi 7 (802.11ax) Router", "routers"));
});

test("the colour slot keeps product words out of the colour", () => {
  // The generation, the capacity and "wireless" stay with the product; only the colour is the colour.
  const gen2 = p("Bose QuietComfort Headphones (2nd Gen, Black)", "headphones")!;
  assert.equal(gen2.colour, "Black");
  assert.notEqual(gen2.key, key("Bose QuietComfort Headphones - Black", "headphones"));
  assert.equal(gen2.key, key("Bose QuietComfort Headphones (2nd Gen) - White Smoke", "headphones"));
  const tb1 = p("SanDisk Extreme Portable SSD - Monterey Blue 1TB", "ssds")!;
  assert.equal(tb1.variant.id, "1tb");
  assert.equal(tb1.colour, "Monterey Blue");
  assert.equal(tb1.key, p("SanDisk Extreme Portable SSD - Sky Blue 2TB", "ssds")!.key);
  assert.notEqual(tb1.variant.id, p("SanDisk Extreme Portable SSD - Sky Blue 2TB", "ssds")!.variant.id);
  const wired = p("HyperX Cloud Stinger 3 – Gaming Headset Black", "headphones")!;
  const wireless = p("HyperX Cloud Stinger 3 – Wireless Gaming Headset Black", "headphones")!;
  assert.equal(wired.colour, "Black");
  assert.notEqual(wired.key, wireless.key);
  // The display name (and so the URL) is still the title without the whole trailing slot.
  assert.equal(wired.model, "Cloud Stinger 3");
  const go3s = p("Insta360 GO 3S Action Camera (64GB, Arctic White)", "cameras")!;
  assert.equal(go3s.colour, "Arctic White");
  assert.notEqual(go3s.key, key("Insta360 GO 3S Action Camera (128GB, Arctic White)", "cameras"));
  assert.equal(go3s.key, key("Insta360 GO 3S Action Camera (64GB, Midnight Black)", "cameras"));
});

test("headphones and earbuds of one name are two products", async () => {
  const { conflicts } = await import("../src/lib/match");
  const h = p("Bose QuietComfort Headphones - Black", "headphones")!;
  const e = p("Bose QuietComfort Earbuds - Black", "headphones")!;
  assert.ok(conflicts(h.discriminator!, e.discriminator!));
  assert.ok(!conflicts(h.discriminator!, p("Bose QuietComfort Bluetooth Headphones - Noise Cancelling", "headphones")!.discriminator!));
  assert.ok(conflicts(p("HyperX Cloud Earbuds III Black", "headphones")!.discriminator!, p("HyperX Cloud III – Gaming Headset Black", "headphones")!.discriminator!));
});

test("RAM without a part number keeps the line in the key", () => {
  assert.notEqual(key("Corsair Vengeance LPX - 32 GB 4 x 8 GB DDR4 3200 MHz memory module", "ram"), key("Corsair Dominator Platinum RGB - 32 GB 4 x 8 GB DDR4 3200 MHz memory module", "ram"));
  assert.notEqual(key("G.Skill Trident Z5 Neo RGB 64GB (2x 32GB) DDR5 6000MHz CL36 AMD Desktop Memory", "ram"), key("G.Skill Flare X5 64GB (2x 32GB) DDR5 6000MHz C36 Desktop Memory - White", "ram"));
  assert.equal(key("Kingston Technology FURY Beast RGB - 32 GB 2 x 16 GB 3200MT/s DDR4 memory module", "ram"), key("Kingston Fury Beast RGB 32GB (2x16GB) DDR4 PC4-25600C16 3200MHz Dual Channel Kit", "ram"));
  assert.notEqual(key("Kingston Technology FURY Renegade RGB - 32 GB 2 x 16 GB 6400MT/s DDR5 memory module", "ram"), key("Kingston FURY Beast RGB 32GB (2x16GB) DDR5 6400MHz Dual Channel Kit", "ram"));
});

test("BBQs: the line before the code and the fuel must agree", async () => {
  const { conflicts } = await import("../src/lib/match");
  const spirit = p("Weber Spirit E-425 4-Burner Gas Barbecue (LPG)", "bbqs")!;
  const genesis = p("Weber Genesis 2026 E-425 Black (LPG)", "bbqs")!;
  const spiritNg = p("Weber Spirit E-425 Black Natural Gas – New", "bbqs")!;
  assert.equal(spirit.key, genesis.key);
  assert.ok(conflicts(spirit.discriminator!, genesis.discriminator!));
  assert.ok(conflicts(spirit.discriminator!, spiritNg.discriminator!));
  assert.ok(!conflicts(spirit.discriminator!, p("Spirit E-425 4-Burner Gas BBQ (LPG)", "bbqs", { brand: "Weber" })!.discriminator!));
  assert.ok(!conflicts(spirit.discriminator!, p("Weber Spirit E-425 Black ULPG", "bbqs")!.discriminator!));
});

test("Ryzen PRO is its own part", () => {
  assert.notEqual(key("AMD Ryzen 5 PRO 8500G processor 3.5 GHz 16 MB L3", "cpus"), key("AMD Ryzen 5 8500G processor 3.5 GHz 16 MB L3", "cpus"));
  assert.equal(cpuModel("AMD Ryzen Threadripper PRO 7985WX")?.family, "Ryzen Threadripper PRO");
});

test("headphones: wiring and impedance must agree", () => {
  const d = (t: string, brand: string) => p(t, "headphones", { brand })!.discriminator;
  assert.equal(d("Beyerdynamic DT 770 PRO Closed Reference Studio Headphones 80 Ohm", "Beyerdynamic"), "headphones||80");
  assert.equal(d("Beyerdynamic DT 770 PRO Closed Reference Studio Headphones 250 Ohm", "Beyerdynamic"), "headphones||250");
  assert.equal(d("HiFiMAN HE-R10D Dynamic Closed-Back Headphones Wireless", "HiFiMAN"), "headphones|wireless|");
  assert.equal(d("HiFiMAN HE-R10D Dynamic Closed-Back Headphones Wired", "HiFiMAN"), "headphones|wired|");
});
