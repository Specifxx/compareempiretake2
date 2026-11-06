/**
 * The countries we compare prices in. Australia's pages have no prefix ("/phones") except its home (/au); every other
 * region has its own path prefix ("/us/phones") and its own data folder (data/us/<category>). The root is the US home.
 * Prices are never converted: each region compares only its own stores, in its own currency.
 */
export type RegionId = "au" | "us" | "uk" | "ca" | "sg";

export interface Region {
  id: RegionId;
  /** URL prefix of category and product pages: "" for Australia, "/us", "/uk", "/ca", "/sg". Homes are HOME_PATH. */
  prefix: string;
  name: string;
  /** "Australian", "US", "UK" — for "{adjective} stores". */
  adjective: string;
  flag: string;
  currency: "AUD" | "USD" | "GBP" | "CAD" | "SGD";
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
  ca: { id: "ca", prefix: "/ca", name: "Canada", adjective: "Canadian", flag: "🇨🇦", currency: "CAD", locale: "en-CA", hreflang: "en-CA", taxNote: "Prices in CAD before sales tax", timeZone: "America/Toronto", dataDir: "ca" },
  sg: { id: "sg", prefix: "/sg", name: "Singapore", adjective: "Singapore", flag: "🇸🇬", currency: "SGD", locale: "en-SG", hreflang: "en-SG", taxNote: "Prices in SGD incl. GST", timeZone: "Asia/Singapore", dataDir: "sg" },
};

export const REGION_IDS = Object.keys(REGIONS) as RegionId[];
/** Regions other than Australia, which have their own route folders (src/app/us, src/app/uk, src/app/ca, src/app/sg). */
export const PREFIXED_REGIONS: RegionId[] = ["us", "uk", "ca", "sg"];

/**
 * Each region's home page. The site root is the US home (owner, 2026-11-01: "it's probably better for US to be on the
 * indexing"; Googlebot crawls from the US) and Australia's home moved to /au. Every other Australian page keeps its
 * prefix-less URL ("/phones"), so only the home moved.
 */
export const HOME_PATH: Record<RegionId, string> = { au: "/au", us: "/", uk: "/uk", ca: "/ca", sg: "/sg" };

export const regionOf = (pathname: string): RegionId => {
  const seg = pathname.split("/")[1];
  if (seg === "us" || seg === "uk" || seg === "au" || seg === "ca" || seg === "sg") return seg;
  return seg ? "au" : "us";
};

/**
 * Pages that belong to no region (about, legal, forum, reviews…). Their server HTML is built for the US, the default,
 * and the browser moves the header and footer to the visitor's own region (`useRegion`). They never redirect.
 */
const NEUTRAL = new Set(["about", "contact", "privacy", "disclosure", "affiliate-disclosure", "reviews", "forum", "saved", "alerts", "admin", "embed", "price-report"]);
export const isNeutralPath = (pathname: string) => NEUTRAL.has(pathname.split("/")[1] ?? "");

/** Canada's IANA zones (and the legacy Canada/* names). America/Toronto etc. are Canada-only zones. */
const CANADA_TZ = /^(Canada\/|America\/(Toronto|Montreal|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Moncton|Glace_Bay|Goose_Bay|Whitehorse|Dawson|Dawson_Creek|Yellowknife|Iqaluit|Rankin_Inlet|Resolute|Cambridge_Bay|Inuvik|Swift_Current|Creston|Fort_Nelson|Atikokan|Blanc-Sablon|Rainy_River|Thunder_Bay|Nipigon|Pangnirtung)$)/;

