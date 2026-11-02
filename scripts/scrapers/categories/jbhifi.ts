import type { CategoryId, RawOffer, RetailerId } from "../../../src/lib/types";
import { decodeEntities, get, getJson, pool, sleep } from "../../lib/http";
import { APPLIANCE_IS, APPLIANCE_MIN_PRICE, isAppliance, isApplianceCat } from "../appliances";

type Cat = Exclude<CategoryId, "phones">;

// ---------- shared filters (also used by mwave / digidirect / betta) ----------

/** Used, refurbished, display stock and accessories: never a new boxed product. */
export const JUNK =
  /refurb|renewed|open[- ]?box|ex[- ]?(display|demo)|b[- ]grade|pre[- ]?owned|second[- ]?hand|\bused\b|\bcase\b|\bcover\b|folio|sleeve|\bbag\b|backpack|\bstand\b|\bmount\b|bracket|\bcable\b|keyboard|screen protector|protector|\bfilm\b|stylus|\bpen\b|pencil|charger|adapter|\bdock\b|docking station|\barm\b|holder|\bskin\b|riser|backplate|\bbrace\b|support bracket|warranty|care\+|applecare|cleaning|remote control|wall plate|tempered glass|\bdecal\b|\bstrap\b|\bmouse\b|\bhub\b(?!.*monitor)|\bshell\b|\bdux\b|duxling|metropolis|charging (cabinet|trolley|cart|station)|smartbox|\bfor (apple |microsoft |samsung )?(ipad|surface|galaxy|tab|macbook|laptop|notebook)/i;

