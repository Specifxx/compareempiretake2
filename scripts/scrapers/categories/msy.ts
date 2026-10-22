/** MSY: same platform and category ids as Umart (sister store). */
import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { CATEGORY_PATHS, scrapeUmartLike } from "./umart";

type Cat = Exclude<CategoryId, "phones">;
const BASE = "https://www.msy.com.au";
export const scrapers: Partial<Record<Cat, () => Promise<RawOffer[]>>> = Object.fromEntries(
  (Object.keys(CATEGORY_PATHS) as Cat[]).map((c) => [c, () => scrapeUmartLike("msy", BASE, c)]),
);
