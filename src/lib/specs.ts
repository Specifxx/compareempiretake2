/**
 * Reading key specs out of store titles, one title at a time, and the curated spec sheets in data/specs/.
 *
 * Each title gives its own reading and the product shows the most common one (`vote`): a single store that
 * lists the wrong model under a product, or a title that mentions a second mode ("5K 165Hz / 1440p 330Hz"),
 * no longer decides the row for every store (Bill's US review, 2026-11-06: the LG 27GM950B showed "4K · OLED").
 */
import type { CategoryId, Specs } from "./types";

/** The most common non-empty reading; ties go to the first one seen. */
export function vote<T>(xs: (T | undefined)[]): T | undefined {
  const c = new Map<T, number>();
  for (const x of xs) if (x !== undefined && x !== null && x !== ("" as unknown as T)) c.set(x, (c.get(x) ?? 0) + 1);
  let best: T | undefined;
  let n = 0;
  for (const [k, v] of c) if (v > n) [best, n] = [k, v];
  return best;
}

// ---- Processors (laptops, desktops, tablets) ----

/**
 * The processor a title names, in one spelling: "U7-265HX" and "Intel Core Ultra 7 265HX" are both
 * "Intel Core Ultra 7 265HX"; "RAI 9 HX 370" is "AMD Ryzen AI 9 HX 370". Undefined when the title names none.
 */
export function cpuName(t: string): string | undefined {
  let m: RegExpMatchArray | null;
  // Intel Core Ultra, series 1-3: "Core Ultra 7 155H", "Ultra 9 386H", "Ultra X7 358H", "U7-265HX", "Ultra 7-256V".
  if ((m = t.match(/\b(?:Intel\s+)?(?:Core\s+)?Ultra\s*(X?[3579])(?:[-\s]+(\d{3}(?!\s?[GT]B)[A-Z]{0,2})\b)?(?:\s+(Plus)\b)?(?!G)/i)) && (m[2] || /\b(core|intel)\s+ultra/i.test(m[0])))
    return `Intel Core Ultra ${m[1].toUpperCase()}${m[2] ? ` ${m[2].toUpperCase()}` : ""}${m[2] && m[3] ? " Plus" : ""}`;
  if ((m = t.match(/\bU([3579])[-\s](\d{3}[A-Z]{0,2})\b/))) return `Intel Core Ultra ${m[1]} ${m[2].toUpperCase()}`;
  // Intel Core i3-i9: "i7-14650HX", "Core i5 1335U", "Core i7".
  if ((m = t.match(/\b(?:Intel\s+)?(?:Core\s*)?i([3579])(?:[-\s]?(\d{4,5}[A-Z]{0,2}))?\b/i)) && (m[2] || /core\s*i\d/i.test(m[0])))
    return `Intel Core i${m[1]}${m[2] ? `-${m[2].toUpperCase()}` : ""}`;
  // Intel Core 3/5/7 (series 1/2): "Core 5 120U", "Core 7 240H".
  if ((m = t.match(/\b(?:Intel\s+)?Core\s+([3579])[-\s](\d{3}[A-Z]{0,2})\b/i))) return `Intel Core ${m[1]} ${m[2].toUpperCase()}`;
  // AMD Ryzen: "Ryzen AI 9 HX 370", "RAI 9 HX 370", "Ryzen AI MAX+ 395", "Ryzen 7 8845HS", "R7-7735HS", "Ryzen 5 7520U".
  if ((m = t.match(/\b(?:AMD\s+)?(?:Ryzen\s*|R)(AI\s+)?(?:MAX(\+?)\s+(?:PRO\s+)?(\d{3})|(?:PRO\s+)?([3579])[-\s]?(?:(HX|PRO)\s+)?(\d{3,4}(?!\s?[GT]B)[A-Z]{0,3}\d?)\b)/i))) {
    if (m[3]) return `AMD Ryzen AI Max${m[2] ? "+" : ""} ${m[3]}`;
    if (/^R\d/i.test(m[0].replace(/^AMD\s+/i, "")) && !m[6]) return undefined;
    return `AMD Ryzen ${m[1] ? "AI " : ""}${m[4]}${m[5] ? ` ${m[5].toUpperCase()}` : ""} ${m[6].toUpperCase()}`;
  }
  if ((m = t.match(/\bRyzen\s*(AI\s+)?([3579])\b/i))) return `AMD Ryzen ${m[1] ? "AI " : ""}${m[2]}`;
  // Snapdragon X: "Snapdragon X Elite", "Snapdragon X2 Elite X2E88100", "Snapdragon X Plus 8-core".
  if ((m = t.match(/\bSnapdragon\s*(X\d?)\s*(Elite|Plus)?(?:\s+(Extreme))?/i)))
    return `Snapdragon ${m[1].toUpperCase()}${m[2] ? ` ${m[2][0].toUpperCase()}${m[2].slice(1).toLowerCase()}` : ""}${m[3] ? " Extreme" : ""}`;
  if (/\b(?:RTX|Spark|NVIDIA)\b/i.test(t) && (m = t.match(/\b(N1X?)\b/i))) return `NVIDIA ${m[1].toUpperCase()}`;
  // Apple silicon: "M4 Pro", "M5" — only in an Apple title, where a bare "M4" can't be a model code.
  if (/\b(apple|macbook|imac|mac mini|mac studio|ipad)\b/i.test(t) && (m = t.match(/\b(?:Apple\s+)?M(\d)(?:\s+(Pro|Max|Ultra))?\b(?!\s*\.)/)))
    return `Apple M${m[1]}${m[2] ? ` ${m[2]}` : ""}`;
  // Low-end Intel and AMD.
  if ((m = t.match(/\b(?:Intel\s+)?(Celeron|Pentium(?:\s+(?:Silver|Gold))?)\s*(N?\d{3,4}[A-Z]?)?\b/i))) return `Intel ${m[1].replace(/\s+/g, " ")}${m[2] ? ` ${m[2].toUpperCase()}` : ""}`;
  if ((m = t.match(/\b(?:Intel\s+)?(?:Processor\s+)?(N[12]?\d{2,3})\b/)) && /intel|processor|celeron|\bN\d{3}\b/i.test(t) && /^N(\d{2,3}|[12]\d{2,3})$/.test(m[1]) && Number(m[1].slice(1)) >= 50)
    return `Intel ${m[1]}`;
  if ((m = t.match(/\b(?:AMD\s+)?Athlon\s+(Silver|Gold)(?:\s+(\d{4}[A-Z]?))?/i))) return `AMD Athlon ${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()}${m[2] ? ` ${m[2]}` : ""}`;
  if ((m = t.match(/\bMediaTek\s+(Kompanio\s+\d{3,4}\w*)/i))) return `MediaTek ${m[1]}`;
  return undefined;
}

