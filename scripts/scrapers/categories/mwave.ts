import type { RawOffer } from "../../../src/lib/types";
import { mpnFromTitle, shopifyCategory } from "./jbhifi";

const BASE = "https://www.mwave.com.au";

/** Mwave SKUs (AC12345) are internal; monitor titles usually carry the model code. */
export const scrapers: Partial<Record<"laptops" | "tablets" | "monitors" | "graphics-cards", () => Promise<RawOffer[]>>> = {
  laptops: () => shopifyCategory("mwave", BASE, "laptops", ["laptops"], { mpn: () => undefined }),
  tablets: () => shopifyCategory("mwave", BASE, "tablets", ["tablets-and-e-readers", "apple-ipads", "android-tablets"], { mpn: () => undefined }),
  monitors: () => shopifyCategory("mwave", BASE, "monitors", ["monitors"], { mpn: (p) => mpnFromTitle(p.title) }),
  "graphics-cards": () => shopifyCategory("mwave", BASE, "graphics-cards", ["graphics-cards"], { mpn: () => undefined }),
};
