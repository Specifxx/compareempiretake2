/**
 * Title checks for the appliance categories, shared by every store file: is this listing the appliance
 * itself, new and boxed? Accessories, consumables, spare parts and installation kits are refused. Each
 * store's own category paths do the rough sorting; these only refuse.
 */
import type { CategoryId } from "../../src/lib/types";

export type ApplianceCat = Extract<
  CategoryId,
  "vacuums" | "air-fryers" | "coffee-machines" | "fridges" | "washing-machines" | "dishwashers" | "hair-care" | "small-kitchen" | "bbqs" | "coffee-gear"
>;
export const APPLIANCE_CATS: ApplianceCat[] = [
  "vacuums", "air-fryers", "coffee-machines", "fridges", "washing-machines", "dishwashers", "hair-care", "small-kitchen", "bbqs", "coffee-gear",
];

/** Listings that are never a new appliance, in any category. */
const NOT_NEW = /refurb|renewed|open[- ]?box|ex[- ]?(display|demo)|b[- ]grade|pre[- ]?owned|second[- ]?hand|\bused\b|seconds stock|factory second|carton damaged|damaged (box|carton)|scratch (and|&) dent|warranty|care\+|protection plan|installation\b(?! included)|gift card/i;

/** Parts and consumables shared by every category. */
const PARTS = /replacement|\bspares?\b|\bspare parts?\b|accessor(y|ies) (only|pack|set)|cleaning (tablets|solution)|descal|\bdetergent\b|\bcable\b|\badapter\b|\bcharger\b|\bholder\b|\bstorage (rack|bag)\b/i;

/** Toys and play sets that borrow an appliance's name ("Barbie BBQ", "toy kettle"), in the 2026-11 categories. */
const TOY = /\btoys?\b|\bplay ?sets?\b|\bpretend\b|\bkids?\b|\bchildren'?s\b|\bdolls?\b|\blego\b|\bduplo\b|\bplaymobil\b|\bmelissa (&|and) doug\b|\bplush\b|\bminiature\b/i;

/**
 * The product a title names, before what comes with it: "Supersonic Hair Dryer with Diffuser" is a dryer, "Diffuser
 * for Supersonic" is not. The 2026-11 categories test accessory nouns on this part only.
 */
const head = (t: string) => t.split(/\s(?:with|w\/|incl\.?|including|inc\.?|\+)\s/i)[0];

/** Pour-over and barista gear: coffee gear, never a small kitchen appliance (owner's 2026-11 categories). */
const COFFEE_KETTLE = /gooseneck|pour[- ]?over|\bstagg\b|brewista|\bhario\b|bonavita|timemore|barista kettle|drip kettle/i;

