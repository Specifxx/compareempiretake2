import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

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
  tags: string[];
  /** Phone slug whose photo heads the guide. */
  hero?: string;
  readingMinutes: number;
  body: string;
}

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
  for (const k of ["title", "description", "date"]) if (!meta[k]) throw new Error(`${file}: missing ${k}`);
  const body = m[2].trim();
  return {
    slug: file.replace(/\.md$/, ""),
    title: meta.title,
    description: meta.description,
    date: meta.date,
    updated: meta.updated,
    category: meta.category ?? "phones",
    tags: meta.tags ? meta.tags.split(",").map((t) => t.trim()) : [],
    hero: meta.hero,
    readingMinutes: Math.max(2, Math.round(body.split(/\s+/).length / 220)),
    body,
  };
}

let cache: Guide[] | null = null;
export function getGuides(): Guide[] {
  cache ??= readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map(parse)
    .sort((a, b) => b.date.localeCompare(a.date));
  return cache;
}

export const getGuide = (slug: string) => getGuides().find((g) => g.slug === slug);
