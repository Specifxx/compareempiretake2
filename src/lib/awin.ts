/**
 * Awin (publisher "Compare Empire", ID 3144410): every link to a store that has accepted us on Awin becomes a tracked
 * Awin deep link, with no step by hand (owner, 2026-11-06: "check, and if it's not there, just do it").
 *
 * The list of programmes that accepted us is `data/awin/programmes.json`, written each morning by
 * `scripts/awin-sync.ts` from Awin's publisher API (secret AWIN_API_TOKEN) and committed with the prices. It is public
 * on purpose: the sister sites copy it at build (their `scripts/fetch-awin.ts`), so one token serves the family. It
 * holds only what is in every Awin link anyway: the advertiser's id, name and the domains it tracks.
 *
 * A link is wrapped only when its host is one of the advertiser's own tracked domains and the advertiser allows deep
 * links; anything else (or a programme we have not joined) is left exactly as it was. Never eBay or Amazon: they have
 * their own programmes. Prices and ranking never change: this decides the href, not the order.
 */
import file from "../../data/awin/programmes.json";

export const AWIN_PUBLISHER_ID = 3144410;

export interface AwinProgramme {
  id: number;
  name: string;
  /** Bare hosts the advertiser tracks ("currys.co.uk"); a subdomain of one matches too. */
  domains: string[];
  region?: string;
  currency?: string;
}

const JOINED: AwinProgramme[] = Array.isArray((file as { joined?: unknown }).joined) ? (file as { joined: AwinProgramme[] }).joined : [];

/** Never wrapped, whatever a programme lists: these have their own programmes on every site. */
const NEVER = /(^|\.)(ebay\.[a-z.]+|amazon\.[a-z.]+|amzn\.to|tcgplayer\.com)$/;

/** "https://www.Currys.co.uk/path", "*.currys.co.uk", "currys.co.uk" → "currys.co.uk". */
export function bareHost(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^\*\./, "")
    .replace(/[/?#:].*$/, "")
    .replace(/^www\./, "");
}

function hostOf(url: string): string {
  try {
    return bareHost(new URL(url).hostname);
  } catch {
    return "";
  }
}

export function isAwinLink(url: string): boolean {
  const h = hostOf(url);
  return h === "awin1.com" || h === "tidd.ly";
}

/** The joined programme whose tracked domains cover this link's host, or null. */
export function awinProgrammeFor(url: string, joined: AwinProgramme[] = JOINED): AwinProgramme | null {
  const h = hostOf(url);
  if (!h || NEVER.test(h)) return null;
  for (const p of joined) for (const d of p.domains) if (d && (h === d || h.endsWith("." + d))) return p;
  return null;
}

/** Awin's clickref allows letters, digits, "-" and "_" (max 50). */
export function clickref(...parts: (string | number | null | undefined)[]): string {
  return parts
    .filter((x) => x != null && x !== "")
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .slice(0, 50);
}

export function awinDeepLink(advertiserId: number, destination: string, ref: string): string {
  const q = `awinmid=${advertiserId}&awinaffid=${AWIN_PUBLISHER_ID}${ref ? `&clickref=${encodeURIComponent(ref)}` : ""}`;
  return `https://www.awin1.com/cread.php?${q}&ued=${encodeURIComponent(destination)}`;
}

/**
 * The tracked href for a store link, or null when Awin has nothing to do with it. A link that already is an Awin link
 * (a product feed's aw_deep_link) keeps its tracking and gains our clickref if it has none.
 */
export function awinUrl(url: string, ref: string, joined: AwinProgramme[] = JOINED): string | null {
  if (isAwinLink(url)) {
    try {
      const u = new URL(url);
      if (ref && !u.searchParams.has("clickref")) u.searchParams.set("clickref", ref);
      return u.toString();
    } catch {
      return url;
    }
  }
  const p = awinProgrammeFor(url, joined);
  return p ? awinDeepLink(p.id, url, ref) : null;
}

/** How many programmes have accepted us (for the about/disclosure copy and the ops report). */
export const AWIN_JOINED_COUNT = JOINED.length;
