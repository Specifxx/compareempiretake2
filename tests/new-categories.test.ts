/**
 * The four categories added on 2026-11-02 (hair tools, small kitchen, BBQs, coffee gear): which store titles each
 * one takes and refuses, how a product is keyed, and that no title lands in two of them.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { classify } from "../scripts/scrapers/auto-shopify";
import { parseProduct } from "../src/lib/match";
import { moreSpecs } from "../src/lib/match-more";
import type { CategoryId, RawOffer } from "../src/lib/types";

const NEW: CategoryId[] = ["small-kitchen", "coffee-gear", "hair-care", "bbqs"];
const ALL: CategoryId[] = ["vacuums", "air-fryers", "coffee-machines", "fridges", "washing-machines", "dishwashers", ...NEW];
const cat = (t: string, price = 150) => classify(ALL, t, price);
const o = (title: string, extra: Partial<RawOffer> = {}) => ({ retailer: "jbhifi", sku: "x", url: "u", price: 100, inStock: true, title, ...extra }) as RawOffer;
const key = (t: string, c: CategoryId, extra?: Partial<RawOffer>) => parseProduct(o(t, extra), c)?.key;

test("hair tools: dryers, straighteners, stylers and clippers, never their accessories", () => {
  for (const t of [
    "Dyson Supersonic Nural Hair Dryer Vinca Blue/Topaz",
    "Dyson Airwrap i.d. Multi-Styler and Dryer Complete Long",
    "ghd Platinum+ Hair Straightener Black",
    "ghd Helios Professional Hair Dryer",
    "Shark FlexStyle 5-in-1 Air Styler & Hair Dryer HD440",
    "Remington PROluxe You Adaptive Curling Wand CI98X8",
    "Wahl Magic Clip Cordless Hair Clipper",
    "BaByliss Big Hair Dual Hot Air Styler",
    "Dyson Supersonic Hair Dryer with Presentation Case",
  ])
    assert.equal(cat(t), "hair-care", t);
  for (const t of [
    "Diffuser Attachment for Dyson Supersonic",
    "ghd Heat Protect Spray 120ml",
    "Wahl Pet Clipper Kit",
    "Hair Dryer Holder Wall Mount",
    "Barbie Hair Salon Styling Head Play Set",
    "Bosch Serie 6 Heat Pump Dryer 9kg WQB246C9GB",
  ])
    assert.notEqual(cat(t), "hair-care", t);
});

test("small kitchen: mixers, blenders, kettles and toasters, but not coffee kettles, audio mixers or parts", () => {
  for (const t of [
    "KitchenAid Artisan KSM195 Tilt-Head Stand Mixer Empire Red",
    "Smeg 50's Style Kettle KLF03CREU Cream",
    "Breville the Smart Toast 4 Slice Toaster BTA845BSS",
    "Vitamix A3500i Ascent Blender",
    "Ninja CREAMi Ice Cream Maker NC300",
    "Panasonic NN-ST64JWQPQ 32L Inverter Microwave",
    "Breville the Smart Grill Pro BGR840",
  ])
    assert.equal(cat(t), "small-kitchen", t);
  for (const t of [
    "Fellow Stagg EKG Electric Pour-Over Kettle",
    "Pioneer DJM-900NXS2 4-Channel DJ Mixer",
    "KitchenAid 4.8L Stainless Steel Bowl",
    "Vitamix 2L Blender Jug",
    "Stovetop Whistling Kettle 2.5L",
    "Ninja AF400 Dual Zone Air Fryer",
    "Kettlebell 16kg",
  ])
    assert.notEqual(cat(t), "small-kitchen", t);
});

test("BBQs: gas, charcoal, pellet and pizza ovens, not covers, fuel or benchtop grills", () => {
  for (const t of [
    "Weber Spirit E-325 GBS Gas BBQ",
    "Weber Q 1200 Titanium",
    "Traeger Pro 575 Pellet Grill",
    "Ooni Koda 16 Gas Pizza Oven",
    "Ziggy Classic 4 Burner Hotplate Combo BBQ",
    "Kamado Joe Classic III Charcoal Grill",
    "Ninja Woodfire Pro Outdoor Grill & Smoker OG850",
  ])
    assert.equal(cat(t, 400), "bbqs", t);
  for (const t of [
    "Weber Q Premium Cover",
    "Traeger Signature Blend Pellets 9kg",
    "Ooni Pizza Peel 14 inch",
    "Breville the Smart Grill Pro BGR840",
    "Grill Brush Stainless Steel",
    "Weber Genesis BBQ Cookbook",
  ])
    assert.notEqual(cat(t, 400), "bbqs", t);
});

test("coffee gear: grinders, pour-over kettles, scales and brewers, not machines, beans or filters", () => {
  for (const t of [
    "Breville the Smart Grinder Pro BCG820BSS",
    "Eureka Mignon Specialita Espresso Grinder Black",
    "Baratza Encore ESP Burr Coffee Grinder",
    "Fellow Stagg EKG Electric Pour-Over Kettle",
    "Acaia Pearl Coffee Scale",
    "AeroPress Original Coffee Maker",
    "Bodum Chambord 8 Cup Coffee Plunger",
    "Hario V60 Glass Dripper 02",
    "Bialetti Moka Express 6 Cup",
  ])
    assert.equal(cat(t, 80), "coffee-gear", t);
  for (const t of [
    "Breville the Barista Express Espresso Machine BES870BSS",
    "Hario V60 Paper Filters 02 100pk",
    "Peugeot Paris Pepper Mill 30cm",
    "Makita GA5030 Angle Grinder 125mm",
    "Ethiopia Yirgacheffe Coffee Beans 1kg",
    "Replacement Burrs for Baratza Encore",
  ])
    assert.notEqual(cat(t, 80), "coffee-gear", t);
});

test("new categories key by model code and keep brand spellings apart from older categories", () => {
  assert.equal(key("Smeg 50's Style Kettle KLF03CREU", "small-kitchen"), key("SMEG KLF03CREU Retro Kettle Cream", "small-kitchen"));
  assert.notEqual(key("Smeg 50's Style Kettle KLF03CREU", "small-kitchen"), key("Smeg 50's Style Kettle KLF03PBEU", "small-kitchen"));
  // No code: the identity words decide, and a series' kettle and toaster never merge.
  assert.notEqual(key("Smeg 50s Style Kettle", "small-kitchen"), key("Smeg 50s Style Toaster", "small-kitchen"));
  assert.equal(key("Baratza Encore Coffee Grinder", "coffee-gear"), key("Baratza Encore Burr Grinder", "coffee-gear"));
  assert.equal(parseProduct(o("Wilfa Svart Aroma Coffee Grinder"), "coffee-gear")?.brand, "Wilfa");
  // The same title in an older category keeps the brand it had before 2026-11 (its URL depends on it).
  assert.equal(parseProduct(o("Wilfa Svart Aroma Coffee Grinder"), "coffee-machines")?.brand, undefined);
});

test("new categories' specs", () => {
  assert.deepEqual(moreSpecs("hair-care", ["Dyson Airwrap i.d. Multi-Styler"]).find(([k]) => k === "Type"), ["Type", "Styler & hot brush"]);
  assert.deepEqual(moreSpecs("small-kitchen", ["KitchenAid Artisan Stand Mixer 4.8L"]).find(([k]) => k === "Type"), ["Type", "Stand mixer"]);
  assert.deepEqual(moreSpecs("bbqs", ["Traeger Pro 575 Pellet Grill"]).find(([k]) => k === "Fuel"), ["Fuel", "Pellet"]);
  assert.deepEqual(moreSpecs("bbqs", ["Weber Spirit E-325 3 Burner Gas BBQ"]).find(([k]) => k === "Burners"), ["Burners", "3"]);
  assert.deepEqual(moreSpecs("coffee-gear", ["Comandante C40 MK4 Hand Grinder"]).find(([k]) => k === "Type"), ["Type", "Manual grinder"]);
});
