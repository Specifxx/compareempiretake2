/**
 * Matching for categories beyond phones. Each parser turns a store listing
 * into a group key (same key = same product at different stores) plus the
 * variant shoppers choose between.
 *
 * The rule throughout: when unsure, keep listings apart. A product shown twice
 * is a small annoyance; the wrong product's price next to yours is the thing
 * comparison sites get wrong and lose trust over.
 */
import { parseTitle, storageLabel } from "./normalize";
import { isMoreAccessory, MORE_CATEGORIES, moreSpecs, parseMore } from "./match-more";
import type { CategoryId, RawOffer, Specs } from "./types";

export interface Parsed {
  brand: string;
  /** Display name without the brand. */
  model: string;
  key: string;
  variant: { id: string; label: string; storageGb: number };
  colour: string;
  /** Model code used for the key, kept so near-identical codes can be merged later. */
  code?: string;
  /** Size, for TVs/monitors, so codes only merge within one size. */
  size?: number;
  /**
   * A spec that must agree within a group: monitor refresh rate, a laptop's
   * CPU/GPU/RAM/SSD. If stores in one group disagree, the group is split.
   * Empty means the listing doesn't say.
   */
  discriminator?: string;
}

const BRANDS: Record<string, string> = Object.fromEntries(
  [
    "Apple", "Samsung", "LG", "Sony", "TCL", "Hisense", "Panasonic", "Philips", "Sharp", "Toshiba", "Xiaomi", "Kogan",
    "Dell", "HP", "Lenovo", "ASUS", "Acer", "MSI", "Gigabyte", "AORUS", "Microsoft", "Razer", "Huawei", "Dynabook",
    "Alienware", "AOC", "BenQ", "ViewSonic", "Corsair", "Cooler Master", "Zotac", "Sapphire", "PowerColor", "XFX",
    "Palit", "Gainward", "PNY", "Inno3D", "ASRock", "Galax", "Colorful", "Intel", "NVIDIA", "AMD", "OPPO", "OnePlus",
    "Google", "Amazon", "Alcatel", "Nokia", "Infinix", "Framework", "Chuwi", "Gigabyte", "Iiyama", "Eizo", "InnoCN",
    "Viewsonic", "Kensington", "Metz", "Bauhn", "Linsar", "JVC", "Hitachi", "Westinghouse", "Polaroid", "Teac", "Cello",
    // Audio, wearables, gaming, cameras, PC parts, networking, printers, home
    "Bose", "JBL", "Sonos", "Beats", "Sennheiser", "Jabra", "Marshall", "Ultimate Ears", "Bang & Olufsen", "Audio-Technica",
    "Skullcandy", "Nothing", "Garmin", "Fitbit", "Polar", "Suunto", "Coros", "Amazfit", "Nintendo", "Valve", "Canon", "Nikon",
    "Fujifilm", "OM System", "Olympus", "GoPro", "Insta360", "DJI", "Roborock", "Dreame", "Ecovacs", "iRobot", "Eufy", "Narwal",
    "Epson", "Brother", "TP-Link", "Netgear", "Linksys", "Eero", "Ubiquiti", "D-Link", "Crucial", "Kingston", "WD",
    "Western Digital", "Seagate", "SanDisk", "Lexar", "TeamGroup", "Team", "G.Skill", "ADATA", "XPG", "Patriot", "Klevv",
    "Yamaha", "Denon", "Polk", "Klipsch", "Harman Kardon", "Soundcore", "Anker", "Logitech", "Shokz", "Bowers & Wilkins",
    "Edifier", "Creative", "SteelSeries", "HyperX", "Turtle Beach", "Fiio", "Moondrop", "Withings", "Oura", "Whoop",
    // Appliances
    "Dyson", "Shark", "Ninja", "Breville", "De'Longhi", "Delonghi", "Nespresso", "Jura", "Sunbeam", "Kambrook", "Russell Hobbs",
    "Tefal", "Kenwood", "KitchenAid", "Smeg", "Philips", "Instant", "Cuisinart", "Morphy Richards", "Tineco", "Vax", "Hoover",
    "Bissell", "Miele", "Bosch", "Electrolux", "AEG", "Fisher & Paykel", "Haier", "Beko", "Midea", "Whirlpool", "Kelvinator",
    "Simpson", "Chiq", "Euromaid", "Asko", "Westinghouse", "Mitsubishi Electric", "Hitachi", "Siemens", "Neff", "Liebherr",
    "Gaggia", "Rancilio", "Lelit", "Sage", "Lavazza", "Melitta", "Krups", "Rommelsbacher", "Kogan", "Heller", "Devanti",
    "Omega", "Inalto", "Artusi", "Solt", "Teka", "Stirling", "Vitamix", "Nutribullet", "Black+Decker", "Black & Decker", "Ryobi",
    "Makita", "Karcher", "Kärcher", "Wertheim", "Swan", "Lenoxx", "Healthy Choice", "Salter", "Cosori", "Crofton", "Anko",
  ].map((b) => [b.toLowerCase(), b]),
);
BRANDS.viewsonic = "ViewSonic";
BRANDS.aorus = "Gigabyte";
BRANDS["western digital"] = "WD";
BRANDS.wd_black = "WD";
BRANDS.team = "TeamGroup";
BRANDS.olympus = "OM System";
BRANDS.delonghi = "De'Longhi";
BRANDS["de'longhi"] = "De'Longhi";
BRANDS["fisher&paykel"] = "Fisher & Paykel";
BRANDS["fisher and paykel"] = "Fisher & Paykel";
BRANDS["black & decker"] = "Black+Decker";
BRANDS.kärcher = "Karcher";

