/**
 * Matching for the categories added after the first expansion: audio,
 * wearables, gaming, cameras, PC parts, networking, printers and robot vacuums.
 *
 * Most of these products have no model code every store prints, so the key is
 * the product's identity words: the title minus brand, colour, the variant
 * (capacity, case size…) and each category's marketing noise. Word order
 * doesn't matter. Two stores describing a product differently stay apart;
 * that's deliberate (see match.ts).
 */
import { storageLabel } from "./normalize";
import type { CategoryId, RawOffer, Specs } from "./types";
import type { Parsed } from "./match";

const COLOURS =
  "black white silver grey gray blue red green pink purple gold rose midnight starlight graphite navy cream sand beige natural jet space slate ink plum lavender mint coral orange yellow teal sage blush cobalt onyx arctic sky light dark deep matte platinum champagne bronze copper charcoal stone moss olive ivory pearl peach smoke frost ash cloud ocean desert storm phantom carbon lilac violet lime ruby burgundy espresso mocha".split(
    " ",
  );
const COLOUR_RE = new RegExp(`\\b(${COLOURS.join("|")})\\b`, "gi");

const COMMON_NOISE = "new genuine au aus australian stock version model with and the for in of by plus+ - | / & latest 2024 2025 2026 2027 inc incl including".split(" ");

/** Words that describe a product type rather than which product it is. */
const NOISE: Partial<Record<CategoryId, string[]>> = {
  // "wireless"/"wired" stay: a gaming headset comes in both, at different prices.
  headphones: "bluetooth noise cancelling canceling cancellation anc headphones headphone headset earbuds earbud earphones earphone in-ear over-ear on-ear true tws hi-res audio sound premium".split(" "),
  speakers: "portable bluetooth wireless speaker speakers smart waterproof party outdoor home audio sound".split(" "),
  soundbars: "soundbar sound bar dolby atmos wireless home theatre theater system audio smart".split(" "),
  consoles: "console gaming handheld system video game games".split(" "),
  cameras: "camera digital mirrorless interchangeable lens full-frame frame aps-c body only".split(" "),
  drones: "drone camera quadcopter".split(" "),
  smartwatches: "smartwatch smart watch fitness tracker gps cellular lte bluetooth wi-fi wifi case band sport loop solo braided milanese link bracelet trail alpine ocean m/l s/m sm ml".split(" "),
  ssds: "ssd nvme m.2 m2 pcie gen4 gen5 gen3 internal solid state drive 2280 read write speeds up to mb/s gb/s storage".split(" "),
  ram: "memory ram desktop kit dimm module modules".split(" "),
  motherboards: "motherboard mainboard socket".split(" "),
  printers: "printer multifunction wireless colour color inkjet laser mono".split(" "),
  routers: "router wireless dual-band tri-band quad-band gigabit system mesh wifi wi-fi".split(" "),
  desktops: "desktop pc computer gaming tower windows home pro 11".split(" "),
  "robot-vacuums": "robot robotic vacuum cleaner mop mopping and self-emptying self emptying station".split(" "),
  vacuums: "vacuum vac cleaner cordless stick handstick handheld bagless corded cyclonic upright barrel canister lightweight powerful".split(" "),
  "air-fryers": "air fryer airfryer digital oven multi cooker".split(" "),
  "coffee-machines": "coffee machine maker espresso automatic fully semi manual pump bean to cup pod capsule".split(" "),
  fridges: "fridge refrigerator freezer door mount".split(" "),
  "washing-machines": "washing machine washer dryer load".split(" "),
  dishwashers: "dishwasher freestanding built-in built under".split(" "),
  // 2026-11 categories. Small kitchen keeps its type nouns: a series' kettle and toaster share every other word.
  "hair-care": "hair dryer hairdryer blow styling tool professional ionic salon".split(" "),
  "small-kitchen": "electric cordless digital".split(" "),
  bbqs: "bbq barbecue barbeque grill outdoor".split(" "),
  "coffee-gear": "coffee grinder burr conical flat electric manual hand".split(" "),
};

