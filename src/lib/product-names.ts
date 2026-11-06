import type { Phone } from "./types";

/**
 * Display tidying applied when the catalogue loads (lib/catalog.ts). Never the slug: a product's URL stays what the
 * import made it, so nothing here moves a page (DECISIONS.md, 2026-11-06 "US shopper review").
 */

/**
 * A store's own code or barcode tacked on after " - " ("Xbox Series S in Robot White - 196388421343",
 * "gram Pro … in Black - 17Z90U-H.AU87U1") comes off the name; search still finds it through `codes`. Also the
 * empty "+0GB SSD" some mini PC titles carry.
 */
export function tidyName(name: string): string {
  let n = name.replace(/\s*\+\s*0\s?GB\s+SSD\b/gi, "");
  const m = n.match(/^(.*\S)\s+[-–]\s+([A-Z0-9][A-Z0-9.\-/]{4,23})$/i);
  if (m && /\d/.test(m[2]) && !/\s/.test(m[2]) && m[1].split(/\s+/).length >= 2 && !/^\d{1,4}(gb|tb|mm|w|l|ml|hz)$/i.test(m[2])) n = m[1];
  return n.trim();
}

/** Legal-entity words that are not part of a brand: "LOGITECH INC.", "Final Audio USA", "Sigma UK Ltd". */
const CORPORATE = /(?:[\s,.]+(?:inc|ltd|llc|l\.l\.c|corp|corporation|co|gmbh|ag|plc|pty|limited|usa|us|uk|of|americas?|europe|international|na))+\.?$/i;
/** Distributors some stores (Focus Camera, Drone Nerds' feeds) put in the vendor field instead of the maker. */
const DISTRIBUTOR = /\b(distribution|distributing|distributors?|trading|imaging|digital storage|tech data|merchandise)\b/i;
/** What is left of a legal name once the entity words and a trailing "Imaging" go: "RICOH IMAGING AMERICAS CORPORATION" → "RICOH". */
const bareName = (b: string) => b.replace(/\s+c\/o\s+.*$/i, "").replace(CORPORATE, "").replace(/\s+imaging$/i, "").trim();
/** Spellings that are one maker. */
const ALIASES: Record<string, string> = { hewlettpackard: "hp", hpinc: "hp", leicacamera: "leica", insta: "insta360" };

const keyOf = (b: string) => {
  const k = bareName(b).toLowerCase().replace(/[^a-z0-9]/g, "");
  return ALIASES[k] ?? k;
};
const slug = (b: string) => b.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const shouty = (b: string) => b.length > 3 && b === b.toUpperCase() && /[A-Z]/.test(b);

/**
 * One spelling per brand in a region: a distributor or a legal name in the brand field gives way to the maker the
 * model names ("VITECH IMAGING DISTRIBUTION Nilox NX MINI-UP" → Nilox), then spellings that are the same brand once
 * case, punctuation and "Inc."/"Ltd" are set aside fold into the one most products use (mixed case wins a tie).
 * Mutates `brand` (and `name`, when it began with a distributor's name). Returns old brand slug → new brand slug
 * for every slug that stopped existing, so a brand page URL can redirect.
 */
export function foldBrands(all: Phone[]): Map<string, string> {
  const original = all.map((p) => slug(p.brand));
  const known = new Set(all.filter((p) => !CORPORATE.test(p.brand) && !DISTRIBUTOR.test(p.brand)).map((p) => keyOf(p.brand)));
  for (const p of all) {
    if (!CORPORATE.test(p.brand) && !DISTRIBUTOR.test(p.brand) && !/\sc\/o\s/i.test(p.brand)) continue;
    const bare = bareName(p.brand);
    const first = p.model.split(/\s+/)[0] ?? "";
    const other = /^[A-Za-z][A-Za-z0-9-]+$/.test(first) && !keyOf(bare).startsWith(keyOf(first)) && !keyOf(first).startsWith(keyOf(bare));
    // The model starts with another maker's name (any maker for a distributor; a maker the region already lists for
    // a legal name): that maker is the brand, and the name loses the distributor.
    if (other && (DISTRIBUTOR.test(p.brand) || known.has(keyOf(first)))) {
      if (p.name.toLowerCase().startsWith(p.brand.toLowerCase())) p.name = p.model;
      p.brand = first;
    } else {
      if (p.name.startsWith(`${p.brand} `)) p.name = `${bare} ${p.name.slice(p.brand.length + 1)}`;
      p.brand = bare || p.brand;
    }
  }
  const counts = new Map<string, Map<string, number>>();
  for (const p of all) {
    const k = keyOf(p.brand);
    const m = counts.get(k) ?? new Map<string, number>();
    m.set(p.brand, (m.get(p.brand) ?? 0) + 1);
    counts.set(k, m);
  }
  const pick = new Map<string, string>();
  // The commonest spelling; on a tie the alias's own name ("HP" over "Hewlett Packard"), then mixed case over capitals.
  const own = (b: string, k: string) => Number(b.replace(CORPORATE, "").toLowerCase().replace(/[^a-z0-9]/g, "") !== k);
  for (const [k, m] of counts) pick.set(k, [...m].sort((a, b) => b[1] - a[1] || own(a[0], k) - own(b[0], k) || Number(shouty(a[0])) - Number(shouty(b[0])) || a[0].localeCompare(b[0]))[0][0]);
  for (const p of all) {
    const to = pick.get(keyOf(p.brand))!;
    if (to === p.brand) continue;
    if (p.name.startsWith(`${p.brand} `)) p.name = `${to} ${p.name.slice(p.brand.length + 1)}`;
    p.brand = to;
  }
  const after = new Set(all.map((p) => slug(p.brand)));
  const moves = new Map<string, string>();
  all.forEach((p, i) => {
    if (!after.has(original[i]) && !moves.has(original[i])) moves.set(original[i], slug(p.brand));
  });
  return moves;
}
