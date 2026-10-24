/**
 * Clove Technology (clove.co.uk, Shopify): new phones plus a large distributor-fed computing catalogue
 * (laptops, monitors, GPUs, CPUs, RAM, SSDs, motherboards, tablets, watches, drones, consoles).
 * Whole catalogue from /products.json (see _shopify.ts), filtered by Shopify product_type and the shared title checks.
 * Clove also sells refurbished stock (titles/types say "Refurbished", SKUs start RSV-/RMAV-): all dropped.
 * Clove's SKUs are its own (numeric distributor ids or codes like APPL-IP16PRO-1TB-BLK), so mpn comes from a model code
 * in the title when there is one. Prices are high for some distributor-fed lines and many are out of stock: shown as listed.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { mpnFromTitle } from "../../categories/jbhifi";
import { catalogue, shopifyUk, typeIs, type ShopOpts } from "./_shopify";

const BASE = "https://www.clove.co.uk";
// Pre-load the full catalogue (≈12k products) once with a higher page cap.
const load = () => catalogue(BASE, 80);

/** Clove's own SKUs (numeric distributor ids, "APPL-IP16PRO-1TB-BLK") are not part numbers: take a model code from the title only. */
const NOT_MPN = /DDR|SDRAM|GDDR|^WUXGA|^WQXGA|^FHD|^QHD|^UHD|^USB|^PCI|^802/i;
const mpn: ShopOpts["mpn"] = (p) => {
  const m = mpnFromTitle(p.title.replace(/[®™]/g, ""));
  return m && !NOT_MPN.test(m) ? m : undefined;
};
const c = (cat: CategoryId, pick: ShopOpts["pick"], extra: Partial<ShopOpts> = {}) => async (): Promise<RawOffer[]> => {
  await load();
  return (await shopifyUk("uk-clove", BASE, cat, { pick, mpn, ...extra })).filter((o) => !/^R(SV|MAV)-/.test(o.sku));
};

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  phones: c("phones", typeIs("Smartphone", "Smartphones"), { extraJunk: /\btray\b/i }),
  laptops: c("laptops", typeIs("Laptop", "Laptops")),
  monitors: c("monitors", typeIs("Computer Monitors")),
  tablets: c("tablets", typeIs("Tablet", "Tablets")),
  desktops: c("desktops", typeIs("Desktop", "Computer")),
  "graphics-cards": c("graphics-cards", typeIs("Graphics Cards")),
  cpus: c("cpus", typeIs("Processor", "Processors")),
  ram: c("ram", typeIs("Memory Modules")),
  ssds: c("ssds", typeIs("Internal Solid State Drive", "Internal Solid State Drives", "External Solid State Drive", "External Solid State Drives")),
  motherboards: c("motherboards", typeIs("Motherboards")),
  routers: c("routers", typeIs("Wireless Routers")),
  smartwatches: c("smartwatches", typeIs("Smartwatch")),
  headphones: c("headphones", typeIs("Headphones - Music", "Headphones & Headsets", "Headphones")),
  drones: c("drones", typeIs("Camera Drone", "Camera Drones")),
  consoles: c("consoles", typeIs("Games Console")),
};
