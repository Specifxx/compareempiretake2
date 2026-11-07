import type { RegionId } from "./region";

/**
 * Big stores shoppers expect that the site does not compare yet, and the plain reason (Reddit feedback,
 * 2026-11-07: "can you add BigW, Target and Kmart? They are the cheapest for LEGO"). Kept in step with
 * docs/stores/big-stores.md. We never read past a bot wall or use a key lifted from a page's JavaScript, so
 * these wait on the store's own product feed through an affiliate network. A store leaves this list the day
 * its feed starts (StoresView hides any name that already has prices).
 */
export interface Uncovered {
  name: string;
  /** Why we can't read it today, for a shopper. */
  why: string;
  /** What would bring it in. */
  next: string;
}

const WALL = "Its website blocks automated price checks, and we never work around that.";
const SCRIPT = "Its prices load through a private search service in the page's JavaScript, which we don't use.";
const FEED = "Coming once its affiliate product feed is approved.";
const NONE = "It has no product feed we can use yet.";

export const UNCOVERED: Record<RegionId, Uncovered[]> = {
  au: [
    { name: "Big W", why: WALL, next: FEED },
    { name: "Target", why: "Its category pages don't load for automated checks.", next: FEED },
    { name: "Kmart", why: WALL, next: NONE },
    { name: "Myer", why: SCRIPT, next: FEED },
    { name: "David Jones", why: WALL, next: FEED },
    { name: "Kogan", why: WALL, next: FEED },
    { name: "Catch", why: WALL, next: FEED },
    { name: "Bing Lee", why: WALL, next: FEED },
    { name: "Bunnings", why: WALL, next: NONE },
    { name: "Appliances Online", why: "Its pages are drawn in the browser; reading them one by one is a big job we haven't done yet.", next: "Planned." },
  ],
  us: [
    { name: "Walmart", why: WALL, next: FEED },
    { name: "Target", why: SCRIPT, next: FEED },
    { name: "Home Depot", why: WALL, next: FEED },
    { name: "Lowe's", why: WALL, next: FEED },
    { name: "Newegg", why: WALL, next: FEED },
    { name: "B&H Photo", why: WALL, next: FEED },
    { name: "Costco", why: SCRIPT, next: NONE },
    { name: "Micro Center", why: WALL, next: NONE },
  ],
  uk: [
    { name: "Currys", why: WALL, next: FEED },
    { name: "Argos", why: WALL, next: FEED },
    { name: "AO", why: WALL, next: FEED },
    { name: "John Lewis", why: WALL, next: FEED },
    { name: "Very", why: WALL, next: FEED },
    { name: "Smyths Toys", why: WALL, next: FEED },
    { name: "Costco UK", why: WALL, next: NONE },
  ],
  ca: [],
  sg: [],
};