/** A laptop's or desktop's discrete graphics: "RTX 5070 Ti", "RTX Pro 3000", "RTX 500 Ada". */
export function dedicatedGpu(t: string): string | undefined {
  let m: RegExpMatchArray | null;
  if ((m = t.match(/\bRTX\s?(?:PRO\s+)?(\d{3,4})\s+Ada\b/i))) return `RTX ${m[1]} Ada`;
  if ((m = t.match(/\bRTX\s+PRO\s+(\d{3,4})\b/i))) return `RTX PRO ${m[1]}`;
  if ((m = t.match(/\b(RTX|GTX)\s?-?(\d{4})\s?(Ti|SUPER)?\b/i))) return `${m[1].toUpperCase()} ${m[2]}${m[3] ? ` ${/ti/i.test(m[3]) ? "Ti" : "SUPER"}` : ""}`;
  if ((m = t.match(/\b(?:Radeon\s+)?RX\s?(\d{4}[A-Z]?)\s?(XTX|XT|GRE)?\b/i))) return `Radeon RX ${m[1].toUpperCase()}${m[2] ? ` ${m[2].toUpperCase()}` : ""}`;
  return undefined;
}

// ---- Screens (TVs, monitors) ----

/** One title's resolution, the highest it names; explicit pixel counts win over words. */
export function resolutionOf(t: string): string | undefined {
  const px = [...t.matchAll(/\b(\d{4})\s?[x×]\s?(\d{3,4})\b/g)].map((m) => [Number(m[1]), Number(m[2])] as const);
  const fromPx = (w: number, h: number) =>
    w >= 7680 ? "8K" : w >= 5120 && h >= 2880 ? "5K" : w >= 5120 && h >= 2160 ? "5K2K (5120×2160)" : w >= 3840 && h >= 2160 ? "4K UHD" : w >= 3840 ? "Dual QHD (3840×1080)" : w >= 3440 && h >= 1440 ? "UWQHD (3440×1440)" : w >= 2560 && h >= 1440 ? "QHD (1440p)" : w >= 2560 ? "UWFHD (2560×1080)" : w >= 1920 && h >= 1080 ? "Full HD (1080p)" : h >= 720 ? "HD (720p)" : undefined;
  if (px.length) {
    const [w, h] = px.sort((a, b) => b[0] * b[1] - a[0] * a[1])[0];
    const r = fromPx(w, h);
    if (r) return r;
  }
  if (/\b8K\b/i.test(t)) return "8K";
  if (/\b5K2K\b|\bWUHD\b/i.test(t)) return "5K2K (5120×2160)";
  if (/\b5K\b|\b2880p\b/i.test(t)) return "5K";
  if (/\b(4K|UHD|2160p)\b/i.test(t)) return "4K UHD";
  if (/\b(UWQHD|WQHD\+?\s?ultrawide|3440p)\b/i.test(t)) return "UWQHD (3440×1440)";
  if (/\b(QHD|WQHD|1440p|2K)\b/i.test(t)) return "QHD (1440p)";
  if (/\b(FHD|1080p|Full HD)\b/i.test(t)) return "Full HD (1080p)";
  if (/\b(HD Ready|720p)\b/i.test(t) || /\bHD\b/.test(t)) return "HD (720p)";
  return undefined;
}