/** The region a browser's time zone points at; anything we don't cover is the US (owner, 2026-11-01). */
export function regionFromTimeZone(tz: string | null | undefined): RegionId {
  if (!tz) return "us";
  if (/^Australia\//.test(tz)) return "au";
  if (/^Europe\/(London|Belfast|Guernsey|Jersey|Isle_of_Man)$/.test(tz)) return "uk";
  if (CANADA_TZ.test(tz)) return "ca";
  if (tz === "Asia/Singapore" || tz === "Singapore") return "sg";
  return "us";
}

/** Where a region choice made in the header (or the "stay" button) is kept, per browser. */
export const REGION_STORAGE_KEY = "ce-region";

/** Crawlers, link previews and audit tools: never moved to another region, so every regional page stays indexable. */
export const BOT_UA = /bot|crawl|spider|slurp|google|bing|yandex|baidu|duckduck|lighthouse|headless|preview|facebookexternalhit|embedly|whatsapp/i;

/**
 * Inline, before first paint: a visitor who PICKED a region (the header's switcher or RegionNotice's buttons, kept in
 * localStorage) and lands on another region's page is sent to the same page in their region when the page lists one as
 * an hreflang alternate. Until DOMContentLoaded `<main>` is hidden (globals.css, html[data-geo]), at most 1.5 s.
 * A visitor who never picked is never moved (2026-11-02, Google's guidance: no automatic redirects on a guessed
 * location): RegionNotice offers their time zone's copy instead. Crawlers are never moved. Nothing is sent anywhere.
 */
export const REGION_BOOT_SCRIPT = `(function(){try{
var d=document.documentElement,p=location.pathname,s=p.split("/")[1]||"";
if(${BOT_UA}.test(navigator.userAgent))return;
if(${JSON.stringify([...NEUTRAL])}.indexOf(s)>=0)return;
var R=${JSON.stringify(["au", "us", "uk", "ca", "sg"])};
var page=R.indexOf(s)>=0?s:s?"au":"us";
var want=null;try{want=localStorage.getItem("${REGION_STORAGE_KEY}")}catch(e){}
if(R.indexOf(want)<0||(d.getAttribute("data-regions")||"").split(" ").indexOf(want)<0)return;
if(want===page)return;
var from=null;try{from=sessionStorage.getItem("ce-geo-from")}catch(e){}
if(from===p)return;
var H=${JSON.stringify({ au: "en-AU", us: "en-US", uk: "en-GB", ca: "en-CA", sg: "en-SG" })};
d.setAttribute("data-geo","pending");
var done=function(){d.removeAttribute("data-geo")};
setTimeout(done,1500);
var go=function(){var l=document.querySelector('link[rel="alternate"][hreflang="'+H[want]+'"]');
if(l&&l.href){var u=new URL(l.href,location.href);if(u.pathname!==p){try{sessionStorage.setItem("ce-geo-from",u.pathname)}catch(e){}location.replace(u.pathname+location.search+location.hash);return}}
d.setAttribute("data-geo-miss",want);done()};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go();
}catch(e){}})();`;

/** The data folder for a category in a region: data/phones, data/us/phones. */
export const dataPath = (region: RegionId, ...parts: string[]) => ["data", REGIONS[region].dataDir, ...parts].filter(Boolean).join("/");

/** "$1,299", "£899.99": whole amounts drop the cents. */
export function money(n: number, region: RegionId = "au"): string {
  const r = REGIONS[region];
  const whole = Math.abs(n - Math.round(n)) < 0.005;
  return new Intl.NumberFormat(r.locale, { style: "currency", currency: r.currency, minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(n);
}

/** Prefix a site path with the region: withRegion("/phones", "us") → "/us/phones". */
export const withRegion = (href: string, region: RegionId) =>
  href === "/" ? HOME_PATH[region] : region === "au" || !href.startsWith("/") ? href : `${REGIONS[region].prefix}${href}`;

/** hreflang alternates plus x-default, the US copy (owner, 2026-11-01), when the page has more than one region. */
export function withXDefault(langs: Record<string, string>): Record<string, string> {
  return Object.keys(langs).length > 1 && langs["en-US"] ? { ...langs, "x-default": langs["en-US"] } : langs;
}
