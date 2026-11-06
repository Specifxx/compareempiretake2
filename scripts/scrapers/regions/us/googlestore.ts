/** Google Store US: diagnostic pass (2026-11-06), replaced once the price data's shape is known. */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { get } from "../../../lib/http";

async function phones(): Promise<RawOffer[]> {
  const html = await get("https://store.google.com/us/config/pixel_10_pro?hl=en-US");
  const snips: string[] = [];
  const pats = [/"USD"/g, /\d{3,4}0{6}\b/g, /\$1,?199|\$999\b/g, /256 ?GB/g, /AF_initDataCallback\(\{key: '([^']+)'/g, /"price"/g, /GA0\d{4}-US/g];
  for (const re of pats) {
    let n = 0;
    for (const m of html.matchAll(re)) {
      if (n++ >= 3) break;
      const i = m.index ?? 0;
      snips.push(`[${re.source}] …${html.slice(Math.max(0, i - 200), i + 250).replace(/\s+/g, " ")}…`);
    }
    snips.push(`[${re.source}] total ${[...html.matchAll(re)].length}`);
  }
  throw new Error(`DIAG len=${html.length}\n${snips.join("\n")}`);
}

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = { phones };
