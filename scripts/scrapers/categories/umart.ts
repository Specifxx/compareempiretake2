/** Umart / MSY (shared platform): server-rendered category pages, `goods_name` tiles + itemprop="price". */
import type { CategoryId, RawOffer, RetailerId } from "../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../lib/http";

type Cat = Exclude<CategoryId, "phones">;
const num = (s: string | undefined) => Number(String(s ?? "").replace(/[^0-9.]/g, ""));

const NOT_NEW = /refurb|renewed|open[- ]?box|ex[- ]?demo|b[- ]?grade|pre[- ]?owned|second[- ]?hand|\bused\b/i;

export const CATEGORY_PATHS: Partial<Record<Cat, string[]>> = {
  "graphics-cards": ["/pc-parts/computer-parts/graphics-cards-gpu-610"],
  monitors: ["/pc-parts/peripherals/monitors/monitors-680", "/pc-parts/peripherals/monitors/gaming-monitors-1110", "/pc-parts/peripherals/monitors/curved-monitors-1111"],
  laptops: ["/laptops-computers/laptops/laptops-by-brands-1198", "/laptops-computers/apple/apple-macbooks-1164"],
  tablets: ["/laptops-computers/laptops/laptops-by-brands/tablets-584", "/laptops-computers/apple/apple-ipad-880", "/laptops-computers/apple/apple-ipad-air-mini-881", "/laptops-computers/apple/apple-ipad-pro-882"],
  tvs: ["/household-appliances/television/4k-ultra-hd-tvs-600", "/household-appliances/television/smart-tvs-603"],
  cpus: ["/pc-parts/computer-parts/cpu-processors-611"],
  ssds: ["/pc-parts/storage-devices/ssd-hard-drives-580", "/pc-parts/storage-devices/external-ssd-hard-drives-987"],
  ram: ["/pc-parts/computer-parts/memory-ram/ddr5-ram-1085", "/pc-parts/computer-parts/memory-ram/ddr4-ram-659", "/pc-parts/computer-parts/memory-ram/laptop-sodimm-ram-664"],
  motherboards: ["/pc-parts/computer-parts/motherboards-104"],
  desktops: ["/laptops-computers/desktop-computers/branded-desktop-pcs-92", "/laptops-computers/desktop-computers/branded-gaming-pcs-729", "/laptops-computers/desktop-computers/gaming-pcs-ready2go-466", "/laptops-computers/desktop-computers/office-home-mini-pc-582", "/laptops-computers/desktop-computers/ai-workstation-pcs-1479"],
  routers: ["/pc-parts/networking/routers-569", "/pc-parts/networking/modem-routers-17"],
  printers: ["/pc-parts/printers-scanners/inkjet-printers-134", "/pc-parts/printers-scanners/laser-printers-135", "/pc-parts/printers-scanners/multifunction-printers-136"],
  headphones: ["/mobile-phones-digital/sound-audio-equipment/headphones-1379", "/pc-parts/peripherals/headphones-147"],
  speakers: ["/pc-parts/computer-parts/speakers/speakers-audio-systems-43", "/pc-parts/computer-parts/speakers/smart-speakers-1318"],
  soundbars: ["/pc-parts/computer-parts/speakers/speakers-audio-systems-43"],
  consoles: ["/laptops-computers/gaming/video-games-consoles-567"],
  // smartwatches: Umart/MSY "smart-watches-988" is generic unbranded watches only (no Apple/Garmin/Samsung); skipped.
  drones: ["/mobile-phones-digital/smart-devices/drones-527"],
  "robot-vacuums": ["/household-appliances/cleaning-appliances/robotic-vacuum-cleaner-1341"],
};

const RAM_ACC = /heatsink|cooler|\bfan\b|rgb (light|bar|kit)|fill(er)? kit|dummy|cable/i;

