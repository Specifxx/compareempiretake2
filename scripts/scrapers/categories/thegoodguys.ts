import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../lib/http";
import { isAppliance } from "../appliances";

const BASE = "https://www.thegoodguys.com.au";

const JUNK = /refurb|renewed|open[- ]?box|ex[- ]?demo|pre[- ]?owned|b[- ]grade|second[- ]hand/i;
const SIZE = /\d{2}(?:\.\d)?(?:"|''|-inch| ?inch)/i;


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
    paths: ["/televisions"],
    keep: (t) => /\btv\b|television/i.test(t) && SIZE.test(t) && !/soundbar|projector|mount|bracket|\bstand\b|remote|antenna|cable/i.test(t),
  },
  monitors: {
    paths: ["/computers-tablets-and-gaming/monitors"],
    keep: (t) =>
      /monitor|display/i.test(t) &&
      (SIZE.test(t) || /^\S+ \d{2}(?:\.\d)? /.test(t)) &&
      !/monitor arms?\b|\barm\b|riser|workstation|mouse pad|bracket|cable|privacy filter|(monitor|display) stands?\b|standing|\blift\b|\d"? - \d|\bmount\b(?! adapter)|\bclamp\b|\d+inch - \d+inch/i.test(t),
  },
  laptops: {
    paths: [
      "/computers-tablets-and-gaming/desktop-and-laptop/laptops",
      "/computers-tablets-and-gaming/desktop-and-laptop/macbook",
      "/computers-tablets-and-gaming/desktop-and-laptop/gaming-laptops",
      "/computers-tablets-and-gaming/desktop-and-laptop/2in1-laptops",
      "/computers-tablets-and-gaming/desktop-and-laptop/chromebook",
      "/computers-tablets-and-gaming/desktop-and-laptop/microsoft-surface",
    ],
    keep: (t) => !/\bbag\b|sleeve|\bcase\b|backpack|charger|\bdock\b|docking station|\bstand\b|mouse|keyboard$|imac|desktop|all-in-one|mac mini|cover|skin\b|protector/i.test(t),
  },
  tablets: {
    paths: ["/computers-tablets-and-gaming/ipad-and-tablets/ipad", "/computers-tablets-and-gaming/ipad-and-tablets/tablets"],
    keep: (t) =>
      /\d+\s?(gb|tb)/i.test(t) &&
      !/^(?!.*tablet).*\bcase\b|cover\b|folio|keyboard|pencil|stylus|protector|kindle|kobo|ereader|charger|sleeve|\bstand\b/i.test(t),
  },
  "smartwatches": {
    paths: ["/phones-and-wearables/wearables/smart-watches"],
    keep: KEEP["smartwatches"],
  },
  "desktops": {
    paths: ["/computers-tablets-and-gaming/desktop-and-laptop/desktop-computers", "/computers-tablets-and-gaming/desktop-and-laptop/mac-desktops", "/gaming/gaming-hardware/gaming-pcs"],
    keep: KEEP["desktops"],
  },
  "printers": {
    paths: ["/computers-tablets-and-gaming/printers-paper-and-ink/inkjet", "/computers-tablets-and-gaming/printers-paper-and-ink/laser-printers", "/computers-tablets-and-gaming/printers-paper-and-ink/ink-tank-printers"],
    keep: KEEP["printers"],
  },
  "routers": {
    paths: ["/computers-tablets-and-gaming/networking/wifi-routers", "/computers-tablets-and-gaming/networking/mesh-wi-fi-routers"],
    keep: KEEP["routers"],
  },
  "soundbars": {
    paths: ["/audio/home-audio/sound-bars", "/audio/home-audio/home-theatre-systems"],
    keep: KEEP["soundbars"],
  },
  "headphones": {
    paths: ["/audio/headphones"],
    keep: KEEP["headphones"],
  },
  "speakers": {
    paths: ["/audio/portable-audio/portable-bluetooth-speakers", "/audio/portable-audio/party-speakers", "/audio/home-audio/home-wireless-speakers"],
    keep: KEEP["speakers"],
  },
  "consoles": {
    paths: ["/gaming/gaming-hardware/playstation-consoles", "/gaming/gaming-hardware/xbox-consoles", "/gaming/gaming-hardware/nintendo-consoles", "/gaming/gaming-hardware"],
    keep: KEEP["consoles"],
  },
  "cameras": {
    paths: ["/digital-cameras/cameras/dslr-and-compact-system-cameras", "/digital-cameras/cameras/compact-cameras", "/digital-cameras/cameras/action-cameras"],
    keep: KEEP["cameras"],
  },
  "drones": {
    paths: ["/digital-cameras/cameras/camera-drones"],
    keep: KEEP["drones"],
  },
  "robot-vacuums": {
    paths: ["/vacuums-and-cleaners/vacuum-cleaners/robot-vacuums", "/vacuums-and-cleaners/vacuum-cleaners/robot-mops"],
    keep: KEEP["robot-vacuums"],
  },
  vacuums: {
    paths: ["/vacuums-and-cleaners/vacuum-cleaners/stick-vacuums", "/vacuums-and-cleaners/vacuum-cleaners/handheld-vacuums", "/vacuums-and-cleaners/vacuum-cleaners/barrel-vacuums", "/vacuums-and-cleaners/vacuum-cleaners/upright-vacuums"],
    keep: (t) => isAppliance("vacuums", t),
  },
  "air-fryers": {
    paths: ["/small-kitchen-appliances/benchtop-cooking/air-fryers"],
    keep: (t) => isAppliance("air-fryers", t),
  },
  "coffee-machines": {
    paths: [
      "/small-kitchen-appliances/coffee-machines-and-beverages/coffee-machines",
      "/small-kitchen-appliances/coffee-machines-and-beverages/automatic-coffee-machines",
      "/small-kitchen-appliances/coffee-machines-and-beverages/manual-coffee-machines",
      "/small-kitchen-appliances/coffee-machines-and-beverages/capsule-coffee-machines",
      "/small-kitchen-appliances/coffee-machines-and-beverages/drip-filter-coffee-machines",
    ],
    keep: (t) => isAppliance("coffee-machines", t),
  },
  fridges: {
    paths: ["/fridges-and-freezers/refrigerators", "/fridges-and-freezers/freezers"],
    keep: (t) => isAppliance("fridges", t),
  },
  "washing-machines": {
    paths: ["/laundry/washing-machines", "/laundry/dryers"],
    keep: (t) => isAppliance("washing-machines", t),
  },
  dishwashers: {
    paths: ["/cooking-and-dishwashers/dishwashers"],
    keep: (t) => isAppliance("dishwashers", t),
  },
};

