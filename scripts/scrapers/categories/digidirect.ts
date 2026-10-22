import type { RawOffer } from "../../../src/lib/types";
import { mpnFromBody, shopifyCategory } from "./jbhifi";

const BASE = "https://www.digidirect.com.au";
/** digiDirect SKUs are internal numbers; descriptions end with "MPN - XXXX". */
const opts = { mpn: (p: { body_html: string }) => mpnFromBody(p.body_html) };

export const scrapers: Partial<Record<"laptops" | "tablets" | "monitors" | "graphics-cards", () => Promise<RawOffer[]>>> = {
  laptops: () => shopifyCategory("digidirect", BASE, "laptops", ["notebooks", "gaming-laptops", "notebooks-surface"], opts),
  tablets: () => shopifyCategory("digidirect", BASE, "tablets", ["tablets", "tablets-surface"], opts),
  monitors: () => shopifyCategory("digidirect", BASE, "monitors", ["monitors"], opts),
};
