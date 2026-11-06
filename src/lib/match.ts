/**
 * Matching for categories beyond phones. Each parser turns a store listing
 * into a group key (same key = same product at different stores) plus the
 * variant shoppers choose between.
 *
 * The rule throughout: when unsure, keep listings apart. A product shown twice
 * is a small annoyance; the wrong product's price next to yours is the thing
 * comparison sites get wrong and lose trust over.
 */
import { cpuName, dedicatedGpu, panelOf, phoneChip, refreshOf, resolutionOf, vote } from "./specs";
import { parseTitle, storageLabel } from "./normalize";
import { isMoreAccessory, MORE_CATEGORIES, moreSpecs, parseMore, productCodes } from "./match-more";
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
  /**
   * The listing's identity words as a key, kept for code-first categories: a store that prints no model
   * code joins the one coded group whose listings describe the product in exactly the same words.
   */
  alias?: string;
  /** Size, for TVs/monitors, so codes only merge within one size. */
  size?: number;
  /**
   * A spec that must agree within a group: monitor refresh rate, a laptop's
   * CPU/GPU/RAM/SSD. If stores in one group disagree, the group is split.
   * Empty means the listing doesn't say.
   */
  discriminator?: string;
  /** Every model code the listing names (title and MPN), for search and for joining pages that share one. */
  codes?: string[];
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
    "Simpson", "CHiQ", "Euromaid", "ASKO", "Westinghouse", "Mitsubishi Electric", "Hitachi", "Siemens", "Neff", "Liebherr",
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

/**
 * Brands of the 2026-11 categories (hair tools, small kitchen, BBQs, coffee gear). Kept apart from BRANDS and read
 * only for those categories: added to BRANDS they renamed existing coffee-machine and air-fryer products (Wilfa,
 * Moccamaster, Blackstone), and a product's name is its URL.
 */
const BRANDS_2026_11: Record<string, string> = {
  ...BRANDS,
  ...Object.fromEntries(
    [
    "ghd", "Remington", "BaByliss", "BaBylissPRO", "Cloud Nine", "Revlon", "VS Sassoon", "Braun", "Wahl", "Andis", "Conair",
    "Bio Ionic", "Laifen", "Silver Bullet", "Mermade", "Lucky Curl", "Hot Tools", "Drybar", "Paul Mitchell", "Parlux",
    "Bondi Boost", "Tymo", "Glamoriser", "Hairitage", "Rowenta", "BaByliss Pro", "L'Oréal",
    "Magimix", "Dualit", "Zwilling", "Hamilton Beach", "Bamix", "Thermomix",
    "Chefman", "Brabantia", "Sodastream", "Breadman", "Nutri Ninja", "Kuvings",
    "Hurom", "Greenis", "Cuckoo", "Zojirushi", "Instant Brands", "Crock-Pot", "Crockpot", "Lékué",
    "Weber", "Traeger", "Ziggy", "Everdure", "Masport", "Gasmate", "Beefeater", "Napoleon", "Broil King", "Char-Broil", "Big Green Egg",
    "Kamado Joe", "Ooni", "Gozney", "Pit Boss", "Z Grills", "Camp Chef", "Blackstone", "Solo Stove", "Jumbuck",
    "Rinnai", "Heatlie", "Kettle Chef", "Monument Grills", "Nexgrill", "Royal Gourmet", "Recteq", "Green Mountain Grills",
    "Louisiana Grills", "Oklahoma Joe's", "Dyna-Glo", "Masterbuilt", "Landmann", "Tepro", "Boss Grill", "Lion Premium Grills",
    "Baratza", "Comandante", "Timemore", "Acaia", "Hario", "1Zpresso", "Kingrinder", "Mahlkönig",
    "Mazzer", "Wilfa", "Bodum", "AeroPress", "Chemex", "Bialetti", "Kalita", "Bonavita", "Wacaco",
    "Option-O", "Fiorenzato", "Ceado", "Anfim", "Bezzera", "Ascaso", "La Marzocco", "Profitec", "Lelit",
    "Moccamaster", "Technivorm", "Espro", "Rhinowares", "Barista & Co", "Kinto", "Felicita", "Brewista",
    ].map((b) => [b.toLowerCase(), b]),
  ),
  ghd: "ghd",
  babylisspro: "BaByliss",
  "babyliss pro": "BaByliss",
  kitchenaid: "KitchenAid",
  crockpot: "Crock-Pot",
  "nutri ninja": "Ninja",
  "instant brands": "Instant",
  technivorm: "Moccamaster",
  mahlkonig: "Mahlkönig",
  aeropress: "AeroPress",
};
const NEW_CATEGORIES = new Set<CategoryId>(["hair-care", "small-kitchen", "bbqs", "coffee-gear"]);

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