const SIZE = /\d{2,3}(?:\.\d)?\s*(?:"|”|''|-inch|\s?inch|in\b)/i;

/** Condition junk that applies to every category: never a new boxed product. */
export const COND =
  /refurb|renewed|open[- ]?box|ex[- ]?(display|demo)|b[- ]grade|pre[- ]?owned|second[- ]?hand|\bused\b|warranty|care\+|applecare|care pack|\bdemo (unit|stock)\b|damaged box/i;

/** Categories that predate the expansion keep the broad accessory filter JUNK; newer ones use COND + their own IS check. */
const OLD = new Set<Cat>(["tvs", "monitors", "graphics-cards", "laptops", "tablets"]);
export function junk(cat: Cat, title: string): boolean {
  if (isApplianceCat(cat)) return !isAppliance(cat, title);
  return OLD.has(cat) ? JUNK.test(title) : COND.test(title);
}

/** Below these a listing is a placeholder or an accessory; 9999 is a "price on request" placeholder (Mwave). */
const MIN_PRICE: Partial<Record<Cat, number>> = {
  ...APPLIANCE_MIN_PRICE,
  printers: 50, desktops: 200, cpus: 50, motherboards: 60, consoles: 150, cameras: 60, drones: 60, "robot-vacuums": 100, smartwatches: 25, routers: 25,
};
export function badPrice(cat: Cat, price: number): boolean {
  if (OLD.has(cat)) return !price;
  return !price || price === 9999 || price < (MIN_PRICE[cat] ?? 10);
}

const CAP = /\d+(?:\.\d+)?\s?(GB|TB)\b/i;
/** Remove the charging case wording so a bare "case" means a protective case. */
const noChargingCase = (t: string) => t.replace(/(wireless |magsafe |usb-c |lightning )?charging case/gi, "");
const SMART_WATCH =
  /apple watch|galaxy watch|pixel watch|huawei watch|watch gt|watch fit|watch ultimate|watch d\d|fenix|f[eē]nix|forerunner|venu|vivoactive|instinct|\bepix|enduro|approach s\d|quatix|tactix|descent|amazfit|fitbit (versa|sense)|spacetalk|ticwatch|oneplus watch|redmi watch|xiaomi watch|polar (vantage|grit|pacer|ignite|unite)|coros|suunto|withings|smart ?watch|nothing watch|cmf watch/i;

/** Per-category title check: is this the product itself? */
export const IS: Record<Cat, (t: string) => boolean> = {
  tvs: (t) => SIZE.test(t) && /\bTV\b|television|google tv|smart tv/i.test(t) && !/projector|soundbar|monitor|tv box|streaming|antenna|cabinet|unit\b|furniture/i.test(t),
  monitors: (t) =>
    /monitor/i.test(t) && SIZE.test(t) && !/baby|speaker|studio monitor|heart|blood|pressure|tyre|camera|security|cctv|portable power|in-ear|headphone|reference monitor|field monitor|on-camera|camera monitor/i.test(t),
  "graphics-cards": (t) =>
    /geforce|\brtx\s?(pro\s?)?\d{4}|radeon|\brx\s?\d{4}|\barc\s?[ab]\d{3}|quadro/i.test(t) &&
    /graphics card|video card|\bgpu\b|\d+\s?GB/i.test(t) &&
    !/laptop|notebook|desktop|gaming pc|\bpc\b|tower|system|bundle with|holder|support|bracket|riser|cooler|waterblock|water block|fan\b|\bW1[01][HP]?\b|windows|ryzen \d|\d\s?TB|core i\d|ultra \d/i.test(t),
  laptops: (t) =>
    /laptop|macbook|notebook|chromebook|ultrabook|copilot\+ pc/i.test(t) && !/toy|kids|learn|vtech|leapfrog|sticker|tray|cooling pad|cooler|lock\b|power bank|battery\b/i.test(t),
  tablets: (t) =>
    /ipad|galaxy tab|\btablet\b|surface pro|matepad|lenovo tab|\btab\s?[a-z]?\d|xiaomi pad|redmi pad|oneplus pad|\bpad\s?\d|nxtpaper/i.test(t) &&
    /\d+\s?(GB|TB)/i.test(t) &&
    !/e-?reader|kobo|kindle|drawing|graphic(s)? tablet|pen tablet|wacom|xp-pen|huion|writing tablet|lcd writing|toy|mount|holder|tablet pc stand/i.test(t),

  smartwatches: (t) =>
    SMART_WATCH.test(t) &&
    (/\d{2}\s?mm/i.test(t) || /gps|lte|cellular|4g|bluetooth|wi-?fi|smart ?watch|running watch|sports? watch|multisport|outdoor watch|golf watch|dive computer|amoled|solar/i.test(t)) &&
    !(/apple watch/i.test(t) && !/\bcase\b/i.test(t)) &&
    !/\b(for|compatible with|fits)\b.*\b(watch|galaxy|garmin|fitbit|fenix|forerunner|venu)|replacement|charger|charging (cable|dock|stand|cradle|clip|base)|\bcable\b|protector|bumper|screen guard|tempered|\bfilm\b|\bdock\b|\bstand\b|holder|winder|watch box|(band|strap|loop|bracelet)s? only|band pack|strap pack|\bpouch\b|heart rate (monitor|strap)|\bhrm|chest strap|fitness (tracker|band)|smart ?band|\bring\b/i.test(t),

  desktops: (t) =>
    /desktop|gaming pc|\bpc\b|all-in-one|\baio\b|mac mini|imac|mac studio|mac pro|mini pc|\bnuc\b|tower|workstation|thinkcentre|optiplex|omnidesk|ideacentre|elitedesk|prodesk|dgx spark|supercomputer/i.test(t) &&
    /intel|ryzen|amd|apple m\d|\bm\d\b|core|celeron|pentium|snapdragon|grace|cortex|cpu|\d+\s?GB|chip/i.test(t) &&
    !/barebone|bare bone|no (ram|os|storage)|\bcase\b|chassis|enclosure|external graphics|egpu|motherboard|\bcooler\b|cpu fan|power supply|\bpsu\b|keyboard|mouse|speaker|webcam|headset|\bdesk\b|chair|stand\b|mount|dust|filter|\bups\b|kvm|monitor arm|laptop|notebook|tablet|graphics card|upgrade kit|\bkit\b|\bram\b(?=.*\bkit)|thin client|server\b|rack|add your desired|configure|custom build|desktop ram|ram memory|\bddr\d|desktop cpu|cpu processor|\bcpu\s*$|surface pro|udimm|memory modu|zbook|mobile workstation|hard drive|\bhdd\b|\brpm\b|\bmobile\b|\(\d ?x ?\d+ ?gb\)/i.test(t) &&
    !/^(?!.*(all-in-one|aio|imac)).*\b\d{2}(\.\d)?["”]\s?(fhd|qhd|uhd|4k)?\s?(gaming )?monitor/i.test(t),

  printers: (t) =>
    /printer|multi-?function|all-in-one|\bmfc-|\bmfp\b|ecotank|laserjet|officejet|deskjet|pixma|maxify|workforce|imageclass|i-sensys|smart tank|megatank/i.test(t) &&
    !(/\bink\b/i.test(t) && !/printer|multi-?function|all-in-one|ecotank|megatank/i.test(t)) &&
    !(/scanner/i.test(t) && !/printer/i.test(t)) &&
    !/cartridge|toner|\bdrum\b|ink (bottle|pack|refill|value)|\bbottle\b|refill|ribbon|\bpaper\b|\blabels?\b|label (printer|maker)|labeller|p-?touch|\btape\b|filament|\b3d\b|fuser|maintenance|waste|print ?head|\bstand\b|\bcable\b|adapter|\btray\b|sheet|stickers?|instax|zink|polaroid|sprocket|pocket|kodak step|phomemo|receipt|thermal|barcode|\bpos\b|warranty|care ?pack|service|\bresin\b|nozzle|\bplate\b|enclosure|dryer|\bams\b|spool|laptop|desktop|computer|card printer|id card|wristband|tattoo|cake|\bnail\b|garment|fabric|selphy|\bfor\b.*printer|attachment|flatbed|laminat|uv printer|no ink|air filter|door panel|\bdesk\b|drawer|\btill\b|sumup|eftpos|\bpc\b|\baio\b(?!.*printer)/i.test(t),

  routers: (t) =>
    /router|\bmesh\b|\bdeco\b|\borbi\b|\beero\b|nest wifi|google wifi|gateway|modem/i.test(t) &&
    !/extender|repeater|\busb\b|pcie|\bcard\b|antenna|access point|\bswitch\b|powerline|\bcamera\b|\bcable\b|mount|bracket|bridge|dongle|power supply|injector|licen[cs]e|subscription|pocket|mobile wi-?fi|hotspot|travel|nano|sfp|module|rack|chair|office|\bkit\b(?!.*mesh)|replacement|adapter|chipset|\bpoe\b(?!.*router)|voip|phone|sms|\bvpn\b(?!.*router)|firewall|security appliance|industrial|\bdin\b|\bcase\b|\batx\b|chassis|\btower\b|chair|\bbag\b|tablet|xp-?pen|wacom|drawing/i.test(t),

  cpus: (t) =>
    /ryzen|\bcore (ultra|i[3579])|core \d \d{3}|threadripper|xeon|athlon|pentium|celeron|\bepyc/i.test(t) &&
    /processor|\bcpu\b|boxed|\d+\s?-?\s?cores?\b|ghz|\bam[45]\b|lga\s?-?\d{4}/i.test(t) &&
    !/laptop|notebook|desktop|gaming pc|\bpc\b|motherboard|bundle|combo|\bkit\b|cpu cooler|liquid cooler|air cooler|heatsink|\bfan\b|thermal paste|mini pc|\bnuc\b|tablet|\d+\s?GB\s?(ram|ddr)|\bssd\b|\d\s?TB|rtx|geforce|radeon rx|delid|contact frame|socket protector|handheld|tray processor only/i.test(t),

  ssds: (t) =>
    /\bssd\b|solid state|nvme|\bm\.2\b/i.test(t) &&
    CAP.test(t) &&
    !/enclosure|adapter|caddy|\bdock\b|docking|bracket|\bcable\b|reader|duplicator|eraser|laptop|notebook|desktop|gaming pc|\bpc\b|macbook|imac|mac mini|tablet|ipad|console|\bram\b|ddr\d|\bhdd\b|hard (disk )?drive|\bsd card|micro ?sd|flash drive|usb drive|thumb|memory card|cfexpress|\bcard\b(?!.*\bssd\b)|server\b|raid\b(?!.*ssd)|\brtx\b|\bgpu\b|graphics|motherboard|monitor|phone|camera|core i\d|ryzen|core ultra|\d+\s?GB\s?(ram|ddr)|handheld|steam deck|legion|claw|\brog\b|ally|nas\b(?!.*(ssd|nvme))|yoga|\bw1[01]p?\b|windows|celeron|\bpen\b|\/\s?\d+GB\s?\//i.test(t),

  ram: (t) =>
    /\bddr[345]\b|\bram\b|memory|dimm/i.test(t) &&
    /\d+\s?GB/i.test(t) &&
    /\d{4}\s?(mhz|mt\/s)|ddr\d[- ]?\d{4}|\bpc\d-\d{4,5}/i.test(t) &&
    !/\b(i[3579]|core ultra|ryzen|celeron)\b|\bssd\b|gddr|graphics|motherboard|\bcard\b|\busb\b|flash|tablet|phone|processor|\bcpu\b|laptop(?!.*(ram|memory|so-?dimm))|notebook(?!.*(ram|memory|so-?dimm))|desktop pc|gaming pc|mini pc|handheld|\d\s?TB|cooler|\bfan\b|heatsink|\bserver\b(?!.*memory)|\becc\b|server|rdimm|lrdimm/i.test(t),

  motherboards: (t) =>
    /motherboard|mainboard/i.test(t) && !/bundle|combo|\bkit\b|\bcpu\b|processor|standoff|screw|\btray\b|\bcable\b|header|backplate|battery|antenna|\bfan\b|io shield|i\/o shield|tester|replacement for/i.test(t),

  soundbars: (t) =>
    /soundbar|sound bar|theatre bar|home theat(re|er) (system|bar)|sonos (arc|beam|ray)|\bbar \d{3,4}\b|bar \d{3,4} ?mk|smart soundbar|\bhw-[a-z]\d|\bsc9|atmos bar/i.test(t) &&
    !/\b(wall )?mount|bracket|\bstand\b|\bcable\b|remote control|\bcover\b|shelf|replacement|\bfor\b.*soundbar|compatible|surround speaker kit|rear speaker kit|speaker kit|\bkit\b(?!.*soundbar)|\bshield\b|\bfabric\b|grille|refurb|\bholder\b|furniture|cabinet|tv unit|entertainment unit|\bguard\b/i.test(t),

  headphones: (t) => {
    const s = noChargingCase(t);
    return (
      /headphones?|earbuds?|earphones?|in-ear|on-ear|over-ear|airpods|\bbuds\b|\bbuds\s?\d|headset|\biems?\b|true wireless|truly wireless|open-ear|bone conduction|\bwf-|\bwh-|quietcomfort|ultra open|powerbeats|beats (studio|solo|fit|flex|pill)|soundcore (liberty|space|life|aerofit|sport)|openrun|openfit|openswim|opencomm|openmove|openrun/i.test(s) &&
      !/ear ?tips?|eartips|foam tips|cushions?|ear ?pads?|earpads|replacement|\bcase\b|\bcover\b|\bstand\b|holder|hanger|\bhook\b|amplifier|\bamp\b|\bdac\b|\bcable\b|adapter|splitter|extension|charger|charging (dock|stand|pad)|dongle|transmitter|receiver|\bstrap\b|\bclip\b|cleaning|\bpouch\b|\bskin\b|airfly|\bfor (apple )?airpods|\bfor (galaxy )?buds|vr headset|meta quest|quest \d|mixed reality|virtual reality|\bmicrophone\b(?!.*(headset|headphone|earbuds?))|telephone|call centre|\bteams\b|\buc\b|\bmono\b|\bsingle ear\b|helmet|hearing (aid|protection)|ear ?muffs?|ear ?plugs?|sleep(buds)?(?!.*(earbuds|headphones))|\bpillow\b|\bbeanie\b|\bheadband\b(?!.*headphones)|\bkids?\b(?!.*(headphones|earbuds))|walkie|intercom|motorcycle|cardo|sena\b|\bdock\b|\bwatch\b|\bspeakers?\b(?!.*headphone)|\btv\b(?!.*headphone)|sound card|\bpcie\b|wireless audio system|\bcontroller\b|bundle with (console|ps5)|\bgame\b|jabra (biz|engage|evolve|pro)|yealink|\bms\b|\bteams\b|usb headset|computer headset|corded|\bdect\b|lav headset|\bbiz\b|\bpoly\b|plantronics|epos (impact|adapt)|cradle|\bbase station\b|call center|contact centre|aviation|push to talk|streaming bundle|printer|multifunction/i.test(s)
    );
  },

  speakers: (t) =>
    /speakers?|soundlink|boombox|partybox|wonderboom|\bboom \d|megaboom|everboom|epicboom|\bflip \d|\bcharge \d|\bclip \d|\bgo \d|\bxtreme \d|homepod|echo (dot|pop|studio)|\becho \(|nest (audio|mini)|sonos (era|five|move|roam|one)|\bera \d{3}|soundcore (motion|boom|flare|select)|beosound|beoplay a\d|stanmore|acton|woburn|middleton|emberton|willen|tufton|kilburn|uxbridge|srs-|ult field|ult tower|party ?box/i.test(t) &&
    !/\bcar\b|coaxial|component|marine|\bboat\b|motorcycle|in-?ceiling|in-?wall|ceiling|on-?wall|spacers?|grille|\bstands?\b|\bmount\b|bracket|\bcable\b|\bwire\b|adapter|\bcover\b|\bcase\b|\bbag\b|\bstrap\b|charger|\bdock\b(?!.*speaker)|replacement|subwoofer(?!.*speaker)|soundbar|sound bar|theatre bar|amplifier|\bamp\b|\breceiver\b|microphone(?!.*speaker)|\blamp\b|light bulb|bulb\b|\btoy\b|\bkids?\b|turntable|stylus|cartridge|studio monitors?|headphones?|earbuds?|passive|bookshelf speakers?(?!.*(bluetooth|wireless|powered|active|wi-?fi))|floorstanding|floor ?standing|tower speakers?(?!.*(bluetooth|party|karaoke))|centre channel|center channel|surround (sound )?speakers?(?!.*(bluetooth|wireless))|rear speakers?|\d-way|echo show|\bshow \d|doorbell|\bcamera\b|\bphone\b|\bwatch\b|\bglasses\b|\bshower\b(?!.*speaker)|\bpillow\b|\bbeanie\b|\bhelmet\b|\bpa system\b|\bmixer\b|\bmonitor\b(?!.*speaker)|\bkeyboard\b|\bmouse\b|\bheadset\b|\bpc\b(?!.*speaker)|\blaptop\b|clock radio|\bradio\b(?!.*speaker)|\bsmoke\b|\bintercom\b|speakerphone|karaoke mic|microphone with speaker|conference|network (cabinet |horn )?speaker|cabinet speaker|\bpoe\b|\bmegaphone\b|\bhorn\b|\btweeter\b|\bwoofer\b|\bdriver\b|\bpair\b(?!.*(bluetooth|wireless|powered|active|speakers? \(|desktop|computer|bookshelf))/i.test(t),

  consoles: (t) =>
    (/\bconsole\b|steam deck|rog (xbox )?ally|legion go|msi claw|gaming handheld|handheld gaming|handheld console|zotac zone|onexplayer|gpd win/i.test(t)) &&
    !/\bgames?\b(?! (console|handheld))|console edition|\bedition\b(?!.*console)|controller(?!.*(console|bundle))|\bcase\b|\bcover\b|\bskin\b|\bgrip\b|\bstand\b|\bdock\b(?!.*console)|charg(er|ing)|\bcable\b|headset|protector|\bbag\b|vertical|cooling|\bfan\b|faceplate|\bplates?\b|\bwrap\b|sticker|storage expansion|expansion card|memory card|\bssd\b(?!.*(console|handheld))|disc drive|portal|joy-?con|\bwheel\b|retro|\bmini\b|arcade|tv game|plug.?(and|n).?play|classic|evercade|anbernic|retroid|ayaneo|powkiddy|miyoo|\bkit\b|\btoy\b|\bkids\b|\bdesk\b|\bshelf\b|\bmount\b|\bsleeve\b|\bpouch\b|\bholder\b|\btv\b|\bbattery\b|\bpower supply\b|\bvr\b|\btable\b|\blego\b|\bfunko\b|\bplush\b|\bposter\b|\blamp\b|\blight\b|creative console|\bmx\b|stream deck|loupedeck/i.test(t),

  cameras: (t) => {
    const lensOnly = /\blens\b/i.test(t) && !/\b(camera|body)\b(?!\s*lens)|\bkit\b|\bw\/|\bwith\b|\bcombo\b|\+/i.test(t);
    return (
      !lensOnly &&
      /camera|\bbody\b|\bkit\b|\bw\/.*lens|with .*lens|powershot|cyber-?shot|lumix|gopro|hero\s?\d{1,2}|insta360|osmo (action|pocket|360)|x100|instax (mini|wide|square) ?\d|\bzv-?\w|\balpha\b|\ba7|\ba6\d{3}|\bfx\d|x-(t|s|e|h|m|pro)\d|gfx|\bz\s?(5|6|7|8|9|f|fc|30|50)\b|\beos\b|leica|hasselblad|ricoh gr|pentax|om-\d|g7 ?x|\bdc-|\bilce|\bdsc-/i.test(t) &&
      !/\blens (cap|hood|filter|adapter|pen|cleaning|pouch|case)|camera lens\b(?!.*(kit|with|camera body|\+))|\bfilters?\b|\bnd\d|\bbattery\b(?!.*(kit|grip))|batteries|charger|memory card|\bsd card|cfexpress|\bbag\b|\bcase\b|\bstrap\b|tripod|monopod|gimbal(?!.*camera)|\bmount\b|\bcage\b|\brig\b|\bcable\b|adapter|\bgrip\b|\bflash\b|speedlite|speedlight|\blights?\b|\bled\b|microphone|\bmic\b|\bmonitor\b|\bremote\b|\bhood\b|cleaning|protector|housing|selfie|\bstick\b|\bfilm\b(?! camera)|\bfilm camera|35mm|disposable|single use|\bpaper\b|\balbum\b|\bframe\b|security|cctv|doorbell|dash ?cam|webcam|web cam|\bbaby\b|\bpet\b|trail cam|wildlife|surveillance|\bindoor\b|\boutdoor\b|ip camera|\bspy\b|\bkids?\b|\btoy\b|drone|telescope|binocular|microscope|\bscope\b|printer|eyepiece|teleconverter|extension tube|viewfinder|eyecup|shutter release|slider|backpack|sling|pouch|harness|clamp|\barm\b|\bplate\b|\bshoe\b|sticker|\bskin\b|accessor(y|ies)|\bstand\b|\bdock\b|capture card|\bvlog(ging)? kit\b|cinema camera|\bbox camera\b|\bpro video\b|camcorder(?!.*4k)|\bfpv\b|\bhelmet\b|\bdashboard\b|\bboat\b|\bdive\b(?!.*camera)|keychain|\bcharmera\b|\blink 2|\blink\b|pendant|magnet|\bkids\b/i.test(t)
    );
  },

  drones: (t) =>
    /\bdrones?\b|dji (mini|air|mavic|avata|neo|flip|lito|inspire|matrice)|fly more|potensic|holy stone|\bautel\b.*(evo|nano|lite)/i.test(t) &&
    !/batter(y|ies)|propellers?|\bprops?\b|charger|charging hub|\bfor\b|\bbag\b|\bcase\b|\bfilters?\b|landing|\bguard\b|\bcable\b|control sticks?|\bsticks?\b|motion controller|care refresh|\bcare\b|\btoy\b(?!.*drone)|\bpuzzle\b|\blego\b|\bdvd\b|\bblu-?ray\b|\bgame\b|\bbook\b|wooden|\bmodel kit\b|\bsticker|\bskin\b|\bmount\b|lanyard|\bstrap\b|\bhub\b|storage|replacement|\bspare\b|\bparts?\b|goggles(?!.*(combo|drone))|\bremote controller\b(?!.*(combo|drone))|^dji rc\b|\bdji rc\s?(2|pro|-n\d)?\s*$|\bmicrophone\b|\bgimbal\b(?!.*drone)|osmo|\bpocket\b|\baction\s?\d|\blens\b|backpack|\bframe\b|transceiver|collection|\bnd\d|\bshell\b|\bscrews?\b|\bmotor\b|\bpropeller/i.test(t),

  "robot-vacuums": (t) =>
    /robot(ic)? (vacuum|vac|mop|cleaner)|roomba|roborock|deebot|braava|robovac|robot\b.*vacuum|vacuum.*robot|robot.*(mop|vac)/i.test(t) &&
    !/\bbags?\b|\bfilters?\b|\bbrush(es)?\b(?!.*robot)|mop pads?|\bpads?\b|replacement|\bkit\b|accessor(y|ies)|\bcloths?\b|solution|detergent|\bbattery\b|charger|\bwheels?\b|\bparts?\b|\bspare\b|\btank\b(?!.*robot)|\bholder\b|\bfor (roomba|irobot|ecovacs|roborock|dreame|deebot|eufy|xiaomi|neato|shark|samsung|tp-link|tapo)|compatible|window|\bpool\b|\blawn\b|mower|\btoy\b|\bkids\b|gutter|\bramp\b|\bbarrier\b|virtual wall|\bmat\b|\bdock only\b|station only|\bbase only\b/i.test(t),
  ...APPLIANCE_IS,
  lego: () => false,
};

/** A Shopify SKU that looks like a manufacturer code (letters and digits), not an internal number. */
export function mpnFromSku(sku: string | undefined | null): string | undefined {
  if (!sku) return undefined;
  const s = sku.trim();
  if (/^\d+$/.test(s) || !/[a-z]/i.test(s) || !/\d/.test(s) || s.length < 4) return undefined;
  return s;
}

/** "Model: XXX" / "MPN - XXX" / "Model Number: XXX" in a product description. */
export function mpnFromBody(html: string | undefined): string | undefined {
  if (!html) return undefined;
  const text = decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
  const m = text.match(/\b(?:MPN|Model(?: Number| No\.?| Code)?|Part (?:Number|No\.?))\s*[:\-–]\s*([A-Z0-9][A-Z0-9\-\/.]{3,24}[A-Z0-9])\b/i);
  if (!m || !/\d/.test(m[1]) || !/[a-z]/i.test(m[1])) return undefined;
  return m[1].toUpperCase();
}

/** A model-code-looking token in a monitor title, e.g. "Philips 32E1N3500 31.5" ..." → 32E1N3500. */
export function mpnFromTitle(title: string): string | undefined {
  for (const tok of title.split(/[\s,()[\]]+/)) {
    const t = tok.replace(/["”]+$/, "");
    if (t.length < 5 || t.length > 20) continue;
    if (!/^[A-Z0-9][A-Z0-9-]*[A-Z0-9]$/.test(t) || !/\d/.test(t) || !/[A-Z]/.test(t)) continue;
    if (/^(\d+(HZ|GB|TB|MS|K|P|W|MM|CM|NITS?)|[FQW]?[UH]?HD\+?|USB-C|HDMI\d*|DP\d*|HDR\d+|IPS|VA|OLED|QD-OLED|DCI-P3|G-SYNC|RTX\d+\w*|GTX\d+|I[3579]-\w+|M\d(PRO|MAX)?|WQHD|UWQHD|4K|5K|8K|2026|2025)$/i.test(t)) continue;
    if (/^\d+(\.\d+)?(HZ|GB|TB|MS|K)$/i.test(t)) continue;
    return t;
  }
  return undefined;
}

/**
 * An explicit manufacturer code in a title: "... - MZ-V9P1T0BW", "... (100-100000593WOF)",
 * or (opts.loose) a hyphenated letter-and-digit token such as "LNS100-1TRB" / "CMH32GX5M2D6000Z38".
 */
export function mpnFromCode(title: string, opts: { loose?: boolean } = {}): string | undefined {
  const ok = (c: string) =>
    c.length >= 5 && c.length <= 32 && /\d/.test(c) && /[A-Z]/i.test(c) && !/\s/.test(c) &&
    !/(MB|GB)\/?S?$|\/\d+MB/i.test(c) && !/^(DDR\d|PCIE|GEN\d|WI-?FI|USB|CL\d+|\d+(GB|TB|MHZ|MT\/S|W|MM|HZ|K)|AM\d|LGA\d+|M\.2|\d+X\d+GB|\d+-?PACK|\d+-?CORES?)/i.test(c);
  const tail = title.match(/\s[-–|]\s*([A-Z0-9][A-Z0-9\-\/.]{3,30}[A-Z0-9])\s*$/i)?.[1];
  if (tail && ok(tail) && /[A-Z]/.test(tail) && !/^[A-Z][a-z]/.test(tail)) return tail.toUpperCase();
  const paren = [...title.matchAll(/\(([A-Z0-9][A-Z0-9\-\/.]{4,30}[A-Z0-9])\)/g)].map((m) => m[1]).find((c) => ok(c) && c === c.toUpperCase());
  if (paren) return paren;
  if (opts.loose) {
    for (const tok of title.split(/[\s,()[\]]+/)) {
      if (tok.length >= 8 && tok === tok.toUpperCase() && /[A-Z]/.test(tok) && /\d/.test(tok) && (tok.includes("-") || tok.includes("/") || /\d[A-Z]+\d/.test(tok)) && ok(tok) && !/^(RTX|GTX|RX|DDR|PC\d|X\d{3}|B\d{3}|Z\d{3}|H\d{3})/.test(tok)) return tok;
    }
  }
  return undefined;
}

export interface ShopifyProduct {
  title: string;
  handle: string;
  vendor?: string;
  product_type: string;
  body_html: string;
  tags: string | string[];
  images: { src: string }[];
  variants: { id: number; title: string; sku: string; price: string; compare_at_price: string | null; available?: boolean }[];
}

/**
 * A Shopify store's collection feeds for one category. One offer per variant;
 * variant titles holding storage/colour are appended to the product title.
 */
export async function shopifyCategory(
  retailer: RetailerId,
  base: string,
  cat: Cat,
  collections: string[],
  opts: { mpn?: (p: ShopifyProduct, v: ShopifyProduct["variants"][0]) => string | undefined; skip?: (p: ShopifyProduct) => boolean } = {},
): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (const c of collections) {
    for (let page = 1; page <= 20; page++) {
      const { products } = await getJson<{ products: ShopifyProduct[] }>(`${base}/collections/${c}/products.json?limit=250&page=${page}`);
      for (const p of products) {
        if (opts.skip?.(p)) continue;
        const pt = decodeEntities(p.title).trim();
        for (const v of p.variants) {
          const vt = v.title && v.title !== "Default Title" && !pt.includes(v.title) ? ` ${v.title.replace(/\s*\/\s*/g, " ")}` : "";
          const title = pt + vt;
          if (junk(cat, title) || !IS[cat](title)) continue;
          const price = Number(v.price);
          if (badPrice(cat, price)) continue;
          const was = Number(v.compare_at_price);
          const brand = p.vendor && !/homeliving|default|vendor/i.test(p.vendor) ? p.vendor : undefined;
          out.set(String(v.id), {
            retailer,
            sku: String(v.sku || v.id),
            title,
            url: `${base}/products/${p.handle}${p.variants.length > 1 ? `?variant=${v.id}` : ""}`,
            price,
            wasPrice: was > price ? was : undefined,
            image: p.images[0]?.src,
            inStock: v.available !== false,
            mpn: opts.mpn ? opts.mpn(p, v) : mpnFromSku(v.sku),
            brand,
          });
        }
      }
      if (products.length < 250) break;
      await sleep(600);
    }
  }
  return [...out.values()];
}

// ---------- JB Hi-Fi ----------

const BASE = "https://www.jbhifi.com.au";

const HANDLES: Record<Cat, RegExp> = {
  tvs: /-(\d{2,3})-.*(tv|oled|qled|neo-qled|mini-led|television)/,
  monitors: /monitor/,
  "graphics-cards": /(geforce|rtx-\d{4}|radeon|rx-\d{4}|arc-[ab]\d{3}|quadro|rtx-pro)/,
  laptops: /(laptop|macbook|notebook|chromebook|vivobook|zenbook|ideapad|thinkpad|inspiron|pavilion|aspire|swift|omnibook|surface-laptop|yoga|expertbook|probook|elitebook|latitude|galaxy-book|rog-|tuf-|legion|predator|nitro|katana|omen|victus|xps)/,
  tablets: /(ipad|galaxy-tab|tablet|surface-pro|matepad|lenovo-tab|xiaomi-pad|redmi-pad|oneplus-pad|nxtpaper|-tab-)/,
  smartwatches: /(apple-watch|galaxy-watch|pixel-watch|huawei-watch|watch-gt|watch-fit|watch-d\d|watch-ultimate|garmin-|fitbit-(versa|sense)|amazfit|spacetalk|polar-|coros-|suunto|withings|smart-?watch|ticwatch|oneplus-watch|redmi-watch|xiaomi-watch|nothing-watch|cmf-watch)/,
  desktops: /(desktop|gaming-pc|-pc-|-pc$|all-in-one|-aio-|mac-mini|imac|mac-studio|mini-pc|-nuc-|workstation|thinkcentre|ideacentre|omnidesk|optiplex)/,
  printers: /(printer|multi-function|multifunction|all-in-one|ecotank|laserjet|officejet|deskjet|pixma|maxify|workforce|smart-tank|megatank|mfc-|hl-l|dcp-)/,
  routers: /(router|mesh|-deco-|^tp-link-deco|orbi|eero|nest-wifi|google-wifi|gateway|modem)/,
  cpus: /(ryzen|core-ultra|core-i[3579]|threadripper|xeon|athlon|pentium|celeron)/,
  ssds: /(ssd|nvme|solid-state|m-2)/,
  ram: /(ddr[345]|-ram|memory|dimm)/,
  motherboards: /(motherboard|mainboard)/,
  soundbars: /(soundbar|sound-bar|theatre-bar|home-theatre|sonos-arc|sonos-beam|sonos-ray|-bar-\d{3,4})/,
  headphones: /(headphone|earbud|earphone|in-ear|on-ear|over-ear|airpods|buds|headset|true-wireless|truly-wireless|open-ear|bone-conduction|wf-|wh-|quietcomfort|powerbeats|beats-(studio|solo|fit|flex|pill)|openrun|openfit|openswim|opencomm|openmove|iem)/,
  speakers: /(speaker|soundlink|boombox|partybox|wonderboom|boom-\d|megaboom|everboom|epicboom|jbl-flip|jbl-charge|jbl-clip|jbl-go|jbl-xtreme|homepod|echo-dot|echo-pop|echo-studio|nest-audio|nest-mini|sonos-(era|five|move|roam)|stanmore|acton|woburn|middleton|emberton|willen|tufton|kilburn|srs-|ult-field|ult-tower)/,
  consoles: /(console|steam-deck|rog-(xbox-)?ally|legion-go|msi-claw|gaming-handheld|handheld)/,
  cameras: /(camera|mirrorless|dslr|-body|powershot|cyber-shot|lumix|gopro|hero-?\d|insta360|osmo-(action|pocket|360)|x100|instax|zv-|eos-r)/,
  drones: /(drone|dji-(mini|air|mavic|avata|neo|flip|lito)|fly-more|potensic)/,
  "robot-vacuums": /(robot|roomba|roborock|deebot|braava|robovac)/,
  vacuums: /(stick-vac|vacuum|handstick|dyson-(v\d|gen5|outsize|digital)|shark-|tineco|wet-dry|wet-and-dry)/,
  "air-fryers": /(air-?fryer|air-fry|dual-zone|flexdrawer|foodi)/,
  "coffee-machines": /(coffee-machine|coffee-maker|espresso|nespresso|vertuo|barista|bambino|oracle|dolce-gusto|bean-to-cup|magnifica|dinamica|eletta|rivelia|jura-|lattissima|essenza|citiz|creatista)/,
  fridges: /(fridge|refrigerator|freezer)/,
  "washing-machines": /(washing-machine|washer|dryer|front-load|top-load)/,
  dishwashers: /dishwasher/,
  lego: /(?!)/,
  // 2026-11: JB is read for hair tools and grinders only. Its kettles, toasters and blenders run to a thousand-odd
  // product pages, which would eat the shared 40-minute time budget the older categories depend on.
  "hair-care": /(hair-?dryer|blow-?dryer|straightener|styler|airwrap|supersonic|corrale|airstrait|flexstyle|curler|curling|hot-brush|volumi[sz]er|clipper|hair-trimmer)/,
  "coffee-gear": /(grinder|gooseneck|pour-over|coffee-scale|aeropress|french-press|moka|milk-frother|aeroccino)/,
  "small-kitchen": /(?!)/,
  bbqs: /(?!)/,
};
const HANDLE_JUNK =
  /refurb|renewed|open-box|ex-display|ex-demo|pre-owned|-case|-cover|folio|sleeve|-bag|backpack|-stand|-mount|bracket|cable|keyboard|protector|stylus|-pen-|pencil|charger|adapter|-dock|-arm|holder|-skin|riser|-strap|-mouse/;
/** Newer categories: only the condition words, plus the obvious accessory handles of each. */
const HANDLE_COND = /refurb|renewed|open-box|ex-display|ex-demo|pre-owned|second-hand/;
const HANDLE_ACC: Partial<Record<Cat, RegExp>> = {
  smartwatches: /(band|strap|loop|bracelet)s?(-for|-compatible)|-for-.*watch|charg|cable|protector|bumper|screen|tempered|film|-dock|-stand|holder|winder|-pouch|hrm|chest-strap/,
  printers: /cartridge|toner|drum|-ink-|refill|bottle|ribbon|paper|label|p-touch|tape|filament|3d|fuser|maintenance/,
  headphones: /ear-?tips|eartips|cushion|ear-?pads|replacement|-cover|-stand|holder|hanger|amplifier|-amp-|-dac|cable|adapter|splitter|-for-(apple-)?airpods|-for-galaxy-buds|vr-headset|meta-quest|quest-\d/,
  speakers: /car-|coaxial|component|marine|ceiling|in-wall|spacer|grille|-stand|-mount|bracket|cable|-cover|-bag|strap|replacement|soundbar|amplifier|receiver|turntable|stylus|cartridge|headphone|earbud/,
  consoles: /-game|controller|-case|-cover|-skin|-grip|-stand|charg|cable|headset|protector|-bag|vertical|cooling|faceplate|plate|wrap|sticker|joy-con|wheel|retro|arcade|classic|console-edition|portal/,
  cameras: /lens-cap|lens-hood|filter|battery|batteries|charger|memory-card|sd-card|-bag|-case|strap|tripod|-cage|cable|adapter|security|cctv|doorbell|dash-?cam|webcam|baby|pet-|trail|indoor|outdoor|spy|kids|toy|drone|telescope|binocular|selfie|backpack|sling|pouch|harness|clamp|-film-|disposable/,
  drones: /batter|propeller|charg|-for-|-bag|-case|filter|landing|guard|cable|stick|replacement|spare|-toy|puzzle|lego|dvd|wooden/,
  "robot-vacuums": /bags|filter|brush|pads|replacement|kit|accessor|cloth|solution|detergent|battery|-for-|window|pool|lawn|mower|toy/,
  vacuums: /robot|roomba|deebot|bags|filter|replacement|accessor|battery|-for-|window|pool|toy|steam-mop|hair-dryer|hairdryer/,
  "air-fryers": /liner|paper|rack|skewer|accessor|cookbook|-for-/,
  "coffee-machines": /capsule|pods|beans|descal|cleaning|tamper|jug|pitcher|knock-box|cups|mug|-for-|accessor|replacement|grinder$/,
  fridges: /filter|car-fridge|portable|12v|camping|-for-|replacement/,
  "washing-machines": /hair-?dryer|hand-dryer|stack|pedestal|hose|-for-|detergent|dishwasher|airer|shoe|salad/,
  dishwashers: /tablet|detergent|rinse|cleaner|-for-|salt/,
  lego: /(?!)/,
  "hair-care": /-for-|attachment|diffuser|nozzle|comb|guard|blade|case|-bag|stand|holder|mat$|pet-|dog-|nail|nose|replacement/,
  "coffee-gear": /-for-|burrs?$|replacement|filter-paper|papers|pepper|salt|spice|cleaning|tablets|-cup$|-mug/,
  routers: /extender|repeater|usb|pcie|antenna|access-point|switch|powerline|camera|cable|mount|bracket|adapter/,
  ssds: /enclosure|adapter|caddy|-dock|bracket|cable|reader|laptop|notebook|desktop|gaming-pc|macbook|imac|refurb/,
  ram: /laptop-.*-(i[3579]|ryzen)|gaming-pc|desktop-pc|gddr|graphics|motherboard/,
};

/**
 * JB product types per category (sampled 2026-10): TVs are VISUAL; computers, monitors and tablets COMPUTERS; marketplace IT;
 * watches "Wearables & Outdoor"; audio AUDIO; cameras and drones CAMERAS; consoles GAMES HARDWARE; robot vacuums SMALL APPLIANCES.
 */
const TYPES: Record<Cat, RegExp> = {
  tvs: /^VISUAL$/,
  monitors: /^(COMPUTERS|IT)$/,
  "graphics-cards": /^(COMPUTERS|IT)$/,
  laptops: /^(COMPUTERS|IT)$/,
  tablets: /^(COMPUTERS|IT)$/,
  smartwatches: /^(Wearables & Outdoor|COMMUNICATIONS|IT|WEARABLES)$/i,
  desktops: /^(COMPUTERS|IT)$/,
  printers: /^(COMPUTERS|IT)$/,
  routers: /^(COMPUTERS|IT)$/,
  cpus: /^(COMPUTERS|IT)$/,
  ssds: /^(COMPUTERS|IT)$/,
  ram: /^(COMPUTERS|IT)$/,
  motherboards: /^(COMPUTERS|IT)$/,
  soundbars: /^(AUDIO|VISUAL)$/,
  headphones: /^(AUDIO|IT|COMPUTERS|GAMES HARDWARE)$/,
  speakers: /^(AUDIO|IT|COMPUTERS)$/,
  consoles: /^(GAMES HARDWARE|COMPUTERS|IT)$/,
  cameras: /^CAMERAS$/,
  drones: /^CAMERAS$/,
  "robot-vacuums": /^(SMALL APPLIANCES|APPLIANCES|HOME APPLIANCES)$/i,
  vacuums: /APPLIANCE|FLOORCARE|CLEANING/i,
  "air-fryers": /APPLIANCE|KITCHEN|COOKING/i,
  "coffee-machines": /APPLIANCE|KITCHEN|COFFEE/i,
  fridges: /APPLIANCE|WHITEGOOD|REFRIG|KITCHEN/i,
  "washing-machines": /APPLIANCE|WHITEGOOD|LAUNDRY/i,
  dishwashers: /APPLIANCE|WHITEGOOD|KITCHEN/i,
  // LEGO comes only from the toy stores (scripts/scrapers/lego.ts); JB is never read for it.
  lego: /(?!)/,
  "hair-care": /APPLIANCE|PERSONAL|BEAUTY|GROOM|HEALTH/i,
  "coffee-gear": /APPLIANCE|KITCHEN|COFFEE/i,
  "small-kitchen": /(?!)/,
  bbqs: /(?!)/,
};

/** Marketplace sellers on JB for these are PC stores selling new stock; elsewhere marketplace is mostly refurbished. */
const MARKETPLACE_OK = new Set<Cat>(["graphics-cards", "cpus", "ssds", "ram", "motherboards", "routers", "printers", "desktops"]);
/** Where a title-borne manufacturer code is worth taking. */
const TITLE_CODE_LOOSE = new Set<Cat>(["ssds", "ram", "printers", "routers", "air-fryers", "coffee-machines", "fridges", "washing-machines", "dishwashers", "hair-care", "coffee-gear"]);

let sitemap: Promise<string[]> | undefined;
/** All product URLs from JB's product sitemaps, fetched once per run. */
function productUrls(): Promise<string[]> {
  sitemap ??= (async () => {
    const index = await get(`${BASE}/sitemap.xml`);
    const maps = [...index.matchAll(/<loc>([^<]*sitemap_products[^<]*)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
    const urls = new Set<string>();
    await pool(maps, 4, async (m) => {
      const xml = await get(m);
      for (const [, loc] of xml.matchAll(/<loc>(https:\/\/www\.jbhifi\.com\.au\/products\/[^<]+)<\/loc>/g)) urls.add(loc);
      await sleep(150);
    });
    return [...urls];
  })();
  return sitemap;
}

/**
 * JB marketplace listings (third-party sellers: an 8-digit 100xxxxx SKU and the
 * seller's name as variant title) are mostly used/refurbished laptops; we keep
 * them only for graphics cards, where the sellers are PC stores.
 */
function isMarketplace(p: ShopifyProduct): boolean {
  const v = p.variants[0];
  return /^100\d{5}$/.test(v?.sku ?? "") || (v?.title !== "Default Title" && p.product_type === "IT");
}

// JB rate-limits product JSON (429). One shared pause for every worker beats each one retrying
// with backoff, and a total time budget keeps one slow store from holding up the daily job
// (runs on 23–24 Oct were cancelled after 2.5 hours in here). Past the budget we keep what we have.
const JB_DEADLINE = Date.now() + Number(process.env.JB_BUDGET_MIN || 40) * 60_000;
let pausedUntil = 0;
async function jbJson<T>(url: string): Promise<T> {
  for (let i = 0; i < 3; i++) {
    const wait = pausedUntil - Date.now();
    if (wait > 0) await sleep(wait);
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36", accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
    if (res.status === 429) {
      pausedUntil = Math.max(pausedUntil, Date.now() + 20_000 * (i + 1));
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return (await res.json()) as T;
  }
  throw new Error(`429 ${url}`);
}

async function jbCategory(cat: Cat): Promise<RawOffer[]> {
  const urls = (await productUrls()).filter((u) => {
    const h = u.slice(u.lastIndexOf("/") + 1).toLowerCase();
    if (!HANDLES[cat].test(h)) return false;
    if (OLD.has(cat)) return !HANDLE_JUNK.test(h) && (cat === "graphics-cards" ? !/laptop|gaming-pc|desktop|-pc$/.test(h) : true);
    return !HANDLE_COND.test(h) && !(HANDLE_ACC[cat]?.test(h) ?? false);
  });
  console.log(`  jbhifi ${cat}: ${urls.length} candidate products`);
  const offers: RawOffer[] = [];
  let late = 0;
  await pool(urls, 3, async (url) => {
    if (Date.now() > JB_DEADLINE) {
      late++;
      return;
    }
    try {
      const { product: p } = await jbJson<{ product: ShopifyProduct }>(`${url}.json`);
      const title = decodeEntities(p.title).trim();
      if (!TYPES[cat].test(p.product_type) || junk(cat, title) || !IS[cat](title)) return;
      if (isMarketplace(p) && !MARKETPLACE_OK.has(cat)) return;
      const tags = Array.isArray(p.tags) ? p.tags.join(",") : p.tags;
      if (/NoLongerAvailable|Discontinued|(^|,)\s*Unknown\s*(,|$)/i.test(tags)) return;
      const v = p.variants[0];
      const price = Number(v.price);
      if (badPrice(cat, price)) return;
      const was = Number(v.compare_at_price);
      const brand = tags.match(/Brand:([^,]+)/)?.[1]?.trim() ?? p.vendor;
      offers.push({
        retailer: "jbhifi",
        sku: String(v.sku || v.id),
        title,
        url,
        price,
        wasPrice: was > price ? was : undefined,
        image: p.images[0]?.src,
        inStock: !/AwaitingStock|PreOrder|NotAvailable|SoldOut/i.test(tags),
        mpn:
          mpnFromSku(v.sku) ??
          mpnFromBody(p.body_html) ??
          title.match(/\(([A-Z0-9][A-Z0-9-]{5,}[A-Z0-9])\)/)?.[1] ??
          (cat === "monitors" ? mpnFromTitle(title) : OLD.has(cat) ? undefined : mpnFromCode(title, { loose: TITLE_CODE_LOOSE.has(cat) })),
        brand,
      });
    } catch (e) {
      console.warn(`  jbhifi: skip ${url}: ${(e as Error).message}`);
    }
    await sleep(250);
  });
  // A half-checked category would drop products: keep yesterday's file instead.
  if (late) throw new Error(`time budget reached with ${late} of ${urls.length} products unchecked; keeping yesterday's prices`);
  return offers;
}

// Start at a different category each day, so the time budget never starves the same ones.
const CATS = Object.keys(HANDLES) as Cat[];
const start = Math.floor(Date.now() / 86_400_000) % CATS.length;
export const scrapers: Partial<Record<Cat, () => Promise<RawOffer[]>>> = Object.fromEntries(
  [...CATS.slice(start), ...CATS.slice(0, start)].map((c) => [c, () => jbCategory(c)]),
);
