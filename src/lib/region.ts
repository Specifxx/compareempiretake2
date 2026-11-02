/**
 * The countries we compare prices in. Australia's pages have no prefix ("/phones") except its home (/au); every other
 * region has its own path prefix ("/us/phones") and its own data folder (data/us/<category>). The root is the US home.
 * Prices are never converted: each region compares only its own stores, in its own currency.
 */
export type RegionId = "au" | "us" | "uk";

export interface Region {
  id: RegionId;
  /** URL prefix of category and product pages: "" for Australia, "/us", "/uk". Homes are HOME_PATH. */
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

/**
 * Each region's home page. The site root is the US home (owner, 2026-11-01: "it's probably better for US to be on the
 * indexing"; Googlebot crawls from the US) and Australia's home moved to /au. Every other Australian page keeps its
 * prefix-less URL ("/phones"), so only the home moved.
 */
export const HOME_PATH: Record<RegionId, string> = { au: "/au", us: "/", uk: "/uk" };

export const regionOf = (pathname: string): RegionId => {
  const seg = pathname.split("/")[1];
  if (seg === "us" || seg === "uk" || seg === "au") return seg;
  return seg ? "au" : "us";
};

/**
 * Pages that belong to no region (about, legal, forum, reviews…). Their server HTML is built for the US, the default,
 * and the browser moves the header and footer to the visitor's own region (`useRegion`). They never redirect.
 */
const NEUTRAL = new Set(["about", "contact", "privacy", "disclosure", "affiliate-disclosure", "reviews", "forum", "saved", "alerts", "admin", "embed"]);
export const isNeutralPath = (pathname: string) => NEUTRAL.has(pathname.split("/")[1] ?? "");

/** The region a browser's time zone points at; anything we don't cover is the US (owner, 2026-11-01). */
export function regionFromTimeZone(tz: string | null | undefined): RegionId {
  if (!tz) return "us";
  if (/^Australia\//.test(tz)) return "au";
  if (/^Europe\/(London|Belfast|Guernsey|Jersey|Isle_of_Man)$/.test(tz)) return "uk";
  return "us";
}

/** Where a region choice made in the header (or the "stay" button) is kept, per browser. */
export const REGION_STORAGE_KEY = "ce-region";

/** Crawlers, link previews and audit tools: never moved to another region, so every regional page stays indexable. */
export const BOT_UA = /bot|crawl|spider|slurp|google|bing|yandex|baidu|duckduck|lighthouse|headless|preview|facebookexternalhit|embedly|whatsapp/i;

/**
 * Inline, before first paint: a visitor on a page of another region than their own (the one they picked in the header,
 * else their time zone's, else the US) is sent to the same page in their region when the page lists one as an hreflang
 * alternate. Until DOMContentLoaded `<main>` is hidden (globals.css, html[data-geo]), at most 1.5 s. When the page has
 * no such alternate (an Australian guide), it stays and `data-geo-miss` tells RegionNotice to offer the region's home.
 * Crawlers are never moved. Nothing is sent anywhere: no request, no cookie.
 */
export const REGION_BOOT_SCRIPT = `(function(){try{
var d=document.documentElement,p=location.pathname,s=p.split("/")[1]||"";
if(${BOT_UA}.test(navigator.userAgent))return;
if(${JSON.stringify([...NEUTRAL])}.indexOf(s)>=0)return;
var page=s==="us"||s==="uk"||s==="au"?s:s?"au":"us";
var want=null;try{want=localStorage.getItem("${REGION_STORAGE_KEY}")}catch(e){}
if(want!=="au"&&want!=="us"&&want!=="uk"){var z="";try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||""}catch(e){}
want=z.indexOf("Australia/")===0?"au":["Europe/London","Europe/Belfast","Europe/Guernsey","Europe/Jersey","Europe/Isle_of_Man"].indexOf(z)>=0?"uk":"us"}
if(want===page)return;
var from=null;try{from=sessionStorage.getItem("ce-geo-from")}catch(e){}
if(from===p)return;
var H=${JSON.stringify({ au: "en-AU", us: "en-US", uk: "en-GB" })};
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
