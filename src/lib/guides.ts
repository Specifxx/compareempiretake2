import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { getPhone, getProduct } from "./catalog";
import type { CategoryId } from "./types";

/**
 * Guides are markdown files in content/guides/. Front matter is a simple
 * `key: value` block between `---` lines. Prices are never typed into a guide:
 * shortcodes pull them from today's catalogue at build time (see GuideBody).
 */
export interface Guide {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  category: string;
  /** Which shelf of /guides it sits on (GUIDE_SECTIONS). */
  section: GuideSectionId;
  tags: string[];
  /** Leads the home page and /guides among guides of the same date. */
  featured?: boolean;
  /** Phone slug whose photo heads the guide. */
  hero?: string;
  readingMinutes: number;
  body: string;
}

export type GuideSectionId = "best" | "opinion" | "compare" | "stores" | "how-to" | "save";

/** The shelves of /guides, in order. Every guide names one in its front matter (`section:`). */
export const GUIDE_SECTIONS: { id: GuideSectionId; name: string; blurb: string }[] = [
  { id: "best", name: "Best picks", blurb: "What to buy at every budget, ranked from today's prices." },
  { id: "opinion", name: "Our take", blurb: "Opinion on the year's big launches, with the Australian prices that decide them." },
  { id: "compare", name: "Head to head", blurb: "Two or three products side by side, with each store's price." },
  { id: "stores", name: "Where to buy", blurb: "Which Australian stores are cheapest, worked out from every price we check." },
  { id: "how-to", name: "Buying guides", blurb: "The specs that matter, the ones that don't, and what to pay." },
  { id: "save", name: "Shop smarter", blurb: "Sales, price history, warranties and the tools that save you money." },
];

const isSection = (s: string | undefined): s is GuideSectionId => GUIDE_SECTIONS.some((x) => x.id === s);

/** The anchor id of a guide heading: "Today's lowest prices" → "todays-lowest-prices". */
export const headingId = (text: string) =>
  text
    .toLowerCase()
    .replace(/[\u2019']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** The guide's h2s, for its table of contents. */
export const guideToc = (g: Guide) =>
  [...g.body.matchAll(/^## (.+)$/gm)].map((m) => {
    const text = m[1].replace(/\*\*|__|`/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
    return { id: headingId(text), text };
  });

/** Guides on the same category first, then the same section, newest first within each. */
export function relatedGuides(g: Guide, n = 6): Guide[] {
  const score = (x: Guide) => (x.category === g.category ? 2 : 0) + (x.section === g.section ? 1 : 0) + (x.tags.some((t) => g.tags.includes(t)) ? 0.5 : 0);
  return getGuides()
    .filter((x) => x.slug !== g.slug)
    .map((x) => ({ x, s: score(x) }))
    .sort((a, b) => b.s - a.s || b.x.date.localeCompare(a.x.date))
    .slice(0, n)
    .map(({ x }) => x);
}

/** Guides for a category page's "Guides" block. */
export const guidesForCategory = (category: string, n = 6) => getGuides().filter((g) => g.category === category || g.tags.includes(`cat:${category}`)).slice(0, n);

const DIR = path.join(process.cwd(), "content/guides");

function parse(file: string): Guide {
  const raw = readFileSync(path.join(DIR, file), "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing front matter`);
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"(.*)"$/, "$1");
  }
  for (const k of ["title", "description", "date", "section"]) if (!meta[k]) throw new Error(`${file}: missing ${k}`);
  if (!isSection(meta.section)) throw new Error(`${file}: unknown section ${meta.section}`);
  const body = m[2].trim();
  return {
    slug: file.replace(/\.md$/, ""),
    title: meta.title,
    description: meta.description,
    date: meta.date,
    updated: meta.updated,
    category: meta.category ?? "phones",
    section: meta.section,
    tags: meta.tags ? meta.tags.split(",").map((t) => t.trim()) : [],
    hero: meta.hero,
    featured: meta.featured === "true",
    // Each live block (a table, a pick, a grid) reads like ~60 words.
    readingMinutes: Math.max(2, Math.round((body.replace(/^\[\[[^\]]+\]\]$/gm, "").split(/\s+/).length + 60 * (body.match(/^\[\[/gm)?.length ?? 0)) / 220)),
    body,
  };
}

let cache: Guide[] | null = null;
export function getGuides(): Guide[] {
  cache ??= readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map(parse)
    // Newest first; on the same day, a guide marked `featured: true` leads (the home page's big card).
    .sort((a, b) => b.date.localeCompare(a.date) || Number(!!b.featured) - Number(!!a.featured));
  return cache;
}

export const getGuide = (slug: string) => getGuides().find((g) => g.slug === slug);

/** The product whose photo heads a guide: `hero: apple-iphone-17` (a phone) or `hero: tvs/<slug>`. */
export function guideHero(g: Guide) {
  if (!g.hero) return undefined;
  return g.hero.includes("/") ? getProduct(g.hero.split("/")[0] as CategoryId, g.hero.split("/")[1]) : getPhone(g.hero);
}