function brandOf(o: RawOffer, title: string, table: Record<string, string> = BRANDS): string | undefined {
  const fromStore = o.brand?.trim().toLowerCase();
  if (fromStore && table[fromStore]) return table[fromStore];
  const words = title.toLowerCase().split(/\s+/);
  for (const n of [3, 2, 1]) {
    const w = words.slice(0, n).join(" ");
    if (table[w]) return table[w];
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
  /^(\d+(\.\d)?-?(inch|inches|in|cm)|\d+(gb|tb|hz|k|p|w|mah|nits|ms|mm|cm|in|th|nd|rd|st)|[48]k|uhd|fhd|qhd|wqhd|hdr\d*|hdmi\d*(\.\d)?|usb\d*|wi-?fi\d*|\d{4}|gen\d+|ddr\d\w*|gddr\d\w*|lpddr\d\w*|pcie\d*|ps5|g-?sync|v\d|x\d{1,2}|\d+x\d+|m\.2|nvme|ssd|oc|ai|5g|4g|lte|win1[01]|w1[01]h|i[3579]-\d{4,5}\w*|r[3579]-\d{4}\w*|\d-in-\d|area-?51|wi-?fi-?\d\w*|[a-z]?\d{1,2}-\d{3,5}[a-z]{0,3}|\d{3,5}(hx|hs|h|u|v|k|ks|kf|x3d)|w11[hp]?|rtx\d{4}\w*)$/i;
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

/**
 * What must agree inside one tablet variant: the RAM figure (the smaller GB figure, when the title gives two) and
 * the edition ("11th Edition", "12th Gen"): Microsoft sells the Surface Pro 13" 512GB with 16GB, 24GB and 32GB of
 * RAM across two editions, and stores list them under one name (2026-11-06).
 */
function tabletSignature(t: string, storageGb: number): string {
  const gbs = [...t.matchAll(/(\d+)\s?(GB|TB)\b/gi)].map((m) => Number(m[1]) * (m[2].toUpperCase() === "TB" ? 1024 : 1));
  const ram = gbs.filter((g) => g >= 2 && g <= 64 && g < storageGb).sort((a, b) => a - b)[0] ?? "";
  const edition = t.match(/\b(\d{1,2})(?:st|nd|rd|th)\s+(?:gen(?:eration)?|ed(?:ition)?)\b/i)?.[1] ?? "";
  return [ram, edition].join("|");
}

function parseTablet(o: RawOffer): Parsed | null {
  const t0 = clean(o.title);
  if (BUNDLE.test(t0)) return null;
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
    discriminator: tabletSignature(t0, p.storageGb),
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

/**
 * "i7-14650hx|RTX 5050|16|512|15.6" from whatever the listing states: CPU, GPU, RAM, SSD and screen size. Two
 * listings under one part number that state different values here are different configurations (2026-11-06:
 * stores sold the Dell Pro 14 Plus with an Ultra 5 and an Ultra 7, and the ASUS BR1104FTA with 128GB and 256GB,
 * under one code).
 */
export function laptopSignature(t: string): string {
  const cpu =
    t
      .match(/\b(i[3579][- ]\d{4,5}\w*|Core [3579][- ]\d{3}\w*|Ultra X?[3579][- ]\d{3}\w*|Ryzen (?:AI )?(?:[3579] )?(?:HX )?(?:PRO )?\w*\d{3,4}\w*|Ryzen AI [3579]\b|Snapdragon X\d? ?(?:Elite|Plus)?|M\d(?: (?:Pro|Max|Ultra))?\b(?= chip| \d|-core|,| with| \d)|N\d{3}\b|Kompanio \d{3,4})/i)?.[1]
      ?.toLowerCase()
      .replace(/[\s-]+/g, "") ?? "";
  const gpu = gpuChip(t) ?? "";
  // Graphics memory ("RTX 5060 8GB", "8GB GDDR7") isn't system RAM.
  const sys = t.replace(/\b(?:RTX|GTX|RX|Arc)\s?\w*\d{3,4}\w*(?:\s?(?:Ti|SUPER|XT))?\s?\d{1,2}\s?GB\b/gi, " ").replace(/\b\d{1,2}\s?GB\s?G?DDR\d\w*(?=\s|$)/gi, (m) => (/gddr/i.test(m) ? " " : m));
  const gbs = [...sys.matchAll(/(\d+)\s?(GB|TB)\b/gi)].map((m) => Number(m[1]) * (m[2].toUpperCase() === "TB" ? 1024 : 1));
  const ram = gbs.filter((g) => g >= 4 && g <= 128).sort((a, b) => a - b)[0] ?? "";
  // The drive is the largest figure of 128GB or more that isn't the RAM figure; a lone "128GB" could be either.
  const ssd = gbs.filter((g) => g >= 256 || (g >= 128 && ram && g > ram)).sort((a, b) => b - a)[0] ?? "";
  const screen = t.match(/\b(1[0-8](?:\.\d)?)\s?(?:"|”|-?\s?inch\b|in\b)/i)?.[1] ?? "";
  return [cpu, gpu, ram, ssd, screen].join("|");
}

/** A bundle (a laptop or tablet with a case, a pen, a subscription…) is not the product; left out, never merged. */
const BUNDLE = /\bbundle\b/i;

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
  if (BUNDLE.test(t)) return null;
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
  const p = parseProductInner(o, category);
  if (p) p.codes = productCodes(`${clean(o.title)} ${o.mpn ?? ""}`);
  return p;
}

function parseProductInner(o: RawOffer, category: CategoryId): Parsed | null {
  if (MORE_CATEGORIES.includes(category)) {
    // These categories legitimately contain words the first set treats as accessories ("Case", "Dock", "Soundbar").
    if (SECOND_HAND.test(o.title) || isMoreAccessory(category, o.title)) return null;
    if (category === "desktops" && BUNDLE.test(o.title)) return null;
    const parsed = parseMore(o, category, NEW_CATEGORIES.has(category) ? (x, t) => brandOf(x, t, BRANDS_2026_11) : brandOf);
    // A desktop's model code covers every configuration a store sells (ThinkCentre M70q with 512GB and with 1TB):
    // the stated CPU, GPU, RAM, drive and screen must agree, as for laptops.
    if (parsed && category === "desktops") parsed.discriminator = laptopSignature(clean(o.title));
    return parsed;
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
 * Pages of one brand that every listing on both sides names by the same model code are one product
 * ("Sony WH-1000XM5 Noise Cancelling Headphones" and "Sony WH-1000XM5 Premium Noise Cancelling Wireless Over-Ear
 * Headphones"; owner, 2026-11-06). The code must be EVERY listing's longest code on both sides and six characters
 * or more: a series name ("iQ300" on three Siemens fridges, "X-T50" on the body and its lens kits, whose kits name
 * a longer lens code) never joins pages. A stated spec that disagrees (`conflicts`) keeps them apart, and a screen
 * size must match. Returns which group joins which: the smaller joins the larger (the joined page's name is then
 * the most common one, and the old URL redirects, next.config.mjs). Never a fuzzy name.
 */
export function sharedCodeMerges(
  groups: { key: string; brand: string; size?: number; codes: string[][]; disc: string[] }[],
): Map<string, string> {
  const out = new Map<string, string>();
  const shared = (g: (typeof groups)[number]) => {
    const primary = g.codes[0]?.[0];
    return primary && primary.length >= 6 && g.codes.every((cs) => cs[0] === primary) ? [primary] : [];
  };
  const sorted = groups.map((g) => ({ g, shared: shared(g) })).filter((x) => x.shared.length).sort((a, b) => b.g.codes.length - a.g.codes.length);
  const into = new Map<string, (typeof sorted)[number]>();
  for (const x of sorted) {
    const t = sorted.find((y) => y !== x && !out.has(y.g.key) && y.g.brand === x.g.brand && y.g.size === x.g.size && y.shared.some((c) => x.shared.includes(c)) && (into.get(y.g.key) ?? y).g.codes.length >= x.g.codes.length);
    if (!t || out.has(x.g.key)) continue;
    const target = into.get(t.g.key) ?? t;
    if (x.g.disc.some((d) => target.g.disc.some((e) => conflicts(d, e)))) continue;
    out.set(x.g.key, target.g.key);
    target.g.disc = [...target.g.disc, ...x.g.disc];
    into.set(x.g.key, target);
  }
  return out;
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

/**
 * Key specs per category, read from every store's title for the product: each title gives its own reading and the
 * most common one wins (lib/specs.ts `vote`), so one stray title no longer decides a row.
 */
export function categorySpecs(category: CategoryId, titles: string[]): Specs {
  if (MORE_CATEGORIES.includes(category)) {
    const extra = moreSpecs(category, titles);
    if (category === "desktops") {
      // Processor and graphics first, as on laptops; the RAM and drive rows moreSpecs reads follow.
      const cpu = vote(titles.map(cpuName));
      const gpu = vote(titles.map(dedicatedGpu));
      extra.unshift(...([cpu && ["Processor", cpu], gpu && ["Graphics", gpu]].filter(Boolean) as [string, string][]));
    }
    return { extra, foldable: false };
  }
  const all = titles.join(" \n ");
  const extra: [string, string][] = [];
  const first = (re: RegExp) => all.match(re)?.[1];
  if (category === "tvs" || category === "monitors") {
    const size = vote(titles.map(sizeOf));
    if (size) extra.push(["Screen size", `${size}"`]);
    const res = vote(titles.map(resolutionOf));
    if (res) extra.push(["Resolution", res]);
    const panel = vote(titles.map(panelOf));
    if (panel) extra.push(["Panel", panel]);
    const hz = vote(titles.map(refreshOf));
    if (hz) extra.push(["Refresh rate", `${hz}Hz`]);
    if (titles.filter((t) => /\bcurved\b/i.test(t)).length * 2 > titles.length) extra.push(["Curved", "Yes"]);
  }
  if (category === "graphics-cards") {
    const chip = vote(titles.map(gpuChip));
    if (chip) extra.push(["GPU", chip]);
    const mem = vote(titles.map((t) => t.match(/\b(\d{1,2})\s?G(?:B)?\b/i)?.[1]));
    if (mem) extra.push(["Memory", `${mem}GB`]);
    const type = vote(titles.map((t) => t.match(/\b(GDDR\d\w?)\b/i)?.[1]?.toUpperCase()));
    if (type) extra.push(["Memory type", type]);
  }
  if (category === "laptops") {
    const cpu = vote(titles.map(cpuName));
    if (cpu) extra.push(["Processor", cpu]);
    const gpu = vote(titles.map(dedicatedGpu));
    if (gpu) extra.push(["Graphics", gpu]);
    const sig = titles.map((t) => laptopSignature(t).split("|"));
    const ram = vote(sig.map((x) => x[2]));
    const ssd = vote(sig.map((x) => x[3]));
    if (ram) extra.push(["Memory", `${ram}GB`]);
    if (ssd) extra.push(["Storage", storageLabel(Number(ssd))]);
    const scr = vote(titles.map((t) => t.match(/\b(1[0-8](?:\.\d)?)\s?(?:"|”|-?\s?inch\b|in\b)/i)?.[1]));
    if (scr) extra.push(["Screen", `${scr}"`]);
  }
  if (category === "tablets") {
    const scr = vote(titles.map((t) => t.match(/(\d{1,2}(?:\.\d)?)[- ]?(?:-inch|inch|"|”)/i)?.[1]).filter((x) => x && Number(x) >= 6 && Number(x) <= 15));
    if (scr) extra.push(["Screen", `${scr}"`]);
    const apple = (t: string) => (/\b(ipad|apple)\b/i.test(t) ? t.match(/\b(A\d{2}(?: Pro)?)\b/)?.[1] : undefined);
    const chip = vote(titles.map((t) => cpuName(t) ?? apple(t) ?? phoneChip(t)));
    if (chip) extra.push(["Chip", chip]);
  }
  void first;
  return { extra, foldable: false };
}
