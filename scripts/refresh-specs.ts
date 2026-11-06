/**
 * Re-reads every product's specs from the store titles already in every data/.../catalog.json and lays the curated sheets
 * (data/specs/) over them, without an import: only `specs` changes. The daily build-catalog does the same from the
 * raw files, so this is for shipping a spec-reading fix or a new sheet the same day.
 *
 *   npx tsx scripts/refresh-specs.ts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { CATEGORIES } from "../src/lib/categories";
import { categorySpecs, codes } from "../src/lib/match";
import { dataPath, REGION_IDS } from "../src/lib/region";
import { ownTitles, phoneSpecs } from "../src/lib/specs";
import { withCurated } from "../src/lib/specs-curated";
import type { Catalog, CategoryId } from "../src/lib/types";

let changed = 0;
for (const region of REGION_IDS)
  for (const c of CATEGORIES) {
    const file = `${dataPath(region, c.id)}/catalog.json`;
    if (!existsSync(file)) continue;
    const text = readFileSync(file, "utf8");
    const cat = JSON.parse(text) as Catalog;
    const category = c.id as CategoryId;
    for (const p of cat.phones) {
      const titles = p.variants.flatMap((v) => v.offers.map((o) => o.title).filter((t): t is string => !!t));
      if (!titles.length) continue;
      const read = category === "phones" ? phoneSpecs(p.model, [...titles, ...(p.blurb ? [p.blurb] : [])]) : categorySpecs(category, ownTitles(titles, p.codes ?? codes(p.name), p.name));
      // The catalogue keeps cleaned titles and a trimmed blurb, not the raw listings the build read: a figure the
      // stored titles no longer state keeps the build's reading (a phone's chip from its full store description).
      const old = p.specs;
      const extra = [...(read.extra ?? [])];
      // Other categories store their full titles, so their readings stand as read.
      if (category === "phones") for (const [k, v] of old.extra ?? []) if (!extra.some(([x]) => x === k)) extra.push([k, v]);
      const merged = {
        ...read,
        screenInches: read.screenInches ?? old.screenInches,
        chip: read.chip ?? old.chip,
        mainCameraMp: read.mainCameraMp ?? old.mainCameraMp,
        batteryMah: read.batteryMah ?? old.batteryMah,
        esimOnly: read.esimOnly ?? old.esimOnly,
        extra: extra.length ? extra : undefined,
      };
      const next = withCurated({ category, brand: p.brand, model: p.model }, merged);
      for (const k of Object.keys(next) as (keyof typeof next)[]) if (next[k] === undefined) delete next[k];
      if (JSON.stringify(next) !== JSON.stringify(p.specs)) changed++;
      p.specs = next;
    }
    const out = JSON.stringify(cat) + (text.endsWith("\n") ? "\n" : "");
    if (out !== text) writeFileSync(file, out);
  }
console.log(`specs changed on ${changed} products`);
