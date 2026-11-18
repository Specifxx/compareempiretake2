import "server-only";
// The product pages Search Console shows people finding (2026-11-19, core-update quality pass): data/focus/demand.json,
// refreshed daily by scripts/focus-catalog.ts from the `demand` branch (a click or 10+ impressions in 56 days). A found
// two-store page keeps asking to be indexed (lib/indexing.ts productIndexable). A missing file means none found.
import { readFileSync } from "node:fs";
import path from "node:path";
import { productHref } from "./catalog";
import type { Phone } from "./types";

let paths: Set<string> | null = null;
export function productFound(p: Phone): boolean {
  if (!paths) {
    try {
      paths = new Set((JSON.parse(readFileSync(path.join(process.cwd(), "data/focus/demand.json"), "utf8")) as { paths?: string[] }).paths ?? []);
    } catch {
      paths = new Set();
    }
  }
  return paths.has(productHref(p));
}
