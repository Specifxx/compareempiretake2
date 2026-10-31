import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { isAppliance } from "../appliances";
import { decodeEntities, get, sleep } from "../../lib/http";

const BASE = "https://www.costco.com.au";

const JUNK = /refurb|renewed|open[- ]?box|ex[- ]?demo|pre[- ]?owned|b[- ]grade|second[- ]hand/i;
const SIZE = /\d{2}(?:\.\d)?(?:"|''|-inch| ?inch)/i; // Costco writes "65 Inch"


// --- Keep-tests for the newer categories (same in every store file) ---
const ACC = /screen protector|\bcharger\b|charging (cable|dock|stand|hub|station)\b|\bcable\b|\bcover\b|\bskin\b|\bsleeve\b|\bmount\b|\bbracket\b|gift card/i;
const KEEP = {
  smartwatches: (t: string) =>
    /\d{2}(?:\.\d)?\s?mm\b/i.test(t) &&
    /watch|fenix|f[eē]nix|forerunner|venu|instinct|vivoactive|epix|enduro|approach|descent|tactix|quatix|amazfit|fitbit|suunto|polar|coros/i.test(t) &&
    !/(?<!(?:charging|aluminium|titanium|steel|ceramic|resin|plastic|fibre-reinforced polymer) )\bcase\b(?! with|,)|\bbumper\b|replacement|\bstraps? only|kids|\bframe\b|\b(band|strap|loop|charger|case|protector)s? for\b|\bfor (apple|samsung|galaxy|garmin|google|pixel)\b|^(3sixt|cygnett|otterbox|spigen|belkin|uniq|mbeat|efm|zagg|incipio|tech21|casetify)\b/i.test(t) &&
    !/^(?!.*(apple watch|galaxy watch|pixel watch|garmin|fitbit|amazfit|huawei watch|oppo watch|xiaomi watch)).*\b(band|strap|loop)\b/i.test(t) &&
    !ACC.test(t) &&
    // Apple Watch titles always say "... Case with ... Band"; anything else naming a band is a band.
    !(/apple watch/i.test(t) && !/\bcase\b/i.test(t)) &&
    !(/\b(bands?|straps?|brand)\b/i.test(t) && !/case with|watch ?(\d|ultra|classic|se\b|fe\b)|fenix|forerunner|venu|instinct|epix/i.test(t)),
  desktops: (t: string) =>
    !/laptop|notebook|cooler|\bfans?\b|monitor(?! included)\b|keyboard$|mouse$|\bstand\b|\bdock\b|\bmemory\b|webcam|speaker|headset|holder|\bcase\b(?!.*(pc|desktop))|\bram\b$/i.test(t) && !ACC.test(t),
  printers: (t: string) =>
    /printer|maxify|megatank|ink ?tank|imageclass|workforce|\bmfc|all[- ]in[- ]one|multifunction|ecotank|laserjet|officejet|pixma|deskjet|scanner(?!.*only)/i.test(t) &&
    !/cartridge|toner(?! printer| tank)|\bink (bottle|pack|refill|cartridge)|\bpaper\b|filament|\b3d\b|label|\bdrum\b|ribbon|photo printer paper|\bfilm\b|instax|zink|thermal|pocket (photo )?printer|instant digital printer|hi-print|scanner$|\bscanner\b(?!.*printer)/i.test(t) &&
    !ACC.test(t),
  routers: (t: string) =>
    /router|\bmesh\b|modem|wi-?fi \d (system|pack)|deco|orbi|eero|nighthawk|access point/i.test(t) &&
    !/extender|repeater|powerline|usb (wi-?fi )?adapter|\badapter\b|antenna|\bswitch\b|range ext|\bcable\b/i.test(t),
  soundbars: (t: string) =>
    /sound ?bar|home theatre (system|in a box)/i.test(t) &&
    !/\bmount\b|bracket|\bcable\b|\bremote\b|\bcover\b|wall ?mount|^(?!.*sound ?bar.*(with|&|\+)).*(rear speakers?|surround speakers?|subwoofer)\b(?!.*sound ?bar)/i.test(t),
  headphones: (t: string) =>
    !/ear ?tips|(?<!charging )\bcase\b(?! with)|\bcable\b|adapter|cushions?|ear ?pads|replacement|\bstand\b|ear ?hooks?|\bcharger\b|\bcover\b|\bskin\b|\bstrap\b|\bsleeve\b|amplifier|\bdac\b|transmitter|hearing aid|microphone$/i.test(t),
  speakers: (t: string) =>
    !/\bstand\b|\bmount\b|bracket|\bcable\b|\bcover\b|\bcase\b|\bbattery\b|\bremote\b|subwoofer|sound ?bar|wall plate|microphone$|charging (dock|base)|\bbag\b|ceiling|in-wall|turntable|receiver|amplifier/i.test(t),
  consoles: (t: string) =>
    /console|playstation ?5|\bps5\b|xbox series|nintendo switch|switch 2|switch oled|steam deck|rog (xbox )?ally|legion go|msi claw|handheld/i.test(t) &&
    !/controller|dualsense|joy-?con|\bgame\b(?! console)|\bheadset\b|charg|\bcase\b|\bcover\b|\bstand\b|\bskin\b|protector|\bgrip\b|membership|subscription|gift card|\bcable\b|\bcamera\b|\bvr\b|portal|\bremote\b|storage|\bssd\b|expansion|amiibo|\bbag\b|\bpouch\b|\bmount\b|faceplate|cover plate|disc drive|vertical|cooling|\bfan\b|\bkit\b|\bdock\b(?! set)|steering|wheel|arcade|^(?!.*(console|handheld)).*\b(ps5|ps4|switch 2|xbox)$/i.test(t),
  cameras: (t: string) =>
    !/^(?!.*(camera|\bkit\b|body|gopro|hero ?\d|osmo|insta360|pocket ?\d|eos|lumix|alpha|x100|zv-)).*$/i.test(t) &&
    !/\blens\b(?!.*(kit|camera|with))|memory card|\bsd card|\bbattery\b(?! grip kit)|\bbag\b|tripod|\bstrap\b|\bmount\b|\bcase\b|charger|\bfilter\b|\bgrip\b(?!.*camera)|housing|microphone|dash ?cam|security|doorbell|webcam|\bflash\b|speedlite|selfie stick|osmo mobile|instax|polaroid|instant camera|gimbal(?!.*camera)|film\b(?! camera)|printer|kids|toy/i.test(t),
  drones: (t: string) =>
    /drone|dji (mini|air|mavic|avata|neo|flip|lito)|fly more|potensic|holy ?stone/i.test(t) &&
    !/battery|propellers?|charging (hub|station)|\bbag\b|\bcase\b|filters?|guards?|landing|goggles(?!.*combo)|^(?!.*(combo|drone)).*\b(controller|rc)\b|care refresh|\bstrap\b|\bmount\b|\bdisplay\b|\bcable\b|\bcharger\b|motion controller$|remote controller$|\btoy\b(?!.*drone)/i.test(t),
  "robot-vacuums": (t: string) =>
    /robot|robotic|roomba|deebot|roborock|dreame|\bmop\b|vacuum/i.test(t) &&
    !/\bbags?\b|\bfilters?\b|\bbrush(es)?\b(?! ?roll)|mop pads?|\bpads?\b|replacement|accessor(y|ies)|solution|detergent|\bbattery\b|\bkit\b|lawn|mower|window|pool|\bcloth/i.test(t),
};

type Cat = { paths: string[]; keep: (t: string) => boolean };
const CATS: Partial<Record<Exclude<CategoryId, "phones">, Cat>> = {
  tvs: {
    paths: ["/Electronics/TVs-Projectors/TVs/c/cos_21.1.2"],
    keep: (t) => /tv\b|television/i.test(t) && SIZE.test(t) && !/bezel|soundbar|projector|mount|bracket|\bstand\b|remote|antenna|cable/i.test(t),
  },
  monitors: {
    // Costco files monitors with projectors.
    paths: ["/Computers/Monitors/c/cos_22.3", "/Electronics/TVs-Projectors/Monitors-Projectors/c/cos_21.2"],
    keep: (t) =>
      /monitor|display/i.test(t) && SIZE.test(t) && !/projector|monitor arms?\b|\barm\b|riser|bracket|cable/i.test(t),
  },
  laptops: {
    paths: ["/Computers/Laptops/c/cos_22.1", "/Computers/Gaming/Gaming-Laptops/c/cos_22.15.4"],
    keep: (t) => !/\bbag\b|sleeve|\bcase\b|backpack|charger|\bdock\b|\bstand\b|mouse|imac|desktop|all-in-one|mac mini|cover/i.test(t),
  },
  tablets: {
    paths: ["/Computers/iPads-Tablets/iPads/c/cos_22.7.2", "/Computers/iPads-Tablets/Tablets/c/cos_22.7.1"],
    keep: (t) =>
      /\d+\s?(gb|tb)/i.test(t) &&
      !/^(?!.*tablet).*\bcase\b|cover\b|folio|keyboard|pencil|stylus|protector|kindle|kobo|ereader|charger|sleeve|\bstand\b/i.test(t),
  },
  "smartwatches": {
    paths: ["/Electronics/Smart-Watches/c/cos_22.13"],
    keep: KEEP["smartwatches"],
  },
  "desktops": {
    paths: ["/Computers/PCs-iMac/c/cos_22.2"],
    keep: KEEP["desktops"],
  },
  "printers": {
    paths: ["/Computers/Printers-Scanners/c/cos_22.6"],
    keep: KEEP["printers"],
  },
  "routers": {
    paths: ["/Computers/Networking-Routers/c/cos_22.8"],
    keep: KEEP["routers"],
  },
  "soundbars": {
    paths: ["/Electronics/Audio/Home-Theatre-Soundbars/c/cos_21.5.1"],
    keep: KEEP["soundbars"],
  },
  "headphones": {
    paths: ["/Electronics/Audio/Headphones/c/cos_21.9.6", "/Electronics/Audio/AirPods/c/cos_21.9.9", "/Electronics/Audio/Samsung-Galaxy-Buds/c/cos_21.9.8"],
    keep: KEEP["headphones"],
  },
  "speakers": {
    paths: ["/Electronics/Audio/Speakers/c/cos_21.5.2"],
    keep: KEEP["speakers"],
  },
  "consoles": {
    paths: ["/Computers/Gaming/Gaming-Consoles/c/cos_22.15.1"],
    keep: KEEP["consoles"],
  },
  "cameras": {
    paths: ["/Electronics/Cameras/c/cos_21.8"],
    keep: KEEP["cameras"],
  },
  "drones": {
    paths: ["/Electronics/Cameras/c/cos_21.8"],
    keep: KEEP["drones"],
  },
  "robot-vacuums": {
    paths: ["/Appliances/Vacuums-Floorcare/Robot-Vacuums/c/cos_2.7.3"],
    keep: KEEP["robot-vacuums"],
  },
  vacuums: {
    paths: ["/Appliances/Vacuums-Floorcare/Stick-Hand-Held-Vacuums/c/cos_2.7.2", "/Appliances/Vacuums-Floorcare/Vacuum-Cleaners/c/cos_2.7.1"],
    keep: (t) => isAppliance("vacuums", t),
  },
  "air-fryers": {
    paths: ["/Appliances/Kitchen-Appliances/Air-Fryers-Deep-Fryers/c/cos_2.3.5"],
    keep: (t) => isAppliance("air-fryers", t),
  },
  "coffee-machines": {
    paths: ["/Appliances/Coffee-Drink-Makers/Coffee-Espresso-Machines/c/cos_2.4.4"],
    keep: (t) => isAppliance("coffee-machines", t),
  },
  fridges: {
    paths: ["/Appliances/Fridges-Freezers/c/cos_2.1"],
    keep: (t) => isAppliance("fridges", t),
  },
  "washing-machines": {
    paths: ["/Appliances/Washers-Dryers/c/cos_2.6"],
    keep: (t) => isAppliance("washing-machines", t),
  },
  dishwashers: {
    paths: ["/Appliances/Dishwashers/c/cos_2.2"],
    keep: (t) => isAppliance("dishwashers", t),
  },
};

const num = (s?: string) => (s ? Number(s.replace(/,/g, "")) : 0);

/** Costco titles usually end with the model code, e.g. "... 4K Smart TV 65QNED86BSA". */
function mpnOf(title: string): string | undefined {
  // Dyson's part numbers are all digits: "Dyson V15 Detect Absolute Vacuum 626408-01".
  const dyson = title.match(/\b(\d{6}-\d{2})\s*$/)?.[1];
  if (dyson) return dyson;
  const last = title.trim().split(/\s+/).pop() ?? "";
  const mid = title.match(/\b[A-Z0-9]{3,}-[A-Z0-9]{3,}(?:AU)?\b/)?.[0];
  if (mid && /\d/.test(mid) && /[A-Z]/.test(mid) && !/^(SM|USB)-?$/.test(mid)) return mid;
  return last.length >= 5 && /\d/.test(last) && /[A-Z]/.test(last) && !/^\d+(gb|tb|hz)$/i.test(last) && last === last.toUpperCase()
    ? last
    : undefined;
}

async function scrapeCategory(cat: Exclude<CategoryId, "phones">): Promise<RawOffer[]> {
  const { paths, keep } = CATS[cat]!;
  const out = new Map<string, RawOffer>();
  for (const p of paths) {
    for (let page = 0; page < 15; page++) {
      const html = await get(`${BASE}${p}?currentPage=${page}`);
      let fresh = 0;
      for (const tile of html.split(/(?=<a[^>]*class="thumb"[^>]*href="[^"]*\/p\/\d+")/).slice(1)) {
        const t = tile.slice(0, 12000);
        const url = t.match(/href="([^"]+\/p\/\d+)"/)?.[1];
        const id = url?.split("/p/")[1];
        if (!url || !id || out.has(id)) continue;
        fresh++;
        const title = decodeEntities(t.match(/title="([^"]+)"/)?.[1] ?? "").trim();
        const panel = t.slice(t.indexOf("price-panel"), t.indexOf("product-list-details"));
        const prices = [...panel.matchAll(/\$\s*([\d,]+\.\d\d)/g)].map((m) => num(m[1]));
        if (!title || !prices.length) continue;
        if (JUNK.test(title) || !keep(title)) {
          if (process.env.DEBUG_DROPS) console.error(`drop ${cat}: ${title}`);
          continue;
        }
        const price = Math.min(...prices);
        const was = Math.max(...prices);
        const img = t.match(/<img[^>]*src="([^"]+)"/)?.[1];
        out.set(id, {
          retailer: "costco",
          sku: id,
          title,
          url: BASE + url,
          price,
          wasPrice: was > price ? was : undefined,
          image: img ? (img.startsWith("http") ? img : BASE + img) : undefined,
          inStock: !/out of stock|sold out/i.test(t),
          mpn: mpnOf(title),
          brand: title.split(/\s+/)[0],
        });
      }
      if (!fresh) break;
      await sleep(800);
    }
    await sleep(800);
  }
  return [...out.values()];
}

// Costco AU does not sell graphics cards.
export const scrapers: Partial<Record<Exclude<CategoryId, "phones">, () => Promise<RawOffer[]>>> = Object.fromEntries(
  (Object.keys(CATS) as Exclude<CategoryId, "phones">[]).map((c) => [c, () => scrapeCategory(c)]),
);