/** Sub-brands that imply the maker. */
const IMPLIED: [RegExp, string][] = [
  [/\b(ipad|macbook|imac|studio display)\b/i, "Apple"],
  [/\bsurface\b/i, "Microsoft"],
  [/\b(galaxy (tab|book)|odyssey|viewfinity|smart monitor)\b/i, "Samsung"],
  [/\b(rog|tuf|zenbook|vivobook|proart)\b/i, "ASUS"],
  [/\b(legion|thinkpad|ideapad|yoga|thinkbook|lenovo tab)\b/i, "Lenovo"],
  [/\b(omen|victus|pavilion|envy|elitebook|probook|spectre)\b/i, "HP"],
  [/\b(predator|nitro|aspire|swift|chromebook spin)\b/i, "Acer"],
  [/\b(xps|inspiron|latitude|vostro)\b/i, "Dell"],
  [/\b(bravia)\b/i, "Sony"],
  [/\b(redmi pad|xiaomi pad)\b/i, "Xiaomi"],
  [/\b(airpods|homepod|apple watch|mac mini|mac studio)\b/i, "Apple"],
  [/\b(galaxy (watch|buds|ring))\b/i, "Samsung"],
  [/\b(pixel (watch|buds))\b/i, "Google"],
  [/\b(playstation|ps5|dualsense)\b/i, "Sony"],
  [/\b(xbox)\b/i, "Microsoft"],
  [/\b(switch 2|nintendo switch)\b/i, "Nintendo"],
  [/\b(steam deck)\b/i, "Valve"],
  [/\b(ecotank|workforce)\b/i, "Epson"],
  [/\b(pixma|eos|powershot)\b/i, "Canon"],
  [/\b(wd_?black|wd blue|wd red)\b/i, "WD"],
  [/\b(trident z|ripjaws)\b/i, "G.Skill"],
  [/\b(vengeance|dominator)\b/i, "Corsair"],
  [/\b(fury beast|fury renegade)\b/i, "Kingston"],
  [/\b(ryzen|athlon|threadripper)\b/i, "AMD"],
  [/\b(core ultra|core i[3579])\b/i, "Intel"],
  [/\b(roomba)\b/i, "iRobot"],
  [/\b(deebot)\b/i, "Ecovacs"],
  [/\b(gopro|hero1\d)\b/i, "GoPro"],
  [/\b(osmo|mavic|avata)\b/i, "DJI"],
];

const ACCESSORY =
  /\b(case|cover|sleeve|folio|keyboard (cover|folio)|stylus|pencil|screen protector|tempered glass|stand|mount|bracket|arm|cable|adapter|dock|docking|charger|bag|backpack|riser|backplate|remote|soundbar|projector|webcam)\b/i;
