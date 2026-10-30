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
