#!/usr/bin/env node
/**
 * Runs after `next build` (package.json "build"): lists the largest prerendered outputs in
 * .next/server/app (pages' .html and .rsc, route handlers' .body) and fails the build when one nears
 * Vercel's 20 MB limit for a prerendered response, which Vercel otherwise reports only by refusing the
 * production deploy ("ISR page compare is 20.11 MB ... FALLBACK_BODY_TOO_LARGE", DECISIONS.md
 * 2026-10-26). Outputs past the warning sizes are printed so a growing one is seen long before that.
 *
 *   node scripts/check-prerender-size.mjs [dir]
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const MB = 1_000_000;
/** Fail: a quarter under Vercel's limit, which it measured as slightly more than the file's own size. */
export const FAIL_BYTES = 15 * MB;
/** Warn: a page should stay well under 1 MB of HTML; a data body or RSC payload under 2 MB. */
export const WARN_BYTES = { ".html": 1 * MB, ".rsc": 2 * MB, ".body": 2 * MB };

/** Every .html, .rsc and .body file under `dir`, largest first. */
export function outputs(dir) {
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = path.join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (path.extname(name) in WARN_BYTES) out.push({ file: path.relative(dir, p).split(path.sep).join("/"), bytes: st.size });
    }
  };
  walk(dir);
  return out.sort((a, b) => b.bytes - a.bytes);
}

/** The verdict on a list of outputs: which ones fail the build and which ones only warn. */
export function judge(files, fail = FAIL_BYTES, warn = WARN_BYTES) {
  return {
    failures: files.filter((f) => f.bytes > fail),
    warnings: files.filter((f) => f.bytes <= fail && f.bytes > warn[path.extname(f.file)]),
  };
}

const fmt = (n) => `${(n / MB).toFixed(2).padStart(6)} MB`;

function main() {
  const dir = path.resolve(process.argv[2] ?? ".next/server/app");
  if (!existsSync(dir)) {
    console.warn(`check-prerender-size: ${dir} does not exist; nothing to check.`);
    return 0;
  }
  const files = outputs(dir);
  const { failures, warnings } = judge(files);
  console.log(`Largest prerendered outputs (${files.length} files in ${path.relative(process.cwd(), dir) || dir}):`);
  for (const f of files.slice(0, 15)) console.log(`  ${fmt(f.bytes)}  ${f.file}`);
  for (const f of warnings) console.warn(`warning: ${f.file} is ${fmt(f.bytes).trim()} (over ${fmt(WARN_BYTES[path.extname(f.file)]).trim()}).`);
  for (const f of failures)
    console.error(`error: ${f.file} is ${fmt(f.bytes).trim()}, near Vercel's 20 MB limit for a prerendered response (fail above ${fmt(FAIL_BYTES).trim()}). Send the browser less (DECISIONS.md, 2026-10-26).`);
  return failures.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exitCode = main();