/** One title's panel: the display technology first, Mini LED with its panel type when both are named. */
export function panelOf(t: string): string | undefined {
  if (/\bQD-?OLED\b/i.test(t)) return "QD-OLED";
  if (/\b(W?OLED|OLED)\b/i.test(t) && !/\bnon-?oled\b/i.test(t)) return "OLED";
  if (/\bNeo\s?QLED\b/i.test(t)) return "Neo QLED (Mini LED)";
  const base = t.match(/\b(IPS|VA|TN)\b/)?.[1];
  if (/\bMini[- ]?LED\b/i.test(t)) return base ? `Mini LED ${base}` : "Mini LED";
  if (/\bQLED\b/i.test(t)) return "QLED";
  if (/\bQNED\b/i.test(t)) return "QNED";
  if (base) return base;
  if (/\bLED\b/i.test(t)) return "LED";
  return undefined;
}

/** One title's top refresh rate (a dual-mode monitor's faster mode). */
export function refreshOf(t: string): number | undefined {
  const hz = [...t.matchAll(/(\d{2,3})\s?Hz/gi)].map((m) => Number(m[1])).filter((n) => n >= 50 && n <= 750);
  return hz.length ? Math.max(...hz) : undefined;
}

// ---- Phones ----

/** A phone's chip, as Apple, Qualcomm, Google, MediaTek or Samsung name it. */
export function phoneChip(t: string): string | undefined {
  const m = t.match(
    /\b(A\d{2}(?: Pro| Bionic)?(?= chip| Bionic|\b)(?=.*\b(?:iphone|apple)\b)|Snapdragon[ ®]*(?:8 Elite(?: Gen \d)?|\d+s?\+? Gen \d|\d{3}\w?)|Tensor G\d|Dimensity \d{3,4}\w*(?: Ultra| Plus| Pro)?|Exynos \d{4}|Helio [A-Z]\d+|Unisoc \w+)/i,
  )?.[1];
  return m?.replace(/[ ®]+/g, " ").replace(/^snapdragon/i, "Snapdragon").replace(/^dimensity/i, "Dimensity").replace(/^tensor/i, "Tensor").replace(/^exynos/i, "Exynos").trim();
}

/** Phone specs from every store title for the model (and the store's blurb): each figure voted over the titles. */
export function phoneSpecs(model: string, texts: string[]): Specs {
  const num = (re: RegExp, t: string, pick: (xs: number[]) => number) => {
    const xs = [...t.matchAll(re)].map((m) => Number(m[1])).filter((n) => n > 0);
    return xs.length ? pick(xs) : undefined;
  };
  const screen = vote(texts.map((t) => num(/(\d\.\d{1,2})\s*(?:''|"|”|’’|-?\s?inch)/gi, t, (xs) => xs[0])).filter((s) => s && s > 4 && s < 9));
  const battery = vote(texts.map((t) => num(/(\d{4,5})\s?mAh/gi, t, (xs) => Math.max(...xs))).filter((b) => b && b < 12000));
  const camera = vote(texts.map((t) => num(/(\d{2,3})\s?MP\b/gi, t, (xs) => Math.max(...xs))).filter((c) => c && c <= 200));
  const all = texts.join(" \n ");
  const has5g = /\b5G\b/.test(all);
  const has4g = /\b4G\b/.test(all);
  return {
    screenInches: screen,
    batteryMah: battery,
    mainCameraMp: camera,
    chip: vote(texts.map(phoneChip)),
    network: has4g && !has5g ? "4G" : "5G",
    foldable: /\b(fold|flip|razr|magic v|iphone duo)/i.test(model),
    esimOnly: /esim only/i.test(all) || undefined,
  };
}

// ---- The compare table's rows ----

/**
 * The rows each category's comparison shows, in order, so every product in the table has the same rows and a missing
 * figure reads "—" in its own row (rather than the row appearing only when some product happens to have it).
 * Rows after these are any other spec a chosen product has.
 */
export const SPEC_ROWS: Partial<Record<CategoryId, string[]>> = {
  laptops: ["Processor", "Graphics", "Memory", "Storage", "Screen"],
  desktops: ["Processor", "Graphics", "Memory", "Storage"],
  tablets: ["Screen", "Chip"],
  tvs: ["Screen size", "Resolution", "Panel", "Refresh rate"],
  monitors: ["Screen size", "Resolution", "Panel", "Refresh rate", "Curved"],
  "graphics-cards": ["GPU", "Memory", "Memory type"],
};

/**
 * The titles to read specs from: those naming the product's own model code when any do. A page that holds a stray
 * listing of another model (a store's 27GX704A under the 27GM950B) then reads the 27GM950B's own titles.
 */
export function ownTitles(titles: string[], codes?: string[], name?: string): string[] {
  const flat = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
  // The code the product's own name carries, else its most common one.
  const code = flat((name && codes?.find((c) => flat(name).includes(flat(c)))) ?? codes?.[0] ?? "");
  if (!code || code.length < 5) return titles;
  const own = titles.filter((t) => flat(t).includes(code));
  return own.length ? own : titles;
}