export const KEEP: Partial<Record<Cat, (t: string) => boolean>> = {
  "graphics-cards": (t) =>
    /\b(geforce|rtx|gtx|radeon|rx\s?\d{3,4}|arc\s?[ab]\d{3}|quadro)\b/i.test(t) &&
    !/bracket|riser|cable|support|holder|stand|mining|water ?block|backplate|extension|adapter|cooler|fan\b|kit\b|bundle(?!.*graphics)/i.test(t) &&
    !/\b(laptop|notebook|desktop pc|gaming pc)\b/i.test(t),
  monitors: (t) => /monitor|display|\d{2}(\.\d)?["”']|\d{2}(\.\d)?\s?inch/i.test(t) && !/\barm\b|\barms\b|mount|stand\b|bracket|cable|adapter|hood|cleaning|kvm|privacy filter|riser|\bdock\b/i.test(t),
  laptops: (t) =>
    !/\bbag\b|backpack|sleeve|\bcase\b|\bdock\b|docking|charger|power adapter|power supply|\bstand\b|cooling pad|cooler|warranty|applecare|care\b|support|onsite|upgrade|accidental|out-of-box|battery|screen protector|sodimm|\btablet\b|galaxy tab|\bipad\b/i.test(t),
  tablets: (t) =>
    /ipad|tab\b|tablet|galaxy tab|surface|lenovo tab|pad\b/i.test(t) && !/case|cover|folio|keyboard|pencil|stylus|screen protector|charger|cable|stand|mount|holder|sleeve|bag|warranty|applecare|apple care/i.test(t),
  tvs: (t) => /\btv\b|television|qled|oled|uhd|4k/i.test(t) && !/mount|bracket|stand\b|remote|cable|antenna|soundbar|media player|streaming|apple tv|chromecast|smart display/i.test(t),
  cpus: (t) => /\b(ryzen|core|xeon|threadripper|athlon|pentium|celeron|epyc|processor|cpu)\b/i.test(t) && !/cooler|cooling|heatsink|\bfan\b|thermal|paste|aio|liquid|bracket|delid|contact frame|motherboard|bundle/i.test(t),
  ssds: (t) => /ssd|nvme|m\.2|solid state/i.test(t) && /\d+\s?(gb|tb)/i.test(t) && !/enclosure|heatsink|heat sink|adapter|caddy|bracket|dock|cable|\bcase\b|converter|screw/i.test(t),
  ram: (t) => /ddr\d/i.test(t) && /\d+\s?gb/i.test(t) && !RAM_ACC.test(t),
  motherboards: (t) => !/\btpm\b|module|\bcard\b|i\/?o shield|cable|bracket|antenna|\bcpu\b.*bundle|header|adapter|riser|heatsink|cooler|\bfan\b|wifi card/i.test(t),
  desktops: (t) => /\bpc\b|desktop|computer|workstation|mini|nuc|tower|imac|mac (mini|studio)|all[- ]in[- ]one|\baio\b|ryzen|core|gaming/i.test(t) && !/case\b|chassis|monitor\b(?!.*pc)|keyboard|mouse|warranty|upgrade|barebone|vesa|mount|bracket/i.test(t),
  routers: (t) => /router|mesh|modem|wi-?fi\s?\d|\bdeco\b|orbi|velop|eero|gateway|ax\d{3,4}|be\d{4,5}/i.test(t) && !/antenna|cable|switch\b|adapter|extender|access point|usb|pcie|card|mount|bracket|power supply|license|licence/i.test(t),
  printers: (t) => /printer|mfc|multifunction|all[- ]in[- ]one|laserjet|officejet|deskjet|ecotank|pixma|maxify|workforce|imageclass|\bmfp\b/i.test(t) && !/\bink\b|toner|cartridge|\bpaper\b|drum|ribbon|label|tape|maintenance|fuser|tray|cable|warranty|bottle|refill/i.test(t),
  headphones: (t) => /headphone|headset|earbud|earphone|\bbuds\b|airpods|in-ear|over-ear|on-ear|\btws\b/i.test(t) && !/stand\b|hanger|holder|\bcase\b|cover|ear ?pads?|cushion|hard ?case|pouch|cable|adapter|replacement|tips\b|splitter|amp\b|dac\b/i.test(t),
  soundbars: (t) => /soundbar|sound bar/i.test(t) && !/mount|bracket|cable|remote|stand\b/i.test(t),
  speakers: (t) => !/soundbar|sound bar/i.test(t) && /speaker|subwoofer|\becho\b|homepod|nest audio|boombox|party/i.test(t) && !/stand\b|mount|bracket|cable|cover|\bcase\b|grille|wire/i.test(t),
  consoles: (t) =>
    /playstation|\bps5\b|xbox series|nintendo switch|switch (2|oled|lite)|steam deck|rog ally|rog xbox ally|legion go|msi claw|\bclaw (a?\d)/i.test(t) &&
    !/controller|gamepad|joy-?con|headset|charging|charger|\bfan\b|\bcase\b|cover|skin|stand\b|cable|game card|membership|subscription|gift|wheel|remote|camera|grip|protector|\bbag\b|dock\b|vr2?\b|portal|tetris|retro/i.test(t),
  smartwatches: (t) =>
    /apple watch|galaxy watch|pixel watch|garmin|fitbit|amazfit|huawei watch|redmi watch|xiaomi (smart )?watch|suunto|coros|polar\b|withings|ticwatch|oppo watch|oneplus watch/i.test(t) &&
    !/strap|band only|charger|cable|protector|\bcase\b|cover|stand\b|dock|kids/i.test(t),
  drones: (t) => /drone|dji|mavic|mini \d|avata|neo|flip|air \d/i.test(t) && !/battery|propeller|charger|hub|bag|\bcase\b|filter|controller|landing|guard|cable|lanyard|strap|sd card|care|backpack|handle|osmo/i.test(t),
  "robot-vacuums": (t) => /robot|robotic|roomba|roborock|deebot|vacuum/i.test(t) && !/filter|brush|mop pad|bag\b|replacement|accessor|kit\b|cloth|battery|dust ?bag/i.test(t),
};

export function splitMpn(raw: string): { title: string; mpn?: string } {
  // "... Monitor (KG241YP6(UM.QX1SA.601-RY0))": model code wrapping the part number.
  const n = raw.match(/\s*\(([A-Za-z0-9][A-Za-z0-9._+\- ]{2,30})\(([A-Za-z0-9][A-Za-z0-9/._+#\- ]{2,40})\)\)\s*$/);
  if (n) return { title: raw.slice(0, n.index).trim(), mpn: n[2].trim() };
  const m = raw.match(/\s*\(\s*([A-Za-z0-9][A-Za-z0-9/._+#\- ]{2,40})\)\s*$/);
  if (m && /\d/.test(m[1]) && !/^\d+(\.\d+)?\s?(gb|tb|hz|"|inch)?$/i.test(m[1])) return { title: raw.slice(0, m.index).trim(), mpn: m[1].trim() };
  return { title: raw.trim() };
}

/** Categories added after the first six: these titles often embed the part number mid-title ("ADATA 1TB SLEG-900P-1TCS ..."). */
const LEGACY: Cat[] = ["graphics-cards", "monitors", "laptops", "tablets", "tvs"];
const SPEC_TOKEN = /^(\d+(\.\d+)?(gb|tb|mb|mhz|ghz|hz|mb\/s|gb\/s|w|mm|mah|in|cm|ms|db|ft|m)|ddr\d\w*|lpddr\w*|pcie\w*|gen\d\w*|usb\w*|m\.2|lga\d*|am\d|str\d|ax\d+|be\d+|wi-?fi\w*|nvme|sata\w*|cl\d+|\d+x\d+gb|rtx\d*|gtx\d*|rx\d*|x3d\w*|1080p|1440p|2160p|\d+p|\d+k|dc\d|wifi\d\w*|802\.\w+|i\d-\d+\w*|\d+-core|\d+-pin|\d+-port|usb-c|type-c)$/i;
export function guessMpn(title: string): string | undefined {
  const toks = title.split(/[\s,()]+/).map((t) => t.replace(/^[-–]+|[-–.]+$/g, ""));
  const c = toks.filter(
    (t) => t.length >= 7 && /\d/.test(t) && /[A-Za-z]/.test(t) && /^[A-Za-z0-9][A-Za-z0-9\-\/.#+]+$/.test(t) && !SPEC_TOKEN.test(t) && t.replace(/[^0-9]/g, "").length >= 2 && !/^[a-z]/.test(t) && t.toLowerCase() !== toks[0].toLowerCase(),
  );
  return c.sort((a, b) => b.length - a.length)[0];
}

export async function scrapeUmartLike(retailer: RetailerId, BASE: string, cat: Cat): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (const path of CATEGORY_PATHS[cat] ?? []) {
    let prevFirst = "";
    for (let page = 1; page <= 40; page++) {
      let html: string;
      try {
        html = await get(`${BASE}${path}?page=${page}`);
      } catch (e) {
        if (page === 1) throw e;
        break;
      }
      // Only the main product list (tiles sit in `content_holder1`); skip the "Personalised Deals" carousel.
      const tiles = html.split('class="goods_name"');
      let pos = tiles[0].length;
      let seen = 0, first = "";
      for (const tile of tiles.slice(1)) {
        const tileStart = pos;
        pos += 'class="goods_name"'.length + tile.length;
        const t = tile.slice(0, 5000);
        const link = t.match(/<a href="([^"]+)" title="([^"]+)"/);
        const before = html.slice(Math.max(0, tileStart - 2500), tileStart);
        if (!link || !/content_holder1">\s*<div\s*$/.test(before)) continue;
        seen++;
        if (!first) first = link[1];
        const sec = t.slice(Math.max(0, t.indexOf("goods_price_section")));
        // The first itemprop="price" in a tile can be a masked member price ("XX.60"); read the shopper's price.
        const price = num(sec.match(/itemprop="price" content="([\d.,]+)"/)?.[1]);
        if (!price) continue;
        const split = splitMpn(decodeEntities(link[2]));
        const title = split.title;
        const legacy = LEGACY.includes(cat);
        // Trailing "(2-Pack)" / "(rev. 1.2)" are not part numbers.
        const splitMpnOk = split.mpn && (legacy || !/pack\b|^rev\b|^ver\b|mt\/s|mhz/i.test(split.mpn));
        const mpn = splitMpnOk ? split.mpn : legacy ? undefined : guessMpn(title);
        if (out.has(link[1]) || NOT_NEW.test(title) || !(KEEP[cat]?.(title) ?? true)) continue;
        const img = [...before.matchAll(/<img[^>]*src="([^"]+)"/g)].at(-1)?.[1];
        const dataBrand = sec.match(/itemprop="brand">([^<]+)</)?.[1]?.trim();
        const brand = dataBrand ? decodeEntities(dataBrand) : title.split(/\s+/)[0];
        const was = num(t.match(/class="[^"]*(?:market_price|old_price|was_price|rrp)[^"]*"[^>]*>[^0-9]*([\d,]+\.?\d*)/i)?.[1]);
        out.set(link[1], {
          retailer,
          sku: link[1].match(/-(\d+)$/)?.[1] ?? link[1],
          title,
          brand,
          mpn,
          url: link[1].startsWith("http") ? link[1] : BASE + link[1],
          price,
          wasPrice: was > price ? was : undefined,
          image: img?.startsWith("http") ? img : img ? BASE + img : undefined,
          inStock: /schema\.org\/InStock/.test(sec) || /goods_stock[^>]*><span>In Stock/i.test(sec),
        } as RawOffer);
      }
      if (!seen || first === prevFirst) break;
      prevFirst = first;
      await sleep(700);
    }
  }
  return [...out.values()];
}

const BASE = "https://www.umart.com.au";
export const scrapers: Partial<Record<Cat, () => Promise<RawOffer[]>>> = Object.fromEntries(
  (Object.keys(CATEGORY_PATHS) as Cat[]).map((c) => [c, () => scrapeUmartLike("umart", BASE, c)]),
);
