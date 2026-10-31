/**
 * Title checks for the appliance categories, shared by every store file: is this listing the appliance
 * itself, new and boxed? Accessories, consumables, spare parts and installation kits are refused. Each
 * store's own category paths do the rough sorting; these only refuse.
 */
import type { CategoryId } from "../../src/lib/types";

export type ApplianceCat = Extract<CategoryId, "vacuums" | "air-fryers" | "coffee-machines" | "fridges" | "washing-machines" | "dishwashers">;
export const APPLIANCE_CATS: ApplianceCat[] = ["vacuums", "air-fryers", "coffee-machines", "fridges", "washing-machines", "dishwashers"];

/** Listings that are never a new appliance, in any category. */
const NOT_NEW = /refurb|renewed|open[- ]?box|ex[- ]?(display|demo)|b[- ]grade|pre[- ]?owned|second[- ]?hand|\bused\b|seconds stock|factory second|carton damaged|damaged (box|carton)|scratch (and|&) dent|warranty|care\+|protection plan|installation\b(?! included)|gift card/i;

/** Parts and consumables shared by every category. */
const PARTS = /replacement|\bspares?\b|\bspare parts?\b|accessor(y|ies) (only|pack|set)|cleaning (tablets|solution)|descal|\bdetergent\b|\bcable\b|\badapter\b|\bcharger\b|\bholder\b|\bstorage (rack|bag)\b/i;

