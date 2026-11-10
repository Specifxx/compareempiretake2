/**
 * "Offers from our partner stores" (owner, 2026-11-10: more clicks on the Awin links, visible but not crowding the top
 * of a page). The live offers and vouchers of every Awin programme that accepted us (data/awin/promotions.json, read
 * each morning by scripts/awin-sync.ts), grouped by store, for the region the store sells in. Pure: no network, and
 * nothing when there is nothing real: a store with no live offer is not listed, a page with no store draws nothing.
 *
 * Never a store row, a price, a "cheapest" or a deal; the link is the advertiser's own tracked home page (rel
 * "sponsored", labelled), so it costs the shopper nothing and changes no order.
 */
import programmes from "../../data/awin/programmes.json";
import promotions from "../../data/awin/promotions.json";
import { awinDeepLink, bareHost, clickref, type AwinProgramme } from "./awin";
import type { RegionId } from "./region";

export interface AwinOffer {
  id: number;
  advertiserId: number;
  type: "promotion" | "voucher";
  title: string;
  description: string;
  start: string;
  end: string;
  regions: "all" | string[];
  code?: string;
}

export interface PartnerOffers {
  advertiserId: number;
  name: string;
  /** The tracked link to the store's home page. */
  href: string;
  offers: AwinOffer[];
}

const COUNTRY: Record<RegionId, string> = { au: "AU", us: "US", uk: "GB", ca: "CA", sg: "SG" };
const DAY = 86_400_000;

const JOINED: AwinProgramme[] = Array.isArray((programmes as { joined?: unknown }).joined) ? (programmes as { joined: AwinProgramme[] }).joined : [];
const OFFERS: AwinOffer[] = Array.isArray((promotions as { promotions?: unknown }).promotions) ? (promotions as { promotions: AwinOffer[] }).promotions : [];

/** The region a programme sells in: its own country, else every region (an advertiser with no country is not guessed). */
function sellsIn(p: AwinProgramme, region: RegionId): boolean {
  return !!p.region && p.region.toUpperCase() === COUNTRY[region];
}

/**
 * Per partner store: its live offers (one day clear of the end, because a page lives until the next build; vouchers
 * first, then soonest ending), at most `perStore`, stores with the most offers first, at most `stores` of them.
 */
export function partnerOffers(region: RegionId, placement: string, opts: { stores?: number; perStore?: number; now?: number; joined?: AwinProgramme[]; offers?: AwinOffer[] } = {}): PartnerOffers[] {
  const { stores = 3, perStore = 2, now = Date.now(), joined = JOINED, offers = OFFERS } = opts;
  const out: PartnerOffers[] = [];
  for (const p of joined) {
    if (p.link || !sellsIn(p, region) || !p.domains[0]) continue;
    const live = offers
      .filter((o) => o.advertiserId === p.id && Date.parse(o.start) <= now && Date.parse(o.end) - now > DAY)
      .sort((a, b) => Number(b.type === "voucher") - Number(a.type === "voucher") || a.end.localeCompare(b.end))
      .slice(0, perStore);
    if (!live.length) continue;
    out.push({ advertiserId: p.id, name: p.name, href: awinDeepLink(p.id, `https://www.${bareHost(p.domains[0])}/`, clickref("ce", "offers", region, placement)), offers: live });
  }
  return out.sort((a, b) => b.offers.length - a.offers.length || a.name.localeCompare(b.name)).slice(0, stores);
}
