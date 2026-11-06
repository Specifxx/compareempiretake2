/**
 * Small typo-tolerant matcher for phone names. Every query word must match a
 * word in the name by prefix, by containment, or within one edit, and
 * "s26u" style shorthand matches "S26 Ultra".
 */
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const ALIASES: Record<string, string> = {
  ip: "iphone",
  sammy: "samsung",
  samsung: "samsung galaxy",
  promax: "pro max",
  ultra: "ultra",
  pixel: "google pixel",
  moto: "motorola moto",
};

function within1(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    const diff = [...a].map((c, i) => (c === b[i] ? -1 : i)).filter((i) => i >= 0);
    if (diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]]) return true;
  }
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

const STORAGE = /^\d+(gb|tb)$/;

/** True when every place `w` occurs in `hay` is followed by, or preceded by, another digit: a different model number. */
function digitRunsOn(hay: string, w: string): boolean {
  for (let i = hay.indexOf(w); i >= 0; i = hay.indexOf(w, i + 1)) {
    const after = hay[i + w.length], before = hay[i - 1];
    if (!(after && /\d/.test(after)) && !(before && /\d/.test(before) && /^\d/.test(w))) return false;
  }
  return true;
}

export function searchScore(query: string, name: string): number {
  const q = norm(query)
    .replace(/\b([a-z]+)(\d+)([a-z]+)?\b/g, (_, a, n, b) => `${a}${n} ${b ?? ""}`)
    .split(" ")
    .filter(Boolean)
    .map((w) => (w === "u" ? "ultra" : w === "pm" ? "pro max" : ALIASES[w] && w.length <= 3 ? ALIASES[w] : w))
    .join(" ")
    .split(" ");
  const words = norm(name).split(" ");
  const joined = words.join("");
  let score = 0;
  for (const w of q) {
    // A model number is exact in its digits (owner, 2026-11-06: search by exact model numbers): "qn90" is not a
    // prefix of "qn900f", "5070" not of "50700", and no typo tolerance.
    const modelNo = /\d/.test(w) && w.length >= 2;
    let best = 0;
    for (const n of words) {
      if (n === w) best = Math.max(best, 4);
      else if (n.startsWith(w) && !(modelNo && /\d/.test(n[w.length]))) best = Math.max(best, 3);
      else if (!modelNo && w.length >= 4 && within1(w, n)) best = Math.max(best, 2);
      else if (w.length >= 3 && n.includes(w) && !(modelNo && digitRunsOn(n, w))) best = Math.max(best, 1.5);
    }
    if (!best && joined.includes(w) && !(modelNo && digitRunsOn(joined, w))) best = 1;
    // Names carry no storage ("iPhone 17 Pro 256GB" is the iPhone 17 Pro page, 256GB one of its variants), so a
    // capacity the name lacks is not a miss.
    if (!best && STORAGE.test(w)) continue;
    if (!best) return 0;
    score += best;
  }
  // Prefer shorter names: "iPhone 17" over "iPhone 17 Pro Max" for "iphone 17".
  return score - words.length * 0.05;
}

export function search<T extends { name: string }>(items: T[], query: string, limit = 50): T[] {
  if (!query.trim()) return items.slice(0, limit);
  return items
    .map((it) => ({ it, s: searchScore(query, it.name) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.it);
}
