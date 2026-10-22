import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { mpnFromBody, shopifyCategory } from "./jbhifi";

const BASE = "https://www.digidirect.com.au";
type Cat = Exclude<CategoryId, "phones">;
/** digiDirect SKUs are internal numbers; descriptions end with "MPN - XXXX". */
const opts = { mpn: (p: { body_html: string }) => mpnFromBody(p.body_html) };
const dd = (cat: Cat, collections: string[]) => () => shopifyCategory("digidirect", BASE, cat, collections, opts);

export const scrapers: Partial<Record<Cat, () => Promise<RawOffer[]>>> = {
  laptops: dd("laptops", ["notebooks", "gaming-laptops", "notebooks-surface"]),
  tablets: dd("tablets", ["tablets", "tablets-surface"]),
  monitors: dd("monitors", ["monitors"]),

  smartwatches: dd("smartwatches", ["smart-watches", "sports-watches", "wearables"]),
  desktops: dd("desktops", ["desktops", "desktop-pcs", "apple-desktops"]),
  printers: dd("printers", ["printer-and-scanners", "laser-printers", "large-format-printers"]),
  routers: dd("routers", ["wireless-routers"]),
  ssds: dd("ssds", ["solid-state-drives-ssd", "nvme-m-2"]),
  headphones: dd("headphones", ["headphones", "true-wireless-earbuds", "noise-cancelling-headphones", "over-ear-headphones", "in-ear-headphones", "on-ear-headphones"]),
  speakers: dd("speakers", ["speakers", "portable-bluetooth-speakers", "wireless-home-speakers", "party-speakers", "smart-speakers", "computer-speakers"]),
  consoles: dd("consoles", ["video-game-consoles"]),
  cameras: dd("cameras", ["mirrorless-cameras", "dslr-cameras", "compact-cameras", "action-cameras", "instant-cameras", "medium-format-cameras", "rangefinder-cameras", "waterproof-cameras"]),
  drones: dd("drones", ["drones-drones", "drones"]),
};
