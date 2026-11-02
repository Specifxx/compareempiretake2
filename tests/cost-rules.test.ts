import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import robots from "../src/app/robots";

// Vercel cost rules (owner, 2026-11-02: spend capped at $5–6 a day across the sites).

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(n) ? [p] : [];
  });

test("every next/link has prefetch={false}: a prefetched product page is an uncached server render", () => {
  for (const f of files("src")) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/<Link\b[^>]*>/g)) assert.match(m[0], /prefetch=\{false\}/, `${f}: ${m[0].slice(0, 80)}`);
  }
});

test("robots: query-string URLs are not crawled, share images and Next's assets are", () => {
  const rules = [robots().rules].flat();
  const all = rules.find((r) => r.userAgent === "*")!;
  assert.ok([all.disallow].flat().includes("/*?"));
  for (const a of ["/_next/", "/og"]) assert.ok([all.allow].flat().includes(a), a);
  const blocked = rules.find((r) => Array.isArray(r.userAgent))!;
  for (const b of ["Bytespider", "MJ12bot", "PetalBot"]) assert.ok((blocked.userAgent as string[]).includes(b), b);
});