export const APPLIANCE_IS: Record<ApplianceCat, (t: string) => boolean> = {
  vacuums: (t) =>
    /vacuum|\bvac\b|stick ?vac|handstick|dyson (v\d|gen5|outsize|digital slim|submarine|car)|shark (stratos|wandvac|cordless|detect|clean ?& ?empty|powerdetect|navigator|rotator)|jet \d{2}|bespoke jet|tineco|floor ?one|wet (and|&) dry/i.test(t) &&
    !/robot|robotic|roomba|deebot|braava|robovac|\bmop pads?\b|steam mop|window (vac|cleaner)|carpet (washer|cleaner)(?!.*vacuum)|pool|leaf|ash vac|shop ?vac(?!uum)|\bbags?\b(?!less)|\bbatter(y|ies)\b(?!.*(vacuum|stick))|\bbrush(es| bar| roll| head)?\b(?!.*(vacuum|stick))|\bfilters?\b(?!.*vac)|\bwand\b(?!.*vac)|\bnozzle\b|\btool\b(?! kit)|\bdock\b(?!.*vac)|replacement|\bspares?\b|accessor(y|ies)|\bbelt\b|\bholder\b|\bwall (mount|bracket)\b|\bhose\b(?!.*vac)|\bkids\b|\btoy\b/i.test(t),
  "air-fryers": (t) =>
    /air ?fryer|airfryer|air fry(ing)? oven|dual zone|flexdrawer|foodi|crispi|essential xl|xxl|easy fry|vortex/i.test(t) &&
    !/\bliners?\b|\bparchment\b|\bpaper\b|\bsilicone\b|\brack\b|\bskewers?\b|\btray\b(?!.*fryer)|\binsert\b|\bcookbook\b|\bbook\b|\bmitts?\b|\bgloves?\b|\bsprayer\b|\boil spray\b|\btongs?\b|\bpan\b(?!.*fryer)|\blid\b(?!.*fryer)|accessor(y|ies)|replacement|\bbasket\b(?!.*(fryer|dual|zone|xl|\d\s?l\b))|\bfor\b.*air ?fryer|\bdeep fryer\b|\bmicrowave\b|\bkettle\b|\btoaster\b/i.test(t),
  "coffee-machines": (t) =>
    /coffee (machine|maker)|espresso|nespresso|vertuo|lattissima|essenza|citiz|inissia|creatista|barista|bambino|oracle|dolce gusto|k-?cup|caffitaly|bean[- ]to[- ]cup|magnifica|dinamica|eletta|rivelia|primadonna|jura|\bgaggia\b|\blelit\b|\brancilio\b|cold brew maker|drip (coffee|filter)|filter coffee/i.test(t) &&
    !/\bcapsules?\b(?!.*(machine|maker))|\bpods?\b(?!.*machine)|\bbeans\b|\bground coffee\b|\bdescal\w*|\bcleaning\b|\btablets\b|\btamper\b|\bmilk (jug|pitcher)\b|\bpitcher\b|\bknock ?box\b|\bportafilter\b(?!.*machine)|\bbasket\b|\bwater filter\b|\bfilter (papers?|cartridge)\b|\bcups?\b(?!.*(machine|maker))|\bmugs?\b|\bgrinder\b(?!.*(machine|espresso|built|with|integrated))|\bservice kit\b|\bgasket\b|\bshower screen\b|^(?!.*\b(machine|maker|bundle)\b).*\b(steam wand|frother)\b|\baeroccino\b(?!.*(machine|bundle|vertuo|essenza|citiz|inissia))|\bscales?\b|\bkettle\b|\bplunger\b|\bfrench press\b|\bmoka\b|\bstovetop\b|\bpour[- ]over\b(?!.*machine)|accessor(y|ies)|replacement|\bspares?\b|\bcover\b|\bstand\b|\bdrawer\b|\bcanister\b|\bsyrup\b|\bgift\b/i.test(t),
  fridges: (t) =>
    /fridge|refrigerator|freezer/i.test(t) &&
    /\b\d{2,4}\s?(L|litres?|ltr)\b|\b[A-Z]{1,5}-?\d{3,5}[A-Z0-9-]*\b/i.test(t) &&
    !/\bwater filter\b|\bfilter\b|\bshelf\b|\bdrawer\b(?!.*fridge)|\bdoor seal\b|\bgasket\b|\bice tray\b|\bplinth\b|\bhinge\b|\breversal\b|\bcover\b|\bmagnets?\b|\bthermometer\b|\borganis(er|ing)\b|\bbins?\b|\bcontainers?\b|\bstorage\b(?!.*(fridge|freezer))|\bmat\b|\bliners?\b|\bdeodori[sz]er\b|\bcar fridge\b|\bportable (fridge|freezer)\b|\b12v\b|\bcamping\b|\bcooler\b(?! fridge)|\bice cream\b|\bice maker\b(?!.*fridge)|\bminibar\b|\bcosmetic\b|\bskincare\b|\bkeg\b|\bdisplay (fridge|freezer)\b|\bcommercial\b/i.test(t),
  "washing-machines": (t) =>
    /washing machine|washer|dryer|front load|top load|heat pump|condenser/i.test(t) &&
    /\b\d{1,2}(\.\d)?\s?kg\b|\b[A-Z]{1,5}-?\d{3,5}[A-Z0-9-]*\b/i.test(t) &&
    !/\bstack(ing)? kit\b|\bpedestal\b|\bdrawer\b(?!.*(washer|dryer))|\bhoses?\b|\btaps?\b|\blint\b|\bcleaner\b|\bdetergent\b|\bpods\b|\bcover\b|\bshock\b|\banti-?vibration\b|\bfeet\b|\bwall (mount|bracket)\b|\bdishwasher\b|\bhair dryer\b|\bhairdryer\b|\bhand dryer\b|\bsalad\b|\bdehydrator\b|\bshoe dryer\b|\bclothes airer\b|\bairer\b|\bportable\b|\bmini\b|\bcommercial\b|\bpressure washer\b|\bdish ?washer\b/i.test(t),
  dishwashers: (t) =>
    /dishwasher/i.test(t) &&
    !/\btablets\b|\bdetergent\b|\brinse aid\b|\bsalt\b|\bcleaner\b|\bbaskets?\b(?!.*dishwasher \w)|\bcutlery\b|\brack\b|\bdoor panel\b|\bkickboard\b|\bplinth\b|\bhoses?\b|\bpods\b|\bpowder\b|\bgel\b|\bcapsules\b|\bliquid\b|\bdishwasher safe\b|\bcommercial\b/i.test(t),
};

export const isAppliance = (cat: ApplianceCat, t: string) => !NOT_NEW.test(t) && !PARTS.test(t) && APPLIANCE_IS[cat](t);
export const isApplianceCat = (c: string): c is ApplianceCat => (APPLIANCE_CATS as string[]).includes(c);

/** Below these a listing is an accessory or a placeholder. */
export const APPLIANCE_MIN_PRICE: Record<ApplianceCat, number> = {
  vacuums: 60, "air-fryers": 40, "coffee-machines": 60, fridges: 200, "washing-machines": 250, dishwashers: 250,
};