export const APPLIANCE_IS: Record<ApplianceCat, (t: string) => boolean> = {
  vacuums: (t) =>
    /vacuum|\bvac\b|stick ?vac|handstick|dyson (v\d|gen5|outsize|digital slim|submarine|car)|shark (stratos|wandvac|cordless|detect|clean ?& ?empty|powerdetect|navigator|rotator)|jet \d{2}|bespoke jet|tineco|floor ?one|wet (and|&) dry/i.test(t) &&
    !/robot|robotic|roomba|deebot|braava|robovac|\bmop pads?\b|steam mop|window (vac|cleaner)|carpet (washer|cleaner)(?!.*vacuum)|pool|leaf|ash vac|shop ?vac(?!uum)|\bbags?\b(?!less)|\bbatter(y|ies)\b(?!.*(vacuum|stick))|\bbrush(es| bar| roll| head)?\b(?!.*(vacuum|stick))|\bfilters?\b(?!.*vac)|\bwand\b(?!.*vac)|\bnozzle\b|\btool\b(?! kit)|\bdock\b(?!.*vac)|replacement|\bspares?\b|accessor(y|ies)|\bbelt\b|\bholder\b|\bwall (mount|bracket)\b|\bhose\b(?!.*vac)|\bkids\b|\btoy\b/i.test(t),
  "air-fryers": (t) =>
    /air ?fryer|airfryer|air fry(ing)? oven|dual zone|flexdrawer|foodi|crispi|essential xl|xxl|easy fry|vortex/i.test(t) &&
    !/\bliners?\b|\bparchment\b|\bpaper\b|\bsilicone\b|\brack\b|\bskewers?\b|\btray\b(?!.*fryer)|\binsert\b|\bcookbook\b|\bbook\b|\bmitts?\b|\bgloves?\b|\bsprayer\b|\boil spray\b|\btongs?\b|\bpan\b(?!.*fryer)|\blid\b(?!.*fryer)|accessor(y|ies)|replacement|\bbasket\b(?!.*(fryer|dual|zone|xl|\d\s?l\b))|\bfor\b.*air ?fryer|\bdeep fryer\b|\bmicrowave\b|\bkettle\b|\btoaster\b/i.test(t),
  "coffee-machines": (t) =>
    /coffee (machine|maker)|espresso|nespresso|vertuo|lattissima|essenza|citiz|inissia|creatista|barista|bambino|oracle|dolce gusto|k-?cup|caffitaly|bean[- ]to[- ]cup|magnifica|dinamica|eletta|rivelia|primadonna|jura|\bgaggia\b|\blelit\b|\brancilio\b|cold brew maker|drip (coffee|filter)|filter coffee/i.test(t) &&
    !/\bcapsules?\b(?!.*(machine|maker))|\bpods?\b(?!.*machine)|\bbeans\b|\bground coffee\b|\bdescal\w*|\bcleaning\b|\btablets\b|\btamper\b|\bmilk (jug|pitcher)\b|\bpitcher\b|\bknock ?box\b|\bportafilter\b(?!.*machine)|\bbasket\b|\bwater filter\b|\bfilter (papers?|cartridge)\b|\bcups?\b(?!.*(machine|maker))|\bmugs?\b|\bgrinder\b(?!.*(machine|espresso|built|with|integrated))|\bservice kit\b|\bgasket\b|\bshower screen\b|^(?!.*\b(machine|maker|bundle)\b).*\b(steam wand|frother)\b|\baeroccino\b(?!.*(machine|bundle|vertuo|essenza|citiz|inissia))|\bscales?\b|\bkettle\b|\bplunger\b|\bfrench press\b|\bmoka\b|\baeropress\b|\bchemex\b|\bdripper\b|\bstovetop\b|\bpour[- ]over\b(?!.*machine)|accessor(y|ies)|replacement|\bspares?\b|\bcover\b|\bstand\b|\bdrawer\b|\bcanister\b|\bsyrup\b|\bgift\b/i.test(t),
  fridges: (t) =>
    /fridge|refrigerator|freezer/i.test(t) &&
    /\b\d{2,4}\s?(L|litres?|ltr)\b|\b[A-Z]{1,5}-?\d{3,5}[A-Z0-9-]*\b/i.test(t) &&
    !/\bwater filter\b|\bfilter\b|\bshelf\b|\bdrawer\b(?!.*fridge)|\bdoor seal\b|\bgasket\b|\bice tray\b|\bplinth\b|\bhinge\b|\breversal\b|\bcover\b|\bmagnets?\b|\bthermometer\b|\borganis(er|ing)\b|\bbins?\b|\bcontainers?\b|\bstorage\b(?!.*(fridge|freezer))|\bmat\b|\bliners?\b|\bdeodori[sz]er\b|\bcar fridge\b|\bportable (fridge|freezer)\b|\b12v\b|\bcamping\b|\bcooler\b(?! fridge)|\bice cream\b|\bice maker\b(?!.*fridge)|\bminibar\b|\bcosmetic\b|\bskincare\b|\bkeg\b|\bdisplay (fridge|freezer)\b|\bcommercial\b/i.test(t),
  "washing-machines": (t) =>
    /washing machine|washer|dryer|front load|top load|heat pump|condenser/i.test(t) &&
    /\b\d{1,2}(\.\d)?\s?kg\b|\b[A-Z]{1,5}-?\d{3,5}[A-Z0-9-]*\b/i.test(t) &&
    !/\bstack(ing)? kit\b|\bpedestal\b|\bdrawer\b(?!.*(washer|dryer))|\bhoses?\b|\btaps?\b|\blint\b|\bcleaner\b|\bdetergent\b|\bpods\b|\bcover\b|\bshock\b|\banti-?vibration\b|\bfeet\b|\bwall (mount|bracket)\b|\bdishwasher\b|\bhair dryer\b|\bhairdryer\b|\b(blow|hair)[- ]?dryer\b|\bhand dryer\b|\bsalad\b|\bdehydrator\b|\bshoe dryer\b|\bclothes airer\b|\bairer\b|\bportable\b|\bmini\b|\bcommercial\b|\bpressure washer\b|\bdish ?washer\b/i.test(t),
  dishwashers: (t) =>
    /dishwasher/i.test(t) &&
    !/\btablets\b|\bdetergent\b|\brinse aid\b|\bsalt\b|\bcleaner\b|\bbaskets?\b(?!.*dishwasher \w)|\bcutlery\b|\brack\b|\bdoor panel\b|\bkickboard\b|\bplinth\b|\bhoses?\b|\bpods\b|\bpowder\b|\bgel\b|\bcapsules\b|\bliquid\b|\bdishwasher safe\b|\bcommercial\b/i.test(t),
  /** Hair dryers, straighteners, curlers, hot brushes and stylers, and hair clippers (2026-11). */
  "hair-care": (t) =>
    /hair ?dryer|blow[- ]?dryer|\bdryer\b.*\bhair\b|straightener|flat ?iron|hair iron|curl(er|ing) (iron|wand|tong)|curling|\bcurler\b|\bwaver\b|crimper|hot (air )?brush|heated brush|straightening brush|blow[- ]?dry brush|volumi[sz]er|hair styler|multi-?styler|air ?styler|airwrap|supersonic|corrale|airstrait|flexstyle|hair clipper|\bclippers?\b|hair trimmer/i.test(t) &&
    !TOY.test(t) &&
    !/\bcoffee\b|\bespresso\b|\bwhole bean\b|\bblend\b|\broast|\bpets?\b|\bdog\b|\bcat\b|\bhorse\b|\bnail\b|\bnose\b|\beyebrow\b|\bbikini\b|\bbody groomer\b|\bhedge\b|\bgrass\b|\bwire\b|\bribbon\b|\bclothes\b|\bhand dryer\b|\btumble\b|\bsalad\b|\bshoe\b|\bcurling (stone|broom)\b|\b(shampoo|conditioner|serum|mousse|hairspray|hair spray|heat protect\w*|primer|lotion|pomade|wax|balm)\b|\bscissors?\b|\bshears?\b|\bwigs?\b|\bextensions?\b|\bgift (set|pack)\b/i.test(t) &&
    !/\b(case|pouch|bag|mat|holder|stand|organi[sz]er|caddy|attachment|nozzle|diffuser|concentrator|comb|guard|blades?|head|filter|cord|spray|oil|cream|gel|mask|treatment|rollers?)s?\b/i.test(head(t).replace(/\bheated rollers?\b/i, "")) &&
    !/\bhair clips?\b|\bclaw clips?\b|\bsnap clips?\b/i.test(t),
  /** Stand mixers, blenders, food processors, kettles, toasters, microwaves, juicers and benchtop cookers (2026-11). */
  "small-kitchen": (t) =>
    /stand mixer|hand mixer|kitchen mixer|food mixer|planetary mixer|tilt[- ]head|bowl[- ]lift|blender|nutribullet|vitamix|food processor|mini chopper|\bkettle\b|toaster|microwave|juicer|juice extractor|citrus press|rice cooker|slow cooker|pressure cooker|multi-?cooker|instant pot|sandwich (press|maker)|toastie maker|waffle maker|bread ?maker|ice cream maker|\bcreami\b|sodastream|soda stream|sparkling water maker|dehydrator|electric fry ?pan|electric wok|health grill|contact grill|indoor grill|smart grill|cafe grill|optigrill|panini (press|grill|maker)|benchtop oven|countertop oven|toaster oven|mini oven|egg cooker|food steamer|soup maker|yogh?urt maker|popcorn maker|deep fryer|spirali[sz]er|meat mincer|thermo ?mix|\bkmix\b|kenwood chef|cooking chef/i.test(t) &&
    !TOY.test(t) &&
    !COFFEE_KETTLE.test(t) &&
    !/air ?fry|coffee (machine|maker)|espresso|\bstove ?top\b|\bwhistl|camping|kettlebell|\btea ?pot\b|microwave (safe|cookware|popcorn)|toaster bags?|\bco2\b|gas cylinder|\bsyrups?\b|\bflavou?rs?\b|\bpods?\b|\bcapsules?\b|\bcommercial\b|\bcatering\b|\bdj\b|\baudio\b|\bmixing\b|\bchannels?\b|\bconcrete\b|\bpaint\b|\bcocktail\b|built[- ]in (microwave|oven)|\bwall oven\b|\bcooktop\b|\brangehood\b|\bdrawer\b|\bphone\b|\btelephone\b|\bturntable\b|\brecord player\b|inner (cooking )?pot|sealing ring|\bpurifier\b|\bhumidifier\b|\bheater\b|\bfan\b|\bvacuum\b/i.test(t) &&
    !/\b(jugs?|jars?|bowls?|cups?|bottles?|blades?|beaters?|whisks?|dough hooks?|lids?|covers?|seals?|gaskets?|filters?|cartridges?|trays?|racks?|baskets?|pans?|dish(es)?|containers?|mats?|bags?|books?|cookbooks?|attachments?|accessor(y|ies)|stands?|shelf|shelves|brackets?|trim kits?|vent kits?|bundles?)\b/i.test(head(t).replace(/\bstand mixer\b/gi, "")),
  /** Gas, charcoal and pellet BBQs, smokers, kamados, griddles and outdoor pizza ovens (2026-11). */
  bbqs: (t) =>
    /\bbbq\b|barbe(cue|que)|\bgrill\b|griddle|smoker|kamado|pizza oven|pellet (grill|smoker)|\bbraai\b|hibachi|plancha|traeger|big green egg|kamado joe|\booni (koda|karu|fyra|volt)|gozney|woodfire|kettle grill|\bweber (q ?\d{3,4}|baby q|family q|spirit|genesis|summit|smokey|master-?touch|performer|traveler|slate|searwood|lumin|go-anywhere|smokefire|jumbo joe|original kettle|compact kettle)/i.test(t) &&
    !TOY.test(t) &&
    !/\bindoor\b|health grill|contact grill|\bpanini\b|\bsandwich\b|\btoaster\b|air ?fry|george foreman|\belectric (grill|griddle)\b(?!.*(outdoor|bbq|woodfire))|fire ?pit|patio heater|\bspeakers?\b|\bcar\b|\bradiator\b|\bgrille\b|\bcookbook\b|\bbook\b|smart grill|cafe grill|optigrill|\btopper\b|grill pan|non-?stick|\bcast iron\b/i.test(t) &&
    // Kitchen brands' "grills" are benchtop contact grills unless the title says they cook outdoors.
    !/\b(breville|sunbeam|kambrook|tefal|russell hobbs|morphy richards|salter|cuisinart|sage|de'?longhi|kenwood|philips|panasonic|smeg|kitchenaid|swan|tower|cooks professional|anko|kmart|dash|bella|chefman|elite gourmet|maxi-matic|presto|hamilton beach|instant( pot)?|kalorik|cosori|ninja foodi)\b(?!.*\b(outdoor|bbq|barbecue|gas|charcoal|pellet|pizza oven)\b)/i.test(t) &&
    !/\b(covers?|mats?|tools?|utensils?|brush(es)?|cleaners?|cleaning|scrapers?|spatulas?|tongs|forks?|thermometers?|probes?|gloves?|aprons?|rubs?|sauces?|seasonings?|marinades?|pellets|briquettes?|chips|chunks|firelighters?|fuel|bottles?|cylinders?|hoses?|regulators?|replacement|spares?|parts?|stones?|peels?|cutters?|steels?|foil|woks?|skillets?|dutch ovens?|cloths?|carry (case|bag)|bags?|inserts?|liners?|lights?|hooks?|holders?|grates?|grill plates?|griddle plates?|rotisserie (kits?|spit)|accessor(y|ies))\b/i.test(head(t)),
  /** Burr grinders, pour-over kettles, coffee scales, manual brewers and milk frothers (2026-11). */
  "coffee-gear": (t) =>
    (/grinder|coffee mill|hand mill|burr mill|gooseneck|pour[- ]?over|\bstagg\b|brewista|coffee scales?|espresso scales?|brew(ing)? scales?|\bacaia\b|aeropress|chemex|\bv60\b|dripper|french press|coffee plunger|cafeti[eè]re|\bmoka\b|bialetti|stove ?top espresso|\bkalita\b|origami dripper|milk frother|aeroccino|niche zero|mignon|baratza|comandante|1zpresso|kingrinder|\bmazzer\b|mahlk|\bwilfa\b|syphon|siphon/i.test(t) || (COFFEE_KETTLE.test(t) && /kettle/i.test(t))) &&
    !TOY.test(t) &&
    !/coffee machine|espresso machine|coffeemaker|coffee ?maker with|auto(matic)? pour[- ]?over|\b\d+[- ]cup\b.*\bcoffee maker\b|bean[- ]to[- ]cup|cold brew (coffee )?maker|filter coffee machine|drip coffee|\bpepper\b|\bsalt\b|\bspices?\b|\bherbs?\b|\bmeat\b|\bgrain\b|\bflour\b|\bnuts?\b|angle grinder|bench grinder|die grinder|\bdiscs?\b|\bcutting\b|makita|ryobi|dewalt|milwaukee|\bstump\b|\bwaste\b|\bbeans?\b|\b\d+ ?(g|kg)\b(?!.*(scale|grinder))|paper filters?|filter papers?|\b\d{2,4} ?(pk|pack|filters|pcs|count|ct)\b|subscription|gift card|\bsamples?\b|\bcommercial\b|\b\d+ ?lbs?\b|whole bean|ground coffee|\(coarse\)|\(fine\)|\bdecaf\b|\broast(ed|ers?)?\b|flavou?red|single origin|\bt-?shirt\b|\bhoodie\b|\bmerch\b|\bspeakers?\b|\bmonitor\b/i.test(t) &&
    !(/coffee maker/i.test(t) && !/aeropress|chemex|dripper|french press|plunger|moka|stove ?top|cafeti/i.test(t)) &&
    // A bag of coffee whose grind option names a brewer ("... Coffee French Press 12oz").
    !(/\bcoffee\b/i.test(t) && /\b\d+ ?oz\.?\b/i.test(t) && !/\b(maker|brewer|kettle|grinder|scale|frother|plunger|carafe|dripper|server)\b/i.test(t)) &&
    !/\b(filters?|papers?|burrs|replacement|spares?|parts?|gaskets?|seals?|silicone|mugs?|hopper|dosing|cleaning|cleaner|tablets|descal\w*|beakers?|lids?|cases?|sleeves?|bags?|stands?|holders?|brush(es)?|covers?|mats?|cloths?|trays?|pads?|batter(y|ies)|chargers?|accessor(y|ies))\b/i.test(head(t)),
};

export const isAppliance = (cat: ApplianceCat, t: string) => !NOT_NEW.test(t) && !PARTS.test(t) && APPLIANCE_IS[cat](t);
export const isApplianceCat = (c: string): c is ApplianceCat => (APPLIANCE_CATS as string[]).includes(c);

/** Below these a listing is an accessory or a placeholder. */
export const APPLIANCE_MIN_PRICE: Record<ApplianceCat, number> = {
  vacuums: 60, "air-fryers": 40, "coffee-machines": 60, fridges: 200, "washing-machines": 250, dishwashers: 250,
  "hair-care": 20, "small-kitchen": 20, bbqs: 60, "coffee-gear": 15,
};
