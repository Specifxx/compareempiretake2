import { GREY_IMPORT } from "./normalize";
import type { Phone } from "./types";

/**
 * Whether an eBay listing's title is this product, shared by the daily eBay job (scripts/ebay-prices.ts, before it
 * stores a listing) and the catalogue loader (lib/catalog.ts, so a listing stored before a rule existed is not shown).
 * A wrong eBay row is worse than none: it reads as "eBay is $700 cheaper" (US shopper review, 2026-11-06).
 */

const legoSet = (p: Pick<Phone, "category" | "slug">) => (p.category === "lego" ? p.slug.match(/^lego-(\d{4,6})$/)?.[1] : undefined);

/** The words a listing title must contain: brand plus the model's distinctive tokens; for LEGO, the set number. */
export function mustHave(p: Pick<Phone, "category" | "slug" | "brand" | "model">): string[] {
  const set = legoSet(p);
  if (set) return ["lego", set];
  const words = `${p.brand} ${p.model}`
    .toLowerCase()
    .replace(/[^a-z0-9.+ ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !/^(the|and|with|for|in|of|inch|gb|tb|wi|fi|smart|new|edition)$/.test(w));
  return [...new Set(words)].slice(0, 6);
}

const norm = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9.+ ]/g, " ").replace(/\s+/g, " ")} `;
const esc = (s: string) => s.replace(/[.+]/g, "\\$&");

/**
 * Each required word as a whole word: "r10" is not in "r100", "a5" is not in "a57" (the Canon EOS R10 was priced
 * from an R100 listing until 2026-11-06). Phones and tablets: a title naming two or more storage sizes is a
 * multi-listing ("512GB/256GB/128GB"), whose price is the smallest one's, so it is no match.
 */
export function ebayTitleMatches(p: Pick<Phone, "category" | "slug" | "brand" | "model">, title: string): boolean {
  const t = norm(title);
  if (!mustHave(p).every((w) => new RegExp(`[^a-z0-9]${esc(w)}(?![a-z0-9])`).test(t))) return false;
  if (p.category === "phones" || p.category === "tablets") {
    if (GREY_IMPORT.test(title)) return false;
    const sizes = new Set([...title.matchAll(/(\d+)\s?(GB|TB)\b/gi)].map((m) => Number(m[1]) * (m[2].toUpperCase() === "TB" ? 1024 : 1)).filter((g) => g >= 32));
    if (sizes.size >= 2) return false;
  }
  return true;
}