async function scrapeCategory(cat: Exclude<CategoryId, "phones">): Promise<RawOffer[]> {
  const { paths, keep } = CATS[cat]!;
  const offers = new Map<string, RawOffer>();
  for (const p of paths) {
    for (let page = 1; page <= 40; page++) {
      let html: string;
      try {
        html = await get(`${BASE}${p}?page=${page}`);
      } catch (e) {
        if (page > 1 && (e as { permanent?: boolean }).permanent) break;
        throw e;
      }
      const cards = html.split('data-testid="product-card"').slice(1);
      let fresh = 0;
      for (const c of cards) {
        const name = c.match(/data-cnstrc-item-name="([^"]*)"/)?.[1];
        const price = Number(c.match(/data-cnstrc-item-price="([\d.]+)"/)?.[1]);
        const href = c.match(/href="(\/[^"#?]+)"/)?.[1];
        if (!name || !price || !href) continue;
        if (offers.has(href)) continue;
        fresh++;
        const title = decodeEntities(name).replace(/&#x27;/g, "'").trim();
        if (JUNK.test(title) || !keep(title)) {
          if (process.env.DEBUG_DROPS) console.error(`drop ${cat}: ${title}`);
          continue;
        }
        const body = c.slice(0, 20000);
        const img = body.match(/<img[^>]*src="([^"]+)"/)?.[1];
        const was = Number(body.match(/(?:was|Was|RRP)[^$]{0,80}\$\s?([\d,]+(?:\.\d\d)?)/)?.[1]?.replace(/,/g, ""));
        // The URL slug ends with the model code, e.g. "...-smart-ai-tv-2026-75u85au".
        const code = href.split("-").pop()!.toUpperCase();
        // Dyson's part numbers are all digits: "...-cordless-vacuum-626439-01".
        const dyson = href.match(/-(\d{6}-\d{2})$/)?.[1];
        const mpn = dyson ?? (/\d/.test(code) && /[A-Z]/.test(code) && code.length >= 5 ? code : undefined);
        offers.set(href, {
          retailer: "thegoodguys",
          sku: href.slice(1),
          title,
          url: BASE + href,
          price,
          wasPrice: was > price ? was : undefined,
          image: img ? decodeEntities(img) : undefined,
          inStock: !/sold out|out of stock|unavailable/i.test(body.slice(0, 6000)),
          mpn,
          brand: title.split(/\s+/)[0],
        });
      }
      const total = Number(html.match(/Showing\s*(?:<!-- -->)?\d+(?:<!-- -->)?\s*of\s*(?:<!-- -->)?(\d+)/)?.[1] ?? 0);
      if (cards.length === 0 || fresh === 0 || (total && page * 29 >= total)) break;
      await sleep(800);
    }
    await sleep(800);
  }
  return [...offers.values()];
}

// The Good Guys does not sell graphics cards.
export const scrapers: Partial<Record<Exclude<CategoryId, "phones">, () => Promise<RawOffer[]>>> = Object.fromEntries(
  (Object.keys(CATS) as Exclude<CategoryId, "phones">[]).map((c) => [c, () => scrapeCategory(c)]),
);