const clean = (s: string) =>
  s
    .replace(/[  ‑]/g, " ")
    .replace(/[’‘`]/g, "'")
    .replace(/[”“″]|''/g, '"')
    .replace(/\s+/g, " ")
    .trim();

const keyOf = (...parts: (string | number | undefined)[]) =>
  parts
    .filter((p) => p !== undefined && p !== "")
    .join(" ")
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, "");

/** Colour from a trailing " - Colour" or "(Colour)", when it reads like a colour. */
function splitColour(t: string): { rest: string; colour: string } {
  const m = t.match(/\s[-–]\s([^()\-–]+)$/) ?? t.match(/\(([^()]+)\)\s*$/);
  if (m && COLOUR_RE.test(m[1]) && m[1].split(/\s+/).length <= 4) {
    COLOUR_RE.lastIndex = 0;
    return { rest: t.slice(0, m.index).trim(), colour: m[1].trim() };
  }
  COLOUR_RE.lastIndex = 0;
  return { rest: t, colour: "" };
}

function identity(t: string, brand: string, category: CategoryId, drop: RegExp[] = []): string[] {
  let s = t.toLowerCase();
  for (const re of drop) s = s.replace(re, " ");
  s = s.replace(new RegExp(`\\b${brand.toLowerCase().replace(/[^a-z0-9 ]/g, "")}\\b`, "g"), " ").replace(COLOUR_RE, " ");
  COLOUR_RE.lastIndex = 0;
  const noise = new Set([...COMMON_NOISE, ...(NOISE[category] ?? [])]);
  const words = s
    .replace(/\[[^\]]*\]/g, " ")
    .split(/[\s,()|/]+/)
    .map((w) => w.replace(/^[-–.:;]+|[-–.:;]+$/g, ""))
    .filter((w) => w && w.length > 0 && !noise.has(w));
  return [...new Set(words)].sort();
}

const capacityGb = (t: string, min = 120) => {
  const gbs = [...t.matchAll(/(\d+(?:\.\d+)?)\s?(GB|TB)\b/gi)].map((m) => Number(m[1]) * (m[2].toUpperCase() === "TB" ? 1024 : 1));
  const big = gbs.filter((g) => g >= min);
  return big.length ? Math.max(...big) : 0;
};

const STD = { id: "std", label: "Standard", storageGb: 0 };

// ---- CPUs: the processor model is the product ----

const CPU_RE =
  /\b(?:(Ryzen)\s+(Threadripper(?:\s+PRO)?|[3579])\s+(?:PRO\s+)?(\d{4}[A-Z0-9]*)|Core\s+(Ultra\s+[3579])\s+(\d{3}[A-Z]{0,2})|Core\s+(i[3579])[- ]?(\d{4,5}[A-Z]{0,3})|(Athlon|Pentium|Celeron)\s+(\w+))\b/i;
export function cpuModel(t: string): { brand: string; family: string; model: string } | undefined {
  const m = t.match(CPU_RE);
  if (!m) return undefined;
  if (m[1]) return { brand: "AMD", family: `Ryzen ${m[2]}`, model: m[3].toUpperCase() };
  if (m[4]) return { brand: "Intel", family: `Core ${m[4].replace(/\s+/, " ")}`.replace(/ultra/i, "Ultra"), model: m[5].toUpperCase() };
  if (m[6]) return { brand: "Intel", family: `Core ${m[6].toLowerCase()}`, model: m[7].toUpperCase() };
  return { brand: /athlon/i.test(m[8]) ? "AMD" : "Intel", family: m[8], model: m[9].toUpperCase() };
}

function parseCpu(o: RawOffer): Parsed | null {
  const t = clean(o.title);
  if (/\b(cooler|heatsink|fan|thermal|bundle|motherboard)\b/i.test(t)) return null;
  const c = cpuModel(t);
  if (!c) return null;
  const tray = /\b(tray|oem)\b/i.test(t);
  return {
    brand: c.brand,
    model: `${c.family} ${c.model}${tray ? " (tray)" : ""}`,
    key: keyOf(c.brand, c.family, c.model, tray ? "tray" : ""),
    variant: STD,
    colour: "",
  };
}

// ---- RAM: part number, else a full spec signature ----

export function ramSignature(t: string): string | undefined {
  const type = t.match(/\b(DDR[345])\b/i)?.[1]?.toUpperCase();
  const kit = t.match(/\b(\d{1,3})\s?GB\s*\(?\s*(\d)\s?x\s?(\d{1,3})\s?GB\)?/i);
  const single = t.match(/\b(\d{1,3})\s?GB\b/i);
  const speed = t.match(/\b(\d{4})\s?(?:MHz|MT\/s)?\b/i)?.[1] ?? t.match(/\bDDR[345][- ](\d{4})\b/i)?.[1];
  const cl = t.match(/\b(?:CL|C)(\d{2})\b/i)?.[1];
  if (!type || !(kit || single)) return undefined;
  const size = kit ? `${kit[1]}gb ${kit[2]}x${kit[3]}` : `${single![1]}gb`;
  const laptop = /\b(so-?dimm|laptop|notebook)\b/i.test(t) ? "sodimm" : "";
  return [type, size, speed, cl ? `cl${cl}` : "", laptop].filter(Boolean).join(" ");
}

// ---- Everything else: identity words + an optional variant ----

function variantFor(category: CategoryId, t: string): { id: string; label: string; storageGb: number; drop: RegExp[] } {
  if (category === "ssds") {
    const gb = capacityGb(t, 120);
    return gb ? { id: storageLabel(gb).toLowerCase(), label: storageLabel(gb), storageGb: gb, drop: [/\b\d+(?:\.\d+)?\s?(gb|tb)\b/gi] } : { ...STD, drop: [] };
  }
  if (category === "consoles") {
    const gb = capacityGb(t, 256);
    return gb ? { id: storageLabel(gb).toLowerCase(), label: storageLabel(gb), storageGb: gb, drop: [/\b\d+(?:\.\d+)?\s?(gb|tb)\b/gi] } : { ...STD, drop: [] };
  }
  if (category === "smartwatches") {
    const mm = t.match(/\b(\d{2})\s?mm\b/i)?.[1];
    const cell = /\b(cellular|lte|4g|5g|esim)\b/i.test(t);
    const parts = [mm ? `${mm}mm` : "", cell ? "GPS + Cellular" : /\bgps\b/i.test(t) ? "GPS" : ""].filter(Boolean);
    return {
      id: keyOf(mm ? `${mm}mm` : "", cell ? "cell" : "gps") || "std",
      label: parts.join(" · ") || "Standard",
      storageGb: 0,
      // Band, colour and case finish wording differ by store; size and connectivity are the variant.
      drop: [/\b\d{2}\s?mm\b/gi, /\bwith\b.*$/i, /\b(gps\s*\+\s*)?(cellular|lte|4g|5g|esim|gps)\b/gi, /\s\+\s/g],
    };
  }
  return { ...STD, drop: [] };
}

/** A CPU or GPU model number is not a product code ("9800X3D", "RTX5080"). */
const COMPONENT_CODE = /^(\d{4,5}(X3D|XT|X|K|KF|F|G|GT|HX|H|U|S)?|RTX-?\d{4}\w*|GTX-?\d{4}\w*|RX-?\d{4}\w*|I[3579]-?\d{4,5}\w*)$/i;

/** "2 Pack", "(3-pack)", "Twin Pack", "x2": a 2-pack is a different product from a single. */
function packCount(t: string): string {
  const m = t.match(/\b(\d)\s?-?\s?(?:pack|pk)\b|\(\s*(\d)\s?-?\s?pack\s*\)|\b(twin|triple)[- ]pack\b|\bx\s?(\d)\b/i);
  if (!m) return "";
  const n = m[1] ?? m[2] ?? m[4] ?? (/twin/i.test(m[3] ?? "") ? "2" : "3");
  return n === "1" ? "" : `pack${n}`;
}

/** Categories where a printed model code identifies the product on its own. */
const CODE_FIRST: Partial<Record<CategoryId, true>> = {
  printers: true, routers: true, desktops: true, soundbars: true,
  // Appliances: every store prints the maker's model code, and colours have codes of their own (BES870BSS / BES870BTR).
  "air-fryers": true, "coffee-machines": true, fridges: true, "washing-machines": true, dishwashers: true, vacuums: true,
  "hair-care": true, "small-kitchen": true, bbqs: true, "coffee-gear": true,
};
const strongCode = (t: string) =>
  t
    .split(/[\s(),/[\]]+/)
    .map((w) => w.replace(/^[-–.]+|[-–.:;]+$/g, "").toUpperCase())
    .filter((w) => w.length >= 5 && w.length <= 20 && (w.match(/\d/g)?.length ?? 0) >= 2 && /[A-Z]/.test(w) && !/^\d+(\.\d+)?(GB|TB|MHZ|HZ|MM|W|MAH|P|L|KG|LITRES?|RPM|BAR|PSI|STAR)$/.test(w) && !/^(WI-?FI\d|DDR\d|GEN\d|USB\d)/.test(w) && !COMPONENT_CODE.test(w) && !/^(BE|AXE?|AC)\d{3,5}$/.test(w))
    .sort((a, b) => b.length - a.length)[0];

const APPLIANCES = new Set<CategoryId>(["vacuums", "air-fryers", "coffee-machines", "fridges", "washing-machines", "dishwashers", "hair-care", "small-kitchen", "bbqs", "coffee-gear"]);

/** Breville's Australian stock suffix ("BES870BTR4IAN1", "BCA800BSS0ZAN1") is not part of the model code. */
function stripRegionSuffix(code: string | undefined): string | undefined {
  if (!code) return code;
  const bare = code.replace(/\d[A-Z]AN\d$/, "");
  return bare.length >= 5 ? bare : code;
}

// ---- LEGO: the set number is the product ----

/** LEGO's themes, longest first so "Creator 3in1" wins over "Creator". */
export const LEGO_THEMES = [
  "Star Wars", "Technic", "City", "Friends", "Ninjago", "Icons", "Creator 3in1", "Creator", "Harry Potter", "Marvel", "Super Heroes",
  "DC", "Disney Princess", "Disney", "Duplo", "Speed Champions", "Minecraft", "Architecture", "Ideas", "Art", "Botanicals", "Botanical",
  "Classic", "Jurassic World", "Super Mario", "Animal Crossing", "DREAMZzz", "Minifigures", "Editions", "Wednesday", "Sonic", "Fortnite",
  "Pokémon", "Pokemon", "One Piece", "F1", "Gabby's Dollhouse", "Bluey", "Monkie Kid", "Indiana Jones", "Avatar", "Wicked",
  "The Lord of the Rings", "Lord of the Rings", "Spidey", "Batman", "Avengers", "Spider-Man", "Mandalorian", "Brickheadz", "Dots", "Wednesday",
].sort((a, b) => b.length - a.length);

const titleCase = (s: string) => s.replace(/\b([A-Z])([A-Z']+)\b/g, (_, a: string, b: string) => a + b.toLowerCase());

export function legoTheme(t: string): string | undefined {
  // The theme named first wins ("Icons Land Rover Classic Defender" is Icons, not Classic); at one spot the longer name.
  let hit: string | undefined;
  let at = Infinity;
  for (const th of LEGO_THEMES) {
    const i = t.search(new RegExp(`\\b${th.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"));
    if (i >= 0 && i < at) [hit, at] = [th, i];
  }
  if (!hit) return undefined;
  return hit === "Pokemon" ? "Pokémon" : hit === "Botanical" ? "Botanicals" : hit === "Lord of the Rings" ? "The Lord of the Rings" : hit;
}

function parseLego(o: RawOffer): Parsed | null {
  const set = o.mpn && /^\d{4,6}$/.test(o.mpn) ? o.mpn : undefined;
  if (!set) return null;
  // "TECHNIC - Bugatti Chiron" → "Technic Bugatti Chiron"; the set number goes last.
  // Hobbyco writes the theme in capitals first ("TECHNIC - Bugatti …"); only that prefix is re-cased.
  const t0 = clean(o.title.replace(/[®™©]/g, "")).replace(/^([A-Z][A-Z0-9' ]+)(?=\s[-–:]\s)/, (m) => titleCase(m));
  let name = t0
    .replace(/\blego\b/gi, " ")
    .replace(new RegExp(`\\b${set}\\b`, "g"), " ")
    .replace(/\s[-–:|]\s/g, " ")
    .replace(/^\s*[-–:|]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
  name = name.replace(/\bDreamzzz\b/i, "DREAMZzz").replace(/^Dc\b/, "DC");
  return { brand: "LEGO", model: `${name} ${set}`.trim(), key: `lego${set}`, variant: STD, colour: "", code: set };
}

export function parseMore(o: RawOffer, category: CategoryId, brandOf: (o: RawOffer, t: string) => string | undefined): Parsed | null {
  if (category === "cpus") return parseCpu(o);
  if (category === "lego") return parseLego(o);
  // Appliance titles drop trademark signs ("Barista Express®") so the same words match across stores.
  const t0 = clean(APPLIANCES.has(category) ? o.title.replace(/[®™©]/g, "") : o.title);
  const brand = brandOf(o, t0) ?? (category === "consoles" ? consoleMaker(t0) : undefined);
  if (!brand) return null;
  const { rest, colour } = splitColour(t0);
  if (category === "ram") {
    const sig = ramSignature(rest);
    const code = o.mpn && o.mpn.length >= 6 ? o.mpn.toUpperCase().replace(/[^A-Z0-9]/g, "") : undefined;
    if (!sig && !code) return null;
    return { brand, model: display(rest, brand), key: keyOf(brand, code ?? sig), variant: STD, colour, discriminator: sig ?? "" };
  }
  const v = variantFor(category, rest);
  const stated = o.mpn && o.mpn.length >= 5 && !COMPONENT_CODE.test(o.mpn.replace(/\s+/g, "")) ? o.mpn.toUpperCase() : undefined;
  const code = CODE_FIRST[category] ? stripRegionSuffix(stated ?? strongCode(rest)) : undefined;
  const pack = packCount(rest);
  const words = identity(rest, brand, category, v.drop);
  if (!code && !words.length) return null;
  return {
    brand,
    model: display(
      category === "smartwatches"
        ? rest.replace(/\b\d{2}\s?mm\b.*$/i, "").trim() || rest
        : v.storageGb
          ? rest.replace(/\s*\b\d+(?:\.\d+)?\s?(GB|TB)\b/gi, "").replace(/\s{2,}/g, " ").trim()
          : rest,
      brand,
      APPLIANCES.has(category),
    ),
    key: code ? keyOf(brand, code.replace(/[^A-Z0-9]/g, ""), pack) : keyOf(brand, ...words, pack),
    alias: APPLIANCES.has(category) && words.length ? keyOf(brand, ...words, pack) : undefined,
    variant: { id: v.id, label: v.label, storageGb: v.storageGb },
    colour,
    code,
  };
}

function consoleMaker(t: string): string | undefined {
  if (/playstation|ps5|ps4/i.test(t)) return "Sony";
  if (/xbox/i.test(t)) return "Microsoft";
  if (/nintendo|switch/i.test(t)) return "Nintendo";
  if (/steam deck/i.test(t)) return "Valve";
  return undefined;
}

function display(t: string, brand: string, anySpelling = false): string {
  // Appliances: "De'Longhi", "DeLonghi", "Fisher & Paykel", the brand however the store spells it. Older
  // categories keep the original rule, so no existing product's name or URL changes.
  const re = anySpelling
    ? new RegExp(`^${brand.replace(/[^A-Za-z0-9]/g, "").split("").join("[^A-Za-z0-9]{0,3}")}\\s+`, "i")
    : new RegExp(`^${brand.replace(/[^A-Za-z0-9 ]/g, "")}\\s+`, "i");
  return t
    .replace(re, "")
    .replace(/\s*[\[(][A-Z0-9/\-.]{6,}[\])]\s*$/i, "")
    .trim();
}

/** Key specs for the new categories, read from every store's title. */
export function moreSpecs(category: CategoryId, titles: string[]): [string, string][] {
  const all = titles.join(" \n ");
  const out: [string, string][] = [];
  const first = (re: RegExp) => all.match(re)?.[1];
  const has = (re: RegExp) => re.test(all);
  switch (category) {
    case "cpus": {
      const c = cpuModel(all);
      if (c) out.push(["Family", c.family]);
      const sock = first(/\b(AM[45]|LGA\s?\d{4})\b/i);
      if (sock) out.push(["Socket", sock.toUpperCase().replace(/\s/, "")]);
      const cores = first(/\b(\d{1,2})[- ]?Core\b/i);
      if (cores) out.push(["Cores", cores]);
      break;
    }
    case "ssds": {
      out.push(["Interface", has(/\bsata\b/i) ? "SATA" : has(/\b(nvme|pcie)\b/i) ? "NVMe" : has(/\b(usb|portable|external)\b/i) ? "USB (portable)" : "—"]);
      const gen = first(/\b(?:PCIe\s?)?Gen\s?([345])\b/i);
      if (gen) out.push(["PCIe", `Gen ${gen}`]);
      if (has(/\bheatsink\b/i)) out.push(["Heatsink", "Yes"]);
      break;
    }
    case "ram": {
      const type = first(/\b(DDR[345])\b/i);
      if (type) out.push(["Type", type.toUpperCase()]);
      const kit = all.match(/\b(\d{1,3})\s?GB\s*\(?\s*(\d)\s?x\s?(\d{1,3})\s?GB/i);
      if (kit) out.push(["Capacity", `${kit[1]}GB (${kit[2]}×${kit[3]}GB)`]);
      const speed = first(/\b(\d{4})\s?(?:MHz|MT\/s)\b/i);
      if (speed) out.push(["Speed", `${speed} MT/s`]);
      const cl = first(/\b(?:CL|C)(\d{2})\b/);
      if (cl) out.push(["CAS latency", `CL${cl}`]);
      if (has(/\brgb\b/i)) out.push(["RGB", "Yes"]);
      break;
    }
    case "motherboards": {
      const chip = first(/\b([ABXZH]\d{3}[A-Z]?)\b/);
      if (chip) out.push(["Chipset", chip]);
      const sock = first(/\b(AM[45]|LGA\s?\d{4})\b/i);
      if (sock) out.push(["Socket", sock.toUpperCase().replace(/\s/, "")]);
      const ff = has(/\bmini[- ]?itx\b/i) ? "Mini-ITX" : has(/\b(micro[- ]?atx|m-?atx|matx)\b/i) || /\b[ABXZH]\d{3}M\b/.test(all) ? "Micro-ATX" : has(/\bE-?ATX\b/) ? "E-ATX" : "ATX";
      out.push(["Form factor", ff]);
      if (has(/\bwi-?fi\b/i)) out.push(["Wi-Fi", "Yes"]);
      break;
    }
    case "headphones":
      out.push(["Type", has(/\b(earbuds?|in-ear|airpods(?! max)|buds|tws|true wireless)\b/i) ? "Earbuds" : has(/\bon-ear\b/i) ? "On-ear" : "Over-ear"]);
      if (has(/\b(noise cancell?ing|anc)\b/i)) out.push(["Noise cancelling", "Yes"]);
      break;
    case "smartwatches": {
      const mm = first(/\b(\d{2})\s?mm\b/i);
      if (mm) out.push(["Case size", `${mm}mm`]);
      out.push(["Connectivity", has(/\b(cellular|lte|4g|esim)\b/i) ? "GPS + Cellular available" : "GPS"]);
      break;
    }
    case "consoles":
      out.push(["Platform", has(/playstation|ps5/i) ? "PlayStation" : has(/xbox/i) ? "Xbox" : has(/switch|nintendo/i) ? "Nintendo" : "PC handheld"]);
      if (has(/\b(digital edition|digital)\b/i)) out.push(["Disc drive", "No (digital)"]);
      break;
    case "cameras":
      out.push(["Type", has(/\b(gopro|action|osmo|insta360)\b/i) ? "Action camera" : has(/\b(compact|point|powershot|cyber-?shot|zv-1|x100)\b/i) ? "Compact" : "Mirrorless / interchangeable"]);
      out.push(["Kit", has(/\b(kit|with \d{2,3}[-–]\d{2,3}mm|\d{2,3}[-–]\d{2,3}mm)\b/i) ? "With lens" : "Body only"]);
      break;
    case "soundbars": {
      const ch = first(/\b(\d{1,2}\.\d(?:\.\d)?)\s?(?:ch|channel)\b/i);
      if (ch) out.push(["Channels", ch]);
      if (has(/\batmos\b/i)) out.push(["Dolby Atmos", "Yes"]);
      break;
    }
    case "speakers":
      out.push(["Type", has(/\b(smart|alexa|google|homepod|sonos)\b/i) ? "Smart / home" : has(/\bparty\b/i) ? "Party" : "Portable"]);
      break;
    case "routers": {
      const wifi = first(/\b(?:Wi-?Fi\s?)(7|6E|6|5)\b/i) ?? (has(/\bBE\d{3,5}\b/i) ? "7" : has(/\bAXE\d{3,5}\b/i) ? "6E" : has(/\bAX\d{3,5}\b/i) ? "6" : undefined);
      if (wifi) out.push(["Wi-Fi", `Wi-Fi ${wifi.toUpperCase()}`]);
      if (has(/\bmesh\b/i)) out.push(["Mesh", "Yes"]);
      if (has(/\bmodem\b/i)) out.push(["Modem", "Yes"]);
      break;
    }
    case "printers":
      out.push(["Type", has(/\b(ecotank|megatank|ink tank|tank)\b/i) ? "Ink tank" : has(/\blaser\b/i) ? "Laser" : "Inkjet"]);
      out.push(["Colour", has(/\b(mono|monochrome|black and white)\b/i) ? "Mono" : "Colour"]);
      if (has(/\b(multifunction|all-in-one|mfp|mfc|scan)\b/i)) out.push(["Scanner", "Yes"]);
      break;
    case "robot-vacuums":
      if (has(/\bmop/i)) out.push(["Mops", "Yes"]);
      if (has(/\b(self-?empt\w*|auto-?empty|clean base|station|dock)\b/i)) out.push(["Base station", "Yes"]);
      break;
    case "vacuums":
      out.push(["Type", has(/\b(handheld|hand vac|car vac)\b/i) && !has(/\bstick\b/i) ? "Handheld" : has(/\b(barrel|canister|bagged|cylinder)\b/i) ? "Barrel" : has(/\bupright\b/i) && !has(/\b(cordless|stick)\b/i) ? "Upright" : "Stick"]);
      out.push(["Power", has(/\b(corded|mains)\b/i) && !has(/\bcordless\b/i) ? "Corded" : "Cordless"]);
      if (has(/\b(wet\s?(and|&|\/)\s?dry|wet dry|hard floor cleaner|vacuum (and|&) mop)\b/i)) out.push(["Wet & dry", "Yes"]);
      if (has(/\b(self[- ]?empty|auto[- ]?empty|clean ?station|empty base)\b/i)) out.push(["Self-empty base", "Yes"]);
      break;
    case "air-fryers": {
      const l = litres(all, 1.5, 20);
      if (l) out.push(["Capacity", `${l}L`]);
      out.push(["Baskets", has(/\b(dual|double|twin|2)[- ]?(zone|basket|drawer)s?\b|\bflexdrawer\b|\bdual\b/i) ? "Dual zone" : has(/\b(oven|rotisserie)\b/i) ? "Oven style" : "Single"]);
      break;
    }
    case "coffee-machines":
      out.push([
        "Type",
        has(/\b(nespresso|vertuo|pod|capsule|dolce gusto|k-?cup|caffitaly|lavazza a modo)\b/i)
          ? "Pod / capsule"
          : has(/\b(fully automatic|bean[- ]to[- ]cup|super[- ]automatic|automatic coffee|magnifica|dinamica|eletta|rivelia|primadonna|jura|oracle)\b/i)
            ? "Fully automatic"
            : has(/\b(drip|filter coffee|pour[- ]over|cold brew)\b/i)
              ? "Drip / filter"
              : "Manual espresso",
      ]);
      if (has(/\b(grinder|grind|barista express|barista pro|barista touch|bean[- ]to[- ]cup)\b/i) && !has(/\b(nespresso|pod|capsule)\b/i)) out.push(["Built-in grinder", "Yes"]);
      if (has(/\b(milk frother|aeroccino|milk system|lattissima|lattego|milk wand|steam wand|latte|cappuccino)\b/i)) out.push(["Milk", "Yes"]);
      break;
    case "fridges": {
      const l = litres(all, 30, 1200);
      if (l) out.push(["Capacity", `${l}L`]);
      const type = has(/\bquad\b|\b4[- ]door\b/i)
        ? "Quad door"
        : has(/\bfrench door\b/i)
          ? "French door"
          : has(/\bside[- ]by[- ]side\b/i)
            ? "Side by side"
            : has(/\bbottom[- ]mount\b/i)
              ? "Bottom mount"
              : has(/\btop[- ]mount\b/i)
                ? "Top mount"
                : has(/\bchest freezer\b/i)
                  ? "Chest freezer"
                  : has(/\b(upright|vertical) freezer\b|\bfreezer\b(?!.*\bfridge\b)/i)
                    ? "Upright freezer"
                    : has(/\b(bar fridge|beverage|wine)\b/i)
                      ? "Bar & wine"
                      : has(/\b(single door|all fridge|upright fridge|vertical fridge)\b/i)
                        ? "Upright fridge"
                        : undefined;
      if (type) out.push(["Type", type]);
      if (has(/\b(plumbed|water dispenser|ice (and|&) water|ice maker|non-plumbed)\b/i)) out.push(["Ice & water", "Yes"]);
      break;
    }
    case "washing-machines": {
      const kgs = [...all.matchAll(/\b(\d{1,2}(?:\.\d)?)\s?kg\b/gi)].map((m) => Number(m[1])).filter((n) => n >= 3 && n <= 25);
      if (kgs.length) out.push(["Capacity", `${Math.max(...kgs)}kg`]);
      const combo = has(/\b(washer[- ]dryer|washer \/ dryer|wash(er)? (and|&) dry|combo)\b/i);
      const dryer = !combo && has(/\b(dryer|heat pump|vented|condenser)\b/i) && !has(/\b(washing machine|washer)\b/i);
      out.push(["Type", combo ? "Washer-dryer" : dryer ? "Dryer" : has(/\btop[- ]load/i) ? "Top load washer" : "Front load washer"]);
      break;
    }
    case "dishwashers": {
      const place = first(/\b(\d{1,2})\s?(?:place settings?|place|ps)\b/i);
      if (place) out.push(["Place settings", place]);
      out.push(["Install", has(/\b(fully integrated|integrated)\b/i) ? "Integrated" : has(/\b(built[- ]?in|built[- ]?under|under[- ]?bench|semi[- ]integrated)\b/i) ? "Built-in" : has(/\b(benchtop|countertop|compact|portable)\b/i) ? "Benchtop" : "Freestanding"]);
      break;
    }
    case "hair-care": {
      const type = hairType(all);
      if (type) out.push(["Type", type]);
      const w = first(/\b(\d{3,4})\s?W\b/i);
      if (w && Number(w) >= 300 && Number(w) <= 3000) out.push(["Power", `${w}W`]);
      out.push(["Power source", has(/\bcordless\b|\brechargeable\b|\bbattery\b/i) ? "Cordless" : "Corded"]);
      break;
    }
    case "small-kitchen": {
      const type = kitchenType(all);
      if (type) out.push(["Type", type]);
      const l = litres(all, 0.3, 40);
      if (l) out.push(["Capacity", `${l}L`]);
      const w = first(/\b(\d{3,4})\s?W\b/i);
      if (w && Number(w) >= 200 && Number(w) <= 3600) out.push(["Power", `${w}W`]);
      break;
    }
    case "bbqs": {
      out.push([
        "Fuel",
        has(/\bpellet\b|traeger|smokefire|pit boss/i)
          ? "Pellet"
          : has(/\bcharcoal\b|\bkamado\b|big green egg|\bkettle\b|smokey|master-?touch|\bbriquette/i)
            ? "Charcoal"
            : has(/\belectric\b|woodfire|\bvolt\b/i)
              ? "Electric"
              : has(/\bgas\b|\blpg\b|propane|natural gas|\bburners?\b|\bnatural gas\b|weber (q|spirit|genesis|summit)/i)
                ? "Gas"
                : has(/\bwood\b/i)
                  ? "Wood"
                  : "Other",
      ]);
      out.push(["Type", has(/pizza oven|\booni\b|gozney|roccbox/i) ? "Pizza oven" : has(/\bsmoker\b/i) ? "Smoker" : has(/\bkamado\b|big green egg/i) ? "Kamado" : has(/\bgriddle\b|plancha|flat ?top/i) ? "Griddle" : has(/\bportable\b|\btravel(l)?er\b|\bweber q ?1\d{3}\b|\bgo-anywhere\b|\bsmokey joe\b|\bjumbo joe\b/i) ? "Portable BBQ" : "BBQ"]);
      const burners = first(/\b(\d)[- ]?burners?\b/i);
      if (burners) out.push(["Burners", burners]);
      break;
    }
    case "coffee-gear": {
      out.push([
        "Type",
        has(/grinder|coffee mill|hand mill|burr mill|niche zero|mignon|comandante|1zpresso|kingrinder/i)
          ? has(/\b(manual|hand)\b|comandante|1zpresso|kingrinder|timemore c\d|skerton|\bhand mill\b/i) && !has(/\belectric\b/i)
            ? "Manual grinder"
            : "Electric grinder"
          : has(/kettle/i)
            ? "Kettle"
            : has(/\bscales?\b|acaia/i)
              ? "Scale"
              : has(/frother|aeroccino/i)
                ? "Milk frother"
                : "Brewer",
      ]);
      break;
    }
    case "lego": {
      const th = legoTheme(all);
      if (th) out.push(["Theme", th]);
      const pcs = first(/\b(\d[\d,]{1,5})\s?(?:pcs|pieces|piece)\b/i);
      if (pcs) out.push(["Pieces", pcs.replace(/,/g, "")]);
      break;
    }
    case "desktops": {
      const gbs = [...all.matchAll(/(\d+)\s?(GB|TB)\b/gi)].map((m) => Number(m[1]) * (m[2].toUpperCase() === "TB" ? 1024 : 1));
      const ram = gbs.filter((g) => g >= 4 && g <= 256).sort((a, b) => a - b)[0];
      const ssd = gbs.filter((g) => g >= 256).sort((a, b) => b - a)[0];
      if (ram && ram !== ssd) out.push(["Memory", `${ram}GB`]);
      if (ssd) out.push(["Storage", storageLabel(ssd)]);
      break;
    }
  }
  return out;
}

/** What kind of hair tool: the first match wins, so "styler" never hides a dryer that says so. */
function hairType(all: string): string | undefined {
  if (/airwrap|multi-?styler|air ?styler|flexstyle|hot (air )?brush|blow[- ]?dry brush|volumi[sz]er|heated brush/i.test(all)) return "Styler & hot brush";
  if (/straightener|flat ?iron|airstrait|corrale|straightening brush|hair iron/i.test(all)) return "Straightener";
  if (/curl|waver|crimper|\btong\b/i.test(all)) return "Curler & waver";
  if (/clipper|trimmer/i.test(all)) return "Clipper & trimmer";
  if (/dryer|supersonic/i.test(all)) return "Hair dryer";
  return undefined;
}

/** What kind of small kitchen appliance. */
function kitchenType(all: string): string | undefined {
  const types: [RegExp, string][] = [
    [/stand mixer|tilt[- ]head|bowl[- ]lift|kenwood chef|cooking chef|\bkmix\b|planetary mixer|kitchen mixer|food mixer/i, "Stand mixer"],
    [/hand mixer/i, "Hand mixer"],
    [/food processor|mini chopper|thermo ?mix/i, "Food processor"],
    [/blender|nutribullet|vitamix/i, "Blender"],
    [/juicer|juice extractor|citrus press/i, "Juicer"],
    [/microwave/i, "Microwave"],
    [/toaster oven|benchtop oven|countertop oven|mini oven/i, "Benchtop oven"],
    [/toaster/i, "Toaster"],
    [/kettle/i, "Kettle"],
    [/rice cooker|slow cooker|pressure cooker|multi-?cooker|instant pot|egg cooker|soup maker|food steamer/i, "Cooker"],
    [/sandwich|toastie|panini|contact grill|health grill|indoor grill|smart grill|cafe grill|optigrill|waffle/i, "Sandwich press & grill"],
    [/sodastream|soda stream|sparkling water/i, "Sparkling water maker"],
    [/ice cream|creami|yogh?urt|bread ?maker|dehydrator|popcorn|deep fryer|electric fry ?pan|electric wok|spirali[sz]er|mincer/i, "Other"],
  ];
  return types.find(([re]) => re.test(all))?.[1];
}

/** The largest litre figure in range: "11L Dual Zone" → 11, "635L French Door" → 635. */
function litres(all: string, min: number, max: number): number | undefined {
  const ls = [...all.matchAll(/\b(\d{1,4}(?:\.\d)?)\s?(?:L|litres?|liters?|ltr)\b/gi)].map((m) => Number(m[1])).filter((n) => n >= min && n <= max);
  return ls.length ? Math.max(...ls) : undefined;
}

export const MORE_CATEGORIES: CategoryId[] = [
  "smartwatches", "desktops", "printers", "routers", "cpus", "ssds", "ram", "motherboards", "soundbars", "headphones", "speakers", "consoles", "cameras", "drones", "robot-vacuums",
  "vacuums", "air-fryers", "coffee-machines", "fridges", "washing-machines", "dishwashers", "lego",
  "hair-care", "small-kitchen", "bbqs", "coffee-gear",
];

/** Accessories that slip into these categories' listings. */
const MORE_ACCESSORY: Partial<Record<CategoryId, RegExp>> = {
  headphones: /\b(ear ?tips|replacement|cushions?|case only|charging case|cable|adapter|stand|hanger)\b/i,
  smartwatches: /\b(screen protector|charger|charging (cable|dock|stand)|bumper)\b/i,
  consoles: /\b(controller|dualsense|joy-?con|headset|charging station|game card|carry case|skin|mount)\b(?!.*\bconsole\b)/i,
  cameras: /\b(lens(?! kit)|tripod|battery|charger|memory card|sd card|strap|bag|filter|gimbal)\b(?!.*\bcamera\b)/i,
  drones: /\b(propellers?|battery|charging hub|landing pad|bag|filters?)\b(?!.*\bdrone\b)/i,
  printers: /\b(ink|toner|cartridge|paper|drum)\b(?!.*\bprinter\b)/i,
  "robot-vacuums": /\b(filter|brush|bags?|mop pads?|replacement)\b(?!.*\b(robot|vacuum)\b.*\b(robot|vacuum)\b)/i,
  ssds: /\b(enclosure|heatsink only|adapter|caddy)\b/i,
  motherboards: /\b(i\/o shield|cable|bracket)\b/i,
  routers: /\b(antenna|cable|power supply)\b/i,
  vacuums: /\b(replacement|spare|filters?|bags?|battery|batteries|brush ?(bar|roll|head)?|attachments?|accessor(y|ies)|tool kit|charging dock|wall (mount|bracket)|hose|nozzle|belt|wand)\b(?!.*\bvacuum\b)/i,
  "air-fryers": /\b(liners?|paper|rack|skewers?|accessor(y|ies)|silicone|tray|basket insert|cookbook|mitts?)\b(?!.*\bair ?fryer\b.*\b(fryer|oven)\b)/i,
  "coffee-machines": /\b(capsules?|pods?|beans|descal\w*|cleaning|tablets|tamper|milk jug|pitcher|knock box|portafilter|basket|filter|water filter|cups?|mugs?|grinder only|service kit|gasket)\b(?!.*\b(machine|maker)\b)/i,
  fridges: /\b(water filter|filter|replacement|shelf|drawer|door seal|gasket|ice tray|stand|plinth|hinge|reversal kit|cover)\b(?!.*\b(fridge|refrigerator|freezer)\b.*\d{2,4}\s?L\b)/i,
  "washing-machines": /\b(stacking kit|stack kit|pedestal|drawer|hose|tap|lint filter|cleaner|detergent|cover|shock|anti-?vibration|replacement)\b(?!.*\b\d{1,2}(\.\d)?\s?kg\b)/i,
  dishwashers: /\b(tablets|detergent|rinse aid|salt|cleaner|basket|rack|door panel|kickboard|plinth|hose|replacement)\b(?!.*\bplace settings?\b)/i,
  "hair-care": /\b(replacement|spare|attachment|diffuser|nozzle|comb attachment|guard|blades?|filter|storage (case|bag)|heat (mat|pouch))\b(?!.*\b(dryer|straightener|styler|clipper|trimmer|airwrap|supersonic|curler)\b)/i,
  "small-kitchen": /\b(replacement|spare|jug only|jar only|bowl only|blade assembly|filter|attachment)\b(?!.*\b(mixer|blender|processor|kettle|toaster|microwave|juicer|cooker|maker)\b)/i,
  bbqs: /\b(cover|mat|tool set|brush|cleaner|thermometer|regulator|hose|gas bottle|pellets|charcoal bag|briquettes|rotisserie kit|pizza stone|peel)\b(?!.*\b(bbq|barbecue|grill|smoker|oven)\b)/i,
  "coffee-gear": /\b(replacement|spare|burrs|filters|filter papers|hopper|dosing cup|cleaning tablets)\b(?!.*\b(grinder|kettle|scale|dripper|brewer)\b)/i,
};
export const isMoreAccessory = (category: CategoryId, t: string) => MORE_ACCESSORY[category]?.test(t) ?? false;

export type { Specs };
