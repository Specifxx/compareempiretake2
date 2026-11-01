/** One listing as a retailer shows it, before it is matched to a phone. */
export interface RawOffer {
  retailer: RetailerId;
  /** The retailer's own id for the listing (SKU, variant id, URL key). */
  sku: string;
  title: string;
  url: string;
  /** Price in AUD, incl. GST, as shown to a shopper. */
  price: number;
  /** The retailer's own "was"/RRP price when it shows one. */
  wasPrice?: number;
  image?: string;
  inStock: boolean;
  /** Short marketing blurb when the retailer gives one (JB Hi-Fi). */
  blurb?: string;
  /** "plan": the phone is paid off monthly with a carrier plan (price = device total). */
  kind?: "outright" | "plan";
  monthly?: number;
  months?: number;
  /** Title has no storage; the price is the store's "from" price for the base model. */
  fromPrice?: boolean;
  /** Manufacturer part number / model code when the store shows one (e.g. QA65QN90FAWXXY, U2724D). */
  mpn?: string;
  /** Brand as the store records it, when separate from the title. */
  brand?: string;
}

/** Product categories with their own scrapers and data/<id>/ directory. */
export type CategoryId =
  | "phones"
  | "tablets"
  | "smartwatches"
  | "laptops"
  | "desktops"
  | "monitors"
  | "printers"
  | "routers"
  | "graphics-cards"
  | "cpus"
  | "ssds"
  | "ram"
  | "motherboards"
  | "tvs"
  | "soundbars"
  | "headphones"
  | "speakers"
  | "consoles"
  | "cameras"
  | "drones"
  | "robot-vacuums"
  | "vacuums"
  | "air-fryers"
  | "coffee-machines"
  | "fridges"
  | "washing-machines"
  | "dishwashers"
  | "lego";

/** AU stores keep bare ids; US and UK stores are prefixed with their region ("us-bestbuy", "uk-currys"). */
export type RetailerId =
  | `us-${string}`
  | `uk-${string}`
  | "jbhifi"
  | "harveynorman"
  | "thegoodguys"
  | "mobileciti"
  | "apple"
  | "samsung"
  | "telstra"
  | "optus"
  | "vodafone"
  | "amaysim"
  | "telechoice"
  | "costco"
  | "umart"
  | "msy"
  | "digidirect"
  | "betta"
  | "mwave"
  | "centrecom"
  | "ple"
  | "scorptec"
  | "pccg"
  | "computeralliance"
  | "dell"
  | "lenovo"
  | "hp"
  | "microsoft"
  | "appliancesonline"
  | "dji"
  | "sonos"
  | "bose"
  | "garmin"
  | "ecovacs"
  | "dreame"
  | "sharkninja"
  | "tefal"
  | "bissell"
  | "toysrus"
  | "toyworld"
  | "kidstuff"
  | "hobbyco"
  | "movaau"
  | "narwalau"
  | "shokzau"
  | "addictedtoaudio"
  | "alternativebrewing"
  | "austin"
  | "billyguyatts"
  | "cameraelectronic"
  | "d1store"
  | "edifierau"
  | "georges"
  | "lenwallis"
  | "teds"
  | "eufyau"
  | "hyperxau"
  | "soundcoreau"
  | "audioconnection"
  | "baristawarehouse"
  | "billyhyde"
  | "bissellau"
  | "brickbuilder"
  | "carltonav"
  | "dronesdirectau"
  | "hobbywarehouse"
  | "hooverau"
  | "westcoasthifi"
  | "absolutehifi"
  | "theaudiotailor"
  | "brickville"
  | "melbournehifi"
  | "theaudioexperts"
  | "thevacuumshop"
  | "toyworldbendigo"
  | "artisti"
  | "blackboardcoffee"
  | "darkstarcoffee"
  | "dipacci"
  | "marketlane"
  | "threebearscoffee"
  | "singleo"
  | "audiotrends"
  | "brickresales"
  | "brisbanehifi"
  | "discounttoyco"
  | "dukescoffee"
  | "godfreys"
  | "merlo"
  | "toottoottoys"
  | "toybricks"
  | "toyworldfrankston"
  | "toyworldwarrnambool"
  | "sydneyhifimonavale"
  | "klappav"
  | "vinylrevival"
  | "kitchenaidau"
  | "tefalau"
  | "industrybeans"
  | "eastwoodhifi"
  | "thehifishop"
  | "goldcoasthifi"
  | "cosmorex"
  | "audioroom"
  | "customht"
  | "birite"
  | "videoguys"
  | "theplayroom"
  | "buymobile";

export interface Retailer {
  id: RetailerId;
  name: string;
  site: string;
  /** Brand colour used for the retailer chip. */
  color: string;
  type: "retailer" | "official" | "carrier";
}

export interface Offer {
  retailer: RetailerId;
  sku: string;
  title: string;
  url: string;
  price: number;
  wasPrice?: number;
  colour: string;
  inStock: boolean;
  image?: string;
  kind?: "outright" | "plan";
  monthly?: number;
  months?: number;
}

export interface Variant {
  /** e.g. "256gb", "256gb-cellular", "std" */
  id: string;
  /** What shoppers pick between: "256GB", "256GB · Cellular", "Standard". */
  label: string;
  /** 0 when storage isn't how this product varies (TVs, monitors, graphics cards). */
  storageGb: number;
  offers: Offer[];
  /** Lowest in-stock price across retailers (falls back to any offer). */
  bestPrice: number;
  /** Lowest price this variant has been seen at in our history. */
  lowestEver?: number;
  /** Best price on the earliest day in the history window. */
  previousBest?: number;
}

/** A product in any category. ("Phone" is kept as the historical name.) */
export interface Phone {
  slug: string;
  category: CategoryId;
  brand: string;
  /** Model name without the brand, e.g. "iPhone 17 Pro". */
  model: string;
  name: string;
  image?: string;
  images: string[];
  colours: string[];
  variants: Variant[];
  bestPrice: number;
  retailerCount: number;
  offerCount: number;
  blurb?: string;
  specs: Specs;
  /** Release-ish ordering: higher is newer, derived from model numbers. */
  generation: number;
  firstSeen: string;
  /** Today's cheapest matching new eBay listing (data/<region>/ebay.json), attached at load. */
  ebay?: { price: number; shipping?: number; title: string; url: string; seller?: string; feedback?: number; checkedAt: string };
  /** Set when the catalogue is loaded (not stored): the country this product's prices are from. */
  region?: import("./region").RegionId;
}

export interface Specs {
  screenInches?: number;
  chip?: string;
  mainCameraMp?: number;
  batteryMah?: number;
  network?: "5G" | "4G";
  foldable?: boolean;
  esimOnly?: boolean;
  /** Category-specific key specs shown as label/value rows: ["Resolution", "4K"], ["VRAM", "16GB"]. */
  extra?: [string, string][];
}
export type Product = Phone;

export interface Catalog {
  category: CategoryId;
  updatedAt: string;
  retailers: Retailer[];
  phones: Phone[];
}

/** One day of best prices: phone slug -> variant id -> retailer -> price. */
export type HistoryDay = Record<string, Record<string, Partial<Record<RetailerId, number>>>>;

/** Each store's own price history: phone slug -> variant id -> retailer -> [date, price][]. */
export type StoreSeries = Record<string, Record<string, Partial<Record<RetailerId, [string, number][]>>>>;
