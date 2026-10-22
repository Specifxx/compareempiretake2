import type { RawOffer } from "../../../src/lib/types";
import { mpnFromBody, mpnFromTitle, shopifyCategory } from "./jbhifi";

const BASE = "https://www.betta.com.au";
/** Betta SKUs are internal six-digit numbers. */
const body = { mpn: (p: { body_html: string }) => mpnFromBody(p.body_html) };

export const scrapers: Partial<Record<"tvs" | "laptops" | "tablets" | "monitors", () => Promise<RawOffer[]>>> = {
  tvs: () => shopifyCategory("betta", BASE, "tvs", ["tvs"], body),
  laptops: () => shopifyCategory("betta", BASE, "laptops", ["laptop-computers"], body),
  tablets: () => shopifyCategory("betta", BASE, "tablets", ["tablet-computers", "ipad"], body),
  monitors: () => shopifyCategory("betta", BASE, "monitors", ["monitors"], { mpn: (p) => mpnFromBody(p.body_html) ?? mpnFromTitle(p.title) }),
};
