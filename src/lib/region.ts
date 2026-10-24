/**
 * The countries we compare prices in. Australia lives at the root ("/phones"); every other region
 * has its own path prefix ("/us/phones") and its own data folder (data/us/<category>).
 * Prices are never converted: each region compares only its own stores, in its own currency.
 */
export type RegionId = "au" | "us" | "uk";

export interface Region {
  id: RegionId;
  /** URL prefix: "" for Australia, "/us", "/uk". */
  prefix: string;
  name: string;
  /** "Australian", "US", "UK" — for "{adjective} stores". */
  adjective: string;
  flag: string;
  currency: "AUD" | "USD" | "GBP";
  locale: string;
  /** hreflang value for alternates. */
  hreflang: string;
  /** Shown beside prices. */
  taxNote: string;
  timeZone: string;
  /** Folder under data/ ("" for Australia). */
  dataDir: string;
}

export const REGIONS: Record<RegionId, Region> = {
  au: { id: "au", prefix: "", name: "Australia", adjective: "Australian", flag: "🇦🇺", currency: "AUD", locale: "en-AU", hreflang: "en-AU", taxNote: "Prices in AUD incl. GST", timeZone: "Australia/Sydney", dataDir: "" },
  us: { id: "us", prefix: "/us", name: "United States", adjective: "US", flag: "🇺🇸", currency: "USD", locale: "en-US", hreflang: "en-US", taxNote: "Prices in USD before sales tax", timeZone: "America/New_York", dataDir: "us" },
  uk: { id: "uk", prefix: "/uk", name: "United Kingdom", adjective: "UK", flag: "🇬🇧", currency: "GBP", locale: "en-GB", hreflang: "en-GB", taxNote: "Prices in GBP incl. VAT", timeZone: "Europe/London", dataDir: "uk" },
};

export const REGION_IDS = Object.keys(REGIONS) as RegionId[];
/** Regions other than Australia, which have their own route folders (src/app/us, src/app/uk). */
export const PREFIXED_REGIONS: RegionId[] = ["us", "uk"];

export const regionOf = (pathname: string): RegionId => {
  const seg = pathname.split("/")[1];
  return seg === "us" || seg === "uk" ? seg : "au";
};

/** The data folder for a category in a region: data/phones, data/us/phones. */
export const dataPath = (region: RegionId, ...parts: string[]) => ["data", REGIONS[region].dataDir, ...parts].filter(Boolean).join("/");

/** "$1,299", "£899.99": whole amounts drop the cents. */
export function money(n: number, region: RegionId = "au"): string {
  const r = REGIONS[region];
  const whole = Math.abs(n - Math.round(n)) < 0.005;
  return new Intl.NumberFormat(r.locale, { style: "currency", currency: r.currency, minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(n);
}

/** Prefix a site path with the region: withRegion("/phones", "us") → "/us/phones". */
export const withRegion = (href: string, region: RegionId) => (region === "au" || !href.startsWith("/") ? href : `${REGIONS[region].prefix}${href === "/" ? "" : href}`);
