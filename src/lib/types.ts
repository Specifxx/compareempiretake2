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
}

export type RetailerId = "jbhifi" | "harveynorman" | "thegoodguys" | "mobileciti";

export interface Retailer {
  id: RetailerId;
  name: string;
  site: string;
  /** Brand colour used for the retailer chip. */
  color: string;
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
}

export interface Variant {
  /** e.g. "256gb" */
  id: string;
  storageGb: number;
  offers: Offer[];
  /** Lowest in-stock price across retailers (falls back to any offer). */
  bestPrice: number;
  /** Lowest price this variant has been seen at in our history. */
  lowestEver?: number;
  /** Best price on the earliest day in the history window. */
  previousBest?: number;
}

export interface Phone {
  slug: string;
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
}

export interface Specs {
  screenInches?: number;
  chip?: string;
  mainCameraMp?: number;
  batteryMah?: number;
  network: "5G" | "4G";
  foldable: boolean;
  esimOnly?: boolean;
}

export interface Catalog {
  updatedAt: string;
  retailers: Retailer[];
  phones: Phone[];
}

/** One day of best prices: phone slug -> variant id -> retailer -> price. */
export type HistoryDay = Record<string, Record<string, Partial<Record<RetailerId, number>>>>;
