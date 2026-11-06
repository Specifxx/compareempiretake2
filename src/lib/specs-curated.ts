import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { CategoryId, Phone, Specs } from "./types";

// ---- Curated spec sheets ----

/**
 * data/specs/<category>.json: { "<Brand>|<Model>": { screenInches, chip, mainCameraMp, batteryMah, extra?, source } },
 * taken from the maker's spec page or the model's Wikipedia infobox (the `source` URL says which). A product takes the
 * entry whose model is the longest word-prefix of its own model, so colour and edition suffixes ("Galaxy S26 Ultra
 * Enterprise Edition Black") still find it, and never one followed by a model word ("iPhone 16" for "iPhone 16 Plus").
 * Curated values beat what titles say: a store title can be wrong, the maker's sheet isn't.
 */
type Sheet = Partial<Pick<Specs, "screenInches" | "chip" | "mainCameraMp" | "batteryMah">> & { extra?: [string, string][]; source?: string };
const sheets = new Map<CategoryId, { brand: string; key: string; sheet: Sheet }[]>();
const norm = (s: string) =>
  s.toLowerCase().replace(/\bmoto\s+edge\b/, "edge").replace(/\bgalaxy\s+fold/, "galaxy z fold").replace(/\+/g, " plus ").split(/[^a-z0-9]+/).filter(Boolean);
const compact = (s: string) => norm(s).join("");
/** Words that make another model when they follow a model name: "iPhone 16" + "Plus", "Pixel 9" + "a". */
const MODEL_WORDS = new Set("pro max ultra plus fe lite edge fold flip mini neo power fusion xl se nxtpaper enterprise".split(" "));

function loadSheets(category: CategoryId) {
  let s = sheets.get(category);
  if (s) return s;
  const file = path.join(process.cwd(), "data", "specs", `${category}.json`);
  const raw = existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Record<string, Sheet>) : {};
  s = Object.entries(raw)
    .filter(([k]) => !k.startsWith("_"))
    .map(([k, sheet]) => {
      const [brand, model] = k.split("|");
      return { brand: brand.toLowerCase(), key: compact(model), sheet };
    })
    .sort((a, b) => b.key.length - a.key.length);
  sheets.set(category, s);
  return s;
}

export function curatedSheet(p: Pick<Phone, "category" | "brand" | "model">): Sheet | undefined {
  const words = norm(p.model);
  const brand = p.brand.toLowerCase();
  for (const e of loadSheets(p.category)) {
    if (e.brand !== brand) continue;
    // The entry's model must be a whole-word prefix of the product's ("Galaxy Z Flip 7" = "Galaxy Z Flip7").
    let joined = "";
    let i = 0;
    while (i < words.length && joined.length < e.key.length) joined += words[i++];
    if (joined !== e.key) continue;
    const next = words[i];
    // "Enterprise Edition" is the same phone; "Plus", "a", a number are another model.
    if (next && next !== "enterprise" && (MODEL_WORDS.has(next) || /^[a-z]$|^\d|^[a-z]\d/.test(next))) continue;
    return e.sheet;
  }
  return undefined;
}

/** Title-read specs with the curated sheet laid over them. */
export function withCurated(p: Pick<Phone, "category" | "brand" | "model">, specs: Specs): Specs {
  const c = curatedSheet(p);
  if (!c) return specs;
  const out: Specs = { ...specs };
  if (c.screenInches) out.screenInches = c.screenInches;
  if (c.chip) out.chip = c.chip;
  if (c.mainCameraMp) out.mainCameraMp = c.mainCameraMp;
  if (c.batteryMah) out.batteryMah = c.batteryMah;
  if (c.extra?.length) {
    const extra = [...(out.extra ?? [])];
    for (const [k, v] of c.extra) {
      const i = extra.findIndex(([x]) => x === k);
      if (i >= 0) extra[i] = [k, v];
      else extra.push([k, v]);
    }
    out.extra = extra;
  }
  return out;
}

