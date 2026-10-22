/**
 * Turns a retailer's listing title into (brand, model, storage, colour) so the
 * same phone lines up across retailers. Retailers word titles differently:
 *
 *   JB Hi-Fi       Apple iPhone 17 Pro 256GB (Deep Blue)
 *   Harvey Norman  Apple iPhone 17 Pro 256GB - Deep Blue
 *   The Good Guys  Apple iPhone 17 Pro 256GB Deep Blue
 *   Mobileciti     Samsung Galaxy S26 5G (Dual Sim, 256GB/12GB, 6.3'', SM-S942B) - Black
 */

export interface ParsedTitle {
  brand: string;
  model: string;
  /** Lower-case alphanumeric key used to match the same model across retailers. */
  key: string;
  storageGb: number;
  colour: string;
}

const BRANDS: Record<string, string> = {
  apple: "Apple",
  samsung: "Samsung",
  google: "Google",
  oppo: "OPPO",
  motorola: "Motorola",
  nothing: "Nothing",
  cmf: "CMF",
  honor: "HONOR",
  xiaomi: "Xiaomi",
  redmi: "Xiaomi",
  poco: "Xiaomi",
  vivo: "vivo",
  tcl: "TCL",
  nokia: "Nokia",
  hmd: "HMD",
  asus: "ASUS",
  sony: "Sony",
  realme: "realme",
  zte: "ZTE",
  alcatel: "Alcatel",
  nubia: "nubia",
  fairphone: "Fairphone",
  oneplus: "OnePlus",
  doro: "Doro",
  opel: "Opel",
  aspera: "Aspera",
  uniden: "Uniden",
  blackview: "Blackview",
  huawei: "Huawei",
  meizu: "Meizu",
  infinix: "Infinix",
  tecno: "TECNO",
  ulefone: "Ulefone",
  doogee: "Doogee",
  oukitel: "Oukitel",
  cat: "CAT",
  kyocera: "Kyocera",
  iqoo: "iQOO",
  ruio: "RUIO",
  iqu: "IQU",
  cubot: "Cubot",
  unihertz: "Unihertz",
  "hmd global": "HMD",
  lenovo: "Lenovo",
  microsoft: "Microsoft",
  amazon: "Amazon",
};

const IMPLIED: [RegExp, string][] = [
  [/^iphone\b/i, "Apple"],
  [/^ipad\b/i, "Apple"],
  [/^surface\b/i, "Microsoft"],
  [/^galaxy\b/i, "Samsung"],
  [/^pixel\b/i, "Google"],
  [/^(moto|razr)\b/i, "Motorola"],
];

/**
 * With allowNoStorage, a title without a GB/TB figure parses with storageGb 0:
 * the store's "from" price, which the catalogue pins to the base model.
 */
export function parseTitle(raw: string, opts: { allowNoStorage?: boolean } = {}): ParsedTitle | null {
  let t = raw
    .replace(/[  ]/g, " ")
    .replace(/[’‘`]/g, "'")
    .replace(/''|"|”|“/g, '"')
    .replace(/\[[^\]]*\]/g, " ")
    // Screen sizes and panel types some stores put in the name: 6.7", 6.6in, 6.5-inch, FHD AMOLED.
    .replace(/(^|\s)\d{1,2}\.\d{1,2}\s?(?:''|"|”|’’|in\b|-?\s?inch(?:es)?\b)/gi, " ")
    .replace(/\b(?:FHD\+?|HD\+?|AMOLED|OLED|LCD)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Storage: the largest GB/TB figure (the others are RAM).
  let storageGb = 0;
  for (const m of t.matchAll(/(\d+(?:\.\d+)?)\s?(GB|TB)\b/gi)) {
    const gb = Number(m[1]) * (m[2].toUpperCase() === "TB" ? 1024 : 1);
    if (gb > storageGb) storageGb = gb;
  }
  if (storageGb < 8 && !(opts.allowNoStorage && storageGb === 0)) return null;
  // "Samsung Google Pixel 10" — a store prefixed the wrong maker.
  t = t.replace(/^(\w+)\s+(?=(Apple|Samsung|Google|OPPO|Motorola|HONOR|Xiaomi|Nokia|TCL|Nothing)\b)/i, (m, w) => (BRANDS[w.toLowerCase()] ? "" : m));

  // Colour: after " - ", else a trailing "(Colour)", else whatever follows the storage.
  let colour = "";
  const dash = t.match(/\s[-–]\s([^()\-–]+)$/);
  if (dash) {
    colour = dash[1];
    t = t.slice(0, dash.index);
  } else {
    const paren = t.match(/\(([^()]+)\)\s*$/);
    if (paren && !/\d\s?(GB|TB)/i.test(paren[1])) {
      colour = paren[1];
      t = t.slice(0, paren.index);
    } else {
      const after = t.match(/\d\s?(?:GB|TB)\b\s*(?:RAM\b\s*)?(?:5G\s*|4G\s*(?:LTE\s*)?)?([A-Za-z][^()]*)$/i);
      if (after && !/\d\s?(GB|TB)/i.test(after[1])) {
        colour = after[1];
        t = t.slice(0, t.length - after[1].length);
      }
    }
  }

  // Model: everything before the first spec token. "Phone (3a)" is a model name, not a spec list.
  t = t.replace(/\bPhone \((\w+)\)/i, "Phone ⟨$1⟩");
  const cut = t.search(/\s\(|\s(?:\d+\/)?\d+(?:\.\d+)?\s?(?:GB|TB)\b|\s(?:5G|4G)\b|,/i);
  let model = (cut > 0 ? t.slice(0, cut) : t).replace(/⟨(\w+)⟩/, "($1)").trim();
  model = model
    .replace(/\+\s*Plus\b/i, "+")
    .replace(/\b(Dual Sim|LTE|Unlocked|AU Version|Global Version|Rugged|Tough Phone|Smart ?phone)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  let brand = "";
  const first = model.split(" ")[0].toLowerCase();
  if (BRANDS[first]) {
    brand = BRANDS[first];
    if (first !== "redmi" && first !== "poco") model = model.slice(first.length).trim();
  } else {
    for (const [re, b] of IMPLIED) if (re.test(model)) brand = b;
  }
  if (!brand || !model) return null;

  // Motorola names its range "moto g56" in some shops and "g56" in others.
  if (brand === "Motorola") model = model.replace(/^moto\s+(?=[a-z]\d)/i, "moto ").replace(/^(?=[gebs]\d{2}\b)/i, "moto ");
  if (brand === "HONOR") model = model.replace(/^Magic\s+(\d)/i, "Magic$1").replace(/^(Magic V\d+) Fold$/i, "$1");
  if (brand === "Samsung") model = model.replace(/^(Galaxy\s+)+/i, "").replace(/\bGalaxy\s+/gi, "").replace(/^/, "Galaxy ");
  if (brand === "Google" && !/^Pixel\b/i.test(model)) model = `Pixel ${model}`;

  colour = tidyColour(colour);
  const key = `${brand} ${model}`
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, "");
  return { brand, model, key, storageGb, colour };
}

function tidyColour(c: string): string {
  return c
    .replace(/\b(eSIM Only|Dual Sim|5G|4G|LTE)\b/gi, "")
    .replace(/[()[\],]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

export function storageLabel(gb: number): string {
  return gb >= 1024 ? `${gb / 1024}TB` : `${gb}GB`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\+/g, "-plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
