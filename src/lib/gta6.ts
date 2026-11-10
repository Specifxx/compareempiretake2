// The GTA 6 shopping hub (/gta-6, owner, 2026-11-10): the consoles the game runs on, priced at each region's stores, and
// the accessories people add to the basket, as plain Amazon and eBay searches. Pure (the view passes the catalogue read),
// so tests/gta6.test.ts checks the selection. Facts only, each from Rockstar's own newswire; no price for the game itself
// (it is the same everywhere) and no stock or shortage claim we cannot see in a store's own listing.
import type { PhoneSummary } from "@/lib/catalog";
import type { RegionId } from "@/lib/region";

export const GTA6 = {
  releaseDate: "2026-11-19",
  /** Rockstar's own announcements name these two families. */
  platforms: "PlayStation 5 and Xbox Series X|S",
  source: { label: "Rockstar Games Newswire", url: "https://www.rockstargames.com/newswire/article/ak3ak31a49a221/grand-theft-auto-vi-is-now-set-to-launch-november-19-2026" },
  checked: "2026-11-10",
} as const;

/** Regions the hub exists in: the ones with a console catalogue and a place to send a buyer. */
export const GTA6_REGIONS: RegionId[] = ["au", "us", "uk"];

/** PlayStation 5 and Xbox Series X|S consoles only (never Switch, handhelds or accessories), most stores first, then cheapest. */
export function gta6Consoles(products: readonly PhoneSummary[], limit = 12): PhoneSummary[] {
  return products
    .filter((p) => p.category === "consoles" && p.inStock && /\b(playstation\s*5|ps5|xbox\s*series)\b/i.test(`${p.name} ${p.model}`) && !/\b(controller|headset|charging|dock|stand|cover|case|skin)\b/i.test(p.name))
    .sort((a, b) => b.retailerCount - a.retailerCount || a.bestPrice - b.bestPrice)
    .slice(0, limit);
}

export interface Gta6Accessory { key: string; title: string; note: string; query: string }

/** What buyers add to a console: a search term for Amazon and for eBay's new listings. */
export const GTA6_ACCESSORIES: Gta6Accessory[] = [
  { key: "ps5-controller", title: "PS5 DualSense controller", note: "A second pad for the couch", query: "PS5 DualSense wireless controller" },
  { key: "xbox-controller", title: "Xbox wireless controller", note: "Works with Xbox Series X|S", query: "Xbox wireless controller" },
  { key: "ps5-ssd", title: "PS5 internal SSD (M.2 NVMe)", note: "More room for a very large download", query: "PS5 M.2 NVMe SSD 2TB heatsink" },
  { key: "xbox-storage", title: "Xbox storage expansion card", note: "For Xbox Series X|S", query: "Xbox Series X|S storage expansion card" },
  { key: "headset", title: "Gaming headset", note: "For PS5 and Xbox", query: "wireless gaming headset PS5 Xbox" },
  { key: "tv-4k", title: "4K gaming TV (120Hz)", note: "Compare TVs on our TV page", query: "4K 120Hz gaming TV HDMI 2.1" },
];

export const GTA6_FAQ = (place: string): { q: string; a: string }[] => [
  { q: "When does GTA 6 come out?", a: "Rockstar Games says Grand Theft Auto VI launches on Thursday 19 November 2026." },
  { q: "Which consoles can play GTA 6?", a: `Rockstar's announcements name ${GTA6.platforms}. None of them mentions a PC version.` },
  { q: `Where can I compare PS5 and Xbox prices in ${place}?`, a: "Above: the PS5 and Xbox consoles we track at the region's stores, most stores first, checked every day. Each links to its own page with every store's price." },
];