const SECOND_HAND = /\b(refurb\w*|renewed|pre-?owned|open box|ex-?demo|b-?grade|second hand|used|as new)\b/i;

export function isProduct(title: string): boolean {
  return !ACCESSORY.test(title) && !SECOND_HAND.test(title);
}

function brandOf(o: RawOffer, title: string): string | undefined {
  const fromStore = o.brand?.trim().toLowerCase();
  if (fromStore && BRANDS[fromStore]) return BRANDS[fromStore];
  const words = title.toLowerCase().split(/\s+/);
  for (const n of [3, 2, 1]) {
    const w = words.slice(0, n).join(" ");
    if (BRANDS[w]) return BRANDS[w];
  }
  for (const [re, b] of IMPLIED) if (re.test(title)) return b;
  return fromStore ? o.brand!.trim().replace(/\b\w/g, (c) => c.toUpperCase()) : undefined;
}

const clean = (s: string) =>
  s
    .replace(/[  ]/g, " ")
    .replace(/[’‘`]/g, "'")
    .replace(/[”“″]|''/g, '"')
    .replace(/\s+/g, " ")
    .trim();

/** Alphanumeric model-code-looking tokens: QN90F, U2724D, OLED65C5PSA, X1404VA-EB001W. */
const NOISE_CODE =
  /^(\d+(gb|tb|hz|k|p|w|mah|nits|ms|mm|cm|in|th|nd|rd|st)|[48]k|uhd|fhd|qhd|wqhd|hdr\d*|hdmi\d*(\.\d)?|usb\d*|wi-?fi\d*|\d{4}|gen\d+|ddr\d\w*|gddr\d\w*|lpddr\d\w*|pcie\d*|ps5|g-?sync|v\d|x\d{1,2}|\d+x\d+|m\.2|nvme|ssd|oc|ai|5g|4g|lte|win1[01]|w1[01]h|i[3579]-\d{4,5}\w*|r[3579]-\d{4}\w*|\d-in-\d|area-?51|wi-?fi-?\d\w*|[a-z]?\d{1,2}-\d{3,5}[a-z]{0,3}|\d{3,5}(hx|hs|h|u|v|k|ks|kf|x3d)|w11[hp]?|rtx\d{4}\w*)$/i;
export function codes(title: string): string[] {
  const out: string[] = [];
  for (const raw of title.split(/[\s(),/[\]]+/)) {
    const t = raw.replace(/^[-–.]+|[-–.:;]+$/g, "");
    if (t.length < 2 || t.length > 20) continue;
    if (!/\d/.test(t) || !/[a-z]/i.test(t)) continue;
    if (NOISE_CODE.test(t)) continue;
    out.push(t.toUpperCase());
  }
  return out;
}

const keyOf = (...parts: (string | number | undefined)[]) =>
  parts
    .filter((p) => p !== undefined && p !== "")
    .join(" ")
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, "");

const sizeOf = (t: string) => {
  const m = t.match(/(\d{2,3}(?:\.\d)?)\s?(?:"|-?\s?inch(?:es)?\b|in\b|”)/i);
  return m ? Number(m[1]) : undefined;
};

const STD = { id: "std", label: "Standard", storageGb: 0 };

/** A readable name: the store's title minus brand, codes in brackets and marketing noise. */
function displayName(title: string, brand: string): string {
  return clean(title)
    .replace(new RegExp(`^${brand}\\s+`, "i"), "")
    .replace(/\s*[\[(][A-Z0-9/\-]{6,}[\])]\s*$/i, "")
    .replace(/\s+-\s+[A-Z0-9/\-]{8,}$/i, "")
    .replace(/\b(Smart TV|Google TV|Television|Gaming Monitor|Monitor|Graphics Card|Video Card|Laptop|Notebook)\b/gi, (m) => m)
    .trim();
}

// ---- Tablets: like phones (storage variants) plus connectivity and chip ----

const IPAD_MINI_CHIP: Record<string, string> = { "6": "A15", "7": "A17 Pro" };

function parseTablet(o: RawOffer): Parsed | null {
  const t0 = clean(o.title);
  const cellular = /\b(cellular|5g|lte|4g)\b/i.test(t0);
  // Apple chips only: "A11" in "Galaxy Tab A11+" is a model name, not a chip.
  const isApple = /\b(apple|ipad)\b/i.test(t0);
  const chip = isApple ? t0.match(/\(?\b(M\d(?: (?:Pro|Max))?|A\d{2}(?: Pro)?)\b(?: chip)?\)?/)?.[1] : undefined;
  const gen = t0.match(/\(?(\d{1,2})(?:st|nd|rd|th) gen(?:eration)?\)?/i)?.[1];
  const size = t0.match(/(\d{1,2}(?:\.\d)?)[- ]?(?:-inch|inch|in\b|"|”)/i)?.[1];
  const t = (isApple ? t0.replace(/\(?\b(M\d(?: (?:Pro|Max))?|A\d{2}(?: Pro)?)\b(?: chip)?\)?/, " ") : t0)
    .replace(/\(?\d{1,2}(?:st|nd|rd|th) gen(?:eration)?\)?/i, " ")
    .replace(/\d{1,2}(?:\.\d)?[- ]?(?:-inch|inch|in\b|"|”)/i, " ")
    .replace(/\b(wi-?fi(?:\s*\+\s*cellular)?|cellular|5g|lte|4g)\b/gi, " ")
    .replace(/\(\s*\)/g, " ");
  const isMini = isApple && /\bipad mini\b/i.test(t0);
  const p = parseTitle(isMini ? t.replace(/\b8\.3\b/, " ") : t);
  if (!p) return null;
  const brand = brandOf(o, t0) ?? p.brand;
  // iPad mini is 8.3" in every generation stores sell, and stores name one model by generation or by chip, so
  // size and naming split it into several pages that compete for "ipad mini" (Search Console, 2026-10-27). One
  // model, one page: no size, and the generation as Apple's chip (6th gen A15, 7th gen A17 Pro).
  const mini = isMini;
  const sz = mini ? undefined : size;
  const ch = chip ?? (mini && gen ? IPAD_MINI_CHIP[gen] : undefined);
  const base = p.model.replace(/(?:\s+with)?[\s-]+$|\s+with$/i, "");
  const model = [base, sz ? `${sz}"` : "", ch ? `(${ch})` : gen ? `(${gen}th gen)` : ""].filter(Boolean).join(" ");
  const conn = cellular ? "cellular" : "wifi";
  return {
    brand,
    model,
    key: keyOf(brand, base, sz, ch ?? (gen ? `gen${gen}` : "")),
    variant: { id: `${storageLabel(p.storageGb).toLowerCase()}-${conn}`, label: `${storageLabel(p.storageGb)} · ${cellular ? "Wi-Fi + Cellular" : "Wi-Fi"}`, storageGb: p.storageGb },
    colour: p.colour,
  };
}

// ---- TVs and monitors: brand + size + model code ----

function parseScreen(o: RawOffer, category: "tvs" | "monitors"): Parsed | null {
  const t = clean(o.title);
  const brand = brandOf(o, t);
  if (!brand) return null;
  const size = sizeOf(t);
  if (!size || (category === "tvs" && (size < 24 || size > 120)) || (category === "monitors" && (size < 13 || size > 57))) return null;
  const cs = codes(`${t} ${o.mpn ?? ""}`).filter((c) => c !== String(size));
  // The series code (QN90F, C5, U2724D) is the shortest code; a full part number contains it.
  const strong = cs.filter((c) => (category === "tvs" ? c.length >= 2 : c.length >= 4 && (c.match(/\d/g)?.length ?? 0) >= 2));
  const code = strong.sort((a, b) => a.length - b.length)[0]?.replace(/-[A-Z]$/, "");
  const model = displayName(t, brand);
  return {
    brand,
    model,
    // Size is always part of the key: one model code can cover 24", 27" and 32" panels.
    key: code ? keyOf(brand, Math.round(size), code) : keyOf(brand, Math.round(size), ...bag(t, brand)),
    variant: STD,
    colour: "",
    code,
    size,
    discriminator: category === "monitors" ? maxHz(t) : undefined,
  };
}

function maxHz(t: string): string {
  const hz = [...t.matchAll(/(\d{2,3})\s?Hz/gi)].map((m) => Number(m[1])).filter((n) => n >= 50 && n <= 600);
  return hz.length ? String(Math.max(...hz)) : "";
}

/** "i7-14650HX|RTX 5050|16|512" from whatever the listing states. */
function laptopSignature(t: string): string {
  const cpu = t.match(/\b(i[3579][- ]\d{4,5}\w*|Ultra [3579] \d{3}\w*|Ryzen (?:AI )?(?:[3579] )?\w*\d{3,4}\w*|Snapdragon X\w*(?: \w+)?)\b/i)?.[1]?.toLowerCase().replace(/[\s-]+/g, "") ?? "";
  const gpu = gpuChip(t) ?? "";
  // Graphics memory ("RTX 5060 8GB", "8GB GDDR7") isn't system RAM.
  const sys = t.replace(/\b(?:RTX|GTX|RX|Arc)\s?\w*\d{3,4}\w*(?:\s?(?:Ti|SUPER|XT))?\s?\d{1,2}\s?GB\b/gi, " ").replace(/\b\d{1,2}\s?GB\s?G?DDR\d\w*(?=\s|$)/gi, (m) => (/gddr/i.test(m) ? " " : m));
  const gbs = [...sys.matchAll(/(\d+)\s?(GB|TB)\b/gi)].map((m) => Number(m[1]) * (m[2].toUpperCase() === "TB" ? 1024 : 1));
  const ram = gbs.filter((g) => g >= 4 && g <= 128).sort((a, b) => a - b)[0] ?? "";
  const ssd = gbs.filter((g) => g >= 256).sort((a, b) => b - a)[0] ?? "";
  return [cpu, gpu, ram, ssd].join("|");
}

// ---- Graphics cards: brand + GPU + product line + memory ----

const GPU_RE = /\b(?:(RTX|GTX)\s?-?(\d{4})\s?(Ti\s?SUPER|Ti|SUPER)?|(RX)\s?-?(\d{4})\s?(XTX|XT|GRE)?|(Arc)\s?([AB]\d{3}))\b/i;
export function gpuChip(t: string): string | undefined {
  const m = t.match(GPU_RE);
  if (!m) return undefined;
  if (m[1]) return `${m[1].toUpperCase()} ${m[2]}${m[3] ? ` ${m[3].replace(/\s+/, " ").replace(/ti/i, "Ti").replace(/super/i, "SUPER")}` : ""}`;
  if (m[4]) return `RX ${m[5]}${m[6] ? ` ${m[6].toUpperCase()}` : ""}`;
  return `Arc ${m[8].toUpperCase()}`;
}

const GPU_NOISE = new Set(
  "geforce radeon nvidia amd intel graphics graphic card video gddr6 gddr6x gddr7 gddr5 pcie pci express edition with dlss dlss4 ray tracing hdmi dp displayport triple fan dual fan and the of for gaming-x".split(" "),
);
function parseGpu(o: RawOffer): Parsed | null {
  const t = clean(o.title);
  const chip = gpuChip(t);
  if (!chip) return null;
  const brand = brandOf(o, t);
  if (!brand) return null;
  const mem = t.match(/\b(\d{1,2})\s?G(?:B)?\b/i)?.[1];
  const line = t
    .replace(GPU_RE, " ")
    .toLowerCase()
    .replace(new RegExp(`\\b${brand.toLowerCase()}\\b`, "g"), " ")
    .split(/[\s(),/+]+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ""))
    .filter((w) => w && !GPU_NOISE.has(w) && !/^\d+g(b)?$/.test(w) && !/^\d+(\.\d)?$/.test(w) && !(w.length > 8 && /\d/.test(w) && /[a-z]/.test(w)));
  const words = [...new Set(line)].sort();
  return {
    brand,
    model: displayName(t, brand),
    key: keyOf(brand, chip, mem ? `${mem}gb` : "", ...words),
    variant: STD,
    colour: "",
  };
}

