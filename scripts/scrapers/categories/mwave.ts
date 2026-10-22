import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { mpnFromCode, mpnFromTitle, shopifyCategory } from "./jbhifi";

const BASE = "https://www.mwave.com.au";

type Cat = Exclude<CategoryId, "phones">;
const none = { mpn: () => undefined };
/** Mwave SKUs (AC12345) are internal and the pages carry only a GTIN; the model code, when there is one, is in the title. */
const code = (loose: boolean) => ({ mpn: (p: { title: string }) => mpnFromCode(p.title, { loose }) });
const titled = { mpn: (p: { title: string }) => mpnFromCode(p.title) ?? mpnFromTitle(p.title) };

export const scrapers: Partial<Record<Cat, () => Promise<RawOffer[]>>> = {
  laptops: () => shopifyCategory("mwave", BASE, "laptops", ["laptops"], none),
  tablets: () => shopifyCategory("mwave", BASE, "tablets", ["tablets-and-e-readers", "apple-ipads", "android-tablets"], none),
  monitors: () => shopifyCategory("mwave", BASE, "monitors", ["monitors"], { mpn: (p) => mpnFromTitle(p.title) }),
  "graphics-cards": () => shopifyCategory("mwave", BASE, "graphics-cards", ["graphics-cards"], none),

  smartwatches: () => shopifyCategory("mwave", BASE, "smartwatches", ["smart-watches", "sports-watches"], code(false)),
  desktops: () => shopifyCategory("mwave", BASE, "desktops", ["desktop-computers"], code(false)),
  printers: () =>
    shopifyCategory("mwave", BASE, "printers", ["laser-printers", "laser-printers-multifunctions", "inkjet-printers", "inkjet-printers-multifunctions"], titled),
  routers: () =>
    shopifyCategory("mwave", BASE, "routers", ["modems-routers-gateways-wireless", "modems-routers-gateways-wired", "wireless-routers", "mesh-network"], code(true)),
  cpus: () => shopifyCategory("mwave", BASE, "cpus", ["cpu-processors"], code(false)),
  ssds: () => shopifyCategory("mwave", BASE, "ssds", ["solid-state-drives-ssd", "external-solid-state-drives-ssd"], code(true)),
  ram: () => shopifyCategory("mwave", BASE, "ram", ["memory"], code(true)),
  motherboards: () => shopifyCategory("mwave", BASE, "motherboards", ["motherboards"], code(false)),
  soundbars: () => shopifyCategory("mwave", BASE, "soundbars", ["speakers"], code(false)),
  headphones: () =>
    shopifyCategory("mwave", BASE, "headphones", ["headphones", "true-wireless-earbuds", "noise-cancelling-headphones", "in-ear-headphones", "gaming-headsets"], code(false)),
  speakers: () =>
    shopifyCategory("mwave", BASE, "speakers", ["speakers", "bluetooth-speakers-computers-and-mobile", "party-speakers", "smart-speakers"], code(false)),
  consoles: () => shopifyCategory("mwave", BASE, "consoles", ["video-game-consoles"], none),
  drones: () => shopifyCategory("mwave", BASE, "drones", ["drones"], none),
};