// ---- Laptops: model code (each configuration is its own product) ----

function parseLaptop(o: RawOffer): Parsed | null {
  const t = clean(o.title);
  const brand = brandOf(o, t);
  if (!brand) return null;
  if (brand === "Apple" && /macbook/i.test(t)) {
    const line = /macbook pro/i.test(t) ? "MacBook Pro" : "MacBook Air";
    const size = t.match(/(1[3-6](?:\.\d)?)[- ]?(?:-inch|inch|"|”)/i)?.[1];
    const chip = t.match(/\bM(\d)(?: (Pro|Max))?\b/i);
    const gbs = [...t.matchAll(/(\d+)\s?(GB|TB)\b/gi)].map((m) => Number(m[1]) * (m[2].toUpperCase() === "TB" ? 1024 : 1));
    const ram = gbs.filter((g) => g <= 128).sort((a, b) => a - b)[0];
    const ssd = gbs.filter((g) => g >= 256).sort((a, b) => b - a)[0];
    if (!size || !chip || !ram || !ssd || ram === ssd) return null;
    const chipName = `M${chip[1]}${chip[2] ? ` ${chip[2][0].toUpperCase()}${chip[2].slice(1).toLowerCase()}` : ""}`;
    const model = `${line} ${size}" (${chipName}) ${ram}GB RAM · ${storageLabel(ssd)}`;
    return { brand, model, key: keyOf(brand, line, size, chipName, ram, ssd), variant: STD, colour: "" };
  }
  // Laptop part numbers: long, digit-heavy codes (FA608UHI-RL003W, 83DV00ABAU), not series names.
  const mpnLike = (c: string) => c.length >= 6 && (c.match(/\d/g)?.length ?? 0) >= 3 && (c.match(/[A-Z]/g)?.length ?? 0) >= 2;
  const cs = codes(`${o.mpn ?? ""} ${t}`).filter(mpnLike);
  // A part number the store states is trusted more than one guessed from the title.
  const stated = o.mpn ? codes(o.mpn).filter((c) => c.length >= 5).sort((a, b) => b.length - a.length)[0] : undefined;
  const code = stated || cs.sort((a, b) => b.length - a.length)[0];
  return {
    brand,
    model: displayName(t, brand),
    key: code ? keyOf(brand, code.replace(/[^A-Z0-9]/g, "")) : keyOf(brand, ...bag(t, brand)),
    variant: STD,
    colour: "",
    code,
    discriminator: laptopSignature(t),
  };
}

/**
 * Do two discriminators contradict? Laptop signatures compare field by field
 * and only conflict where both listings state a value.
 */
export function conflicts(a: string, b: string): boolean {
  if (!a || !b) return false;
  const x = a.split("|"), y = b.split("|");
  return x.some((v, i) => v && y[i] && v !== y[i]);
}

/** Order-free word set, for listings with no model code: only an identical description matches. */
function bag(t: string, brand: string): string[] {
  return [...new Set(t.toLowerCase().replace(new RegExp(`\\b${brand.toLowerCase()}\\b`, "g"), " ").split(/[^a-z0-9.]+/).filter((w) => w.length > 1))].sort();
}

export function parseProduct(o: RawOffer, category: CategoryId): Parsed | null {
  if (MORE_CATEGORIES.includes(category)) {
    // These categories legitimately contain words the first set treats as accessories ("Case", "Dock", "Soundbar").
    if (SECOND_HAND.test(o.title) || isMoreAccessory(category, o.title)) return null;
    return parseMore(o, category, brandOf);
  }
  if (!isProduct(o.title)) return null;
  switch (category) {
    case "tablets":
      return parseTablet(o);
    case "tvs":
    case "monitors":
      return parseScreen(o, category);
    case "graphics-cards":
      return parseGpu(o);
    case "laptops":
      return parseLaptop(o);
    default:
      return null;
  }
}

/**
 * Merge screen groups whose code is a store's full part number containing
 * another group's series code (QA65QN90FAWXXY ⊃ QN90F) — same brand and size only.
 */
export function mergeTarget(code: string, candidates: { key: string; code: string }[]): string | undefined {
  // The series must sit inside a much longer part number with characters on both
  // sides (QA65·QN90F·AWXXY): a bare suffix like 491CQP → 491CQPX is a different model.
  const hits = candidates.filter((c) => {
    if (c.code === code || c.code.length < 2 || code.length < c.code.length + 4) return false;
    const i = code.indexOf(c.code);
    return i > 0 && i + c.code.length < code.length;
  });
  // Only an unambiguous containment merges.
  return hits.length === 1 ? hits[0].key : undefined;
}

/** Key specs per category, read from every store's title for the product. */
export function categorySpecs(category: CategoryId, titles: string[]): Specs {
  if (MORE_CATEGORIES.includes(category)) return { extra: moreSpecs(category, titles), foldable: false };
  const all = titles.join(" \n ");
  const extra: [string, string][] = [];
  const first = (re: RegExp) => all.match(re)?.[1];
  const size = sizeOf(all);
  if (category === "tvs" || category === "monitors") {
    if (size) extra.push(["Screen size", `${size}"`]);
    const res = /\b8K\b/i.test(all) ? "8K" : /\b(4K|UHD)\b/i.test(all) ? "4K UHD" : /\b(QHD|WQHD|1440p|2560\s?x\s?1440)\b/i.test(all) ? "QHD (1440p)" : /\b(FHD|1080p|Full HD|1920\s?x\s?1080)\b/i.test(all) ? "Full HD (1080p)" : undefined;
    if (res) extra.push(["Resolution", res]);
    const panel = first(/\b(QD-OLED|OLED|Neo QLED|QLED|Mini LED|Mini-LED|IPS|VA|TN|LED)\b/i);
    if (panel) extra.push(["Panel", panel.replace(/mini-led/i, "Mini LED")]);
    const hz = [...all.matchAll(/(\d{2,3})\s?Hz/gi)].map((m) => Number(m[1])).filter((n) => n >= 50 && n <= 600);
    if (hz.length) extra.push(["Refresh rate", `${Math.max(...hz)}Hz`]);
    if (/\bcurved\b/i.test(all)) extra.push(["Curved", "Yes"]);
  }
  if (category === "graphics-cards") {
    const chip = gpuChip(all);
    if (chip) extra.push(["GPU", chip]);
    const mem = first(/\b(\d{1,2})\s?G(?:B)?\b/i);
    if (mem) extra.push(["Memory", `${mem}GB`]);
    const type = first(/\b(GDDR\d\w?)\b/i);
    if (type) extra.push(["Memory type", type.toUpperCase()]);
  }
  if (category === "laptops") {
    const cpu = first(/\b((?:Intel )?Core (?:Ultra )?[3579i]{1,2}[- ]?\w*\d{3,5}\w*|Ryzen (?:AI )?[3579] \w*\d{3,4}\w*|Snapdragon X \w+(?: \w+)?|M\d(?: Pro| Max)?)\b/i);
    if (cpu) extra.push(["Processor", cpu]);
    const gbs = [...all.matchAll(/(\d+)\s?(GB|TB)\b/gi)].map((m) => Number(m[1]) * (m[2].toUpperCase() === "TB" ? 1024 : 1));
    const ram = gbs.filter((g) => g >= 4 && g <= 128).sort((a, b) => a - b)[0];
    const ssd = gbs.filter((g) => g >= 128).sort((a, b) => b - a)[0];
    if (ram && ram !== ssd) extra.push(["Memory", `${ram}GB`]);
    if (ssd) extra.push(["Storage", storageLabel(ssd)]);
    const scr = all.match(/(1[0-8](?:\.\d)?)\s?(?:"|-?\s?inch|in\b)/i)?.[1];
    if (scr) extra.push(["Screen", `${scr}"`]);
    const gpu = gpuChip(all);
    if (gpu) extra.push(["Graphics", gpu]);
  }
  if (category === "tablets") {
    const scr = all.match(/(\d{1,2}(?:\.\d)?)[- ]?(?:-inch|inch|"|”)/i)?.[1];
    if (scr) extra.push(["Screen", `${scr}"`]);
    const chip = first(/\b(M\d(?: Pro| Max)?|A\d{2}(?: Pro)?|Snapdragon [\w ]+?(?= |,|$)|Dimensity \d+|Helio \w+)\b/);
    if (chip) extra.push(["Chip", chip]);
  }
  return { extra, foldable: false };
}
