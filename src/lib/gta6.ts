// The GTA 6 shopping hub (/gta-6, owner, 2026-11-10): the consoles the game runs on, priced at each region's stores, and
// the accessories people add to the basket, as plain Amazon and eBay searches. Pure (the view passes the catalogue read),
// so tests/gta6.test.ts checks the selection. Facts only: the date and platforms from Rockstar's own newswire, the two
// editions' list prices as reported at launch (the same at every store, so never compared), and no stock or shortage claim
// we cannot see in a store's own listing.
import type { PhoneSummary } from "@/lib/catalog";
import type { RegionId } from "@/lib/region";

export const PS6_SOURCE = { label: "TechRadar", url: "https://www.techradar.com/gaming/sony-ceo-confirms-the-ps6-launch-date-is-still-undecided-due-to-the-ongoing-component-shortage-considering-that-importance-we-need-to-take-some-action-otherwise-we-cannot-survive-in-this-landscape" } as const;

export const GTA6 = {
  releaseDate: "2026-11-19",
  /** Rockstar's own announcements name these two families. */
  platforms: "PlayStation 5 and Xbox Series X|S",
  source: { label: "Rockstar Games Newswire", url: "https://www.rockstargames.com/newswire/article/ak3ak31a49a221/grand-theft-auto-vi-is-now-set-to-launch-november-19-2026" },
  checked: "2026-11-20",
} as const;

/** Launch list prices of the two editions (20 Nov 2026), as TechRadar reported them; the same at every store, so shown once. */
export const GTA6_EDITIONS: Record<"au" | "us" | "uk", { standard: string; ultimate: string }> = {
  au: { standard: "A$129.95", ultimate: "A$159.95" },
  us: { standard: "US$79.99", ultimate: "US$99.99" },
  uk: { standard: "£69.99", ultimate: "£89.99" },
};
export const GTA6_PRICE_SOURCE = { label: "TechRadar", url: "https://www.techradar.com/gaming/new-report-suggests-retailers-may-run-out-of-ps5-and-xbox-stock-around-the-launch-of-gta-6-demand-will-likely-outstrip-supply-during-the-year-end-period" } as const;

/** Regions the hub exists in: the ones with a console catalogue and a place to send a buyer. */
export const GTA6_REGIONS: RegionId[] = ["au", "us", "uk"];

/** PlayStation 5 and Xbox Series X|S consoles only (never Switch, handhelds or accessories), most stores first, then cheapest. */
export function gta6Consoles(products: readonly PhoneSummary[], limit = 12): PhoneSummary[] {
  return products
    .filter((p) => p.category === "consoles" && p.inStock && /\b(playstation\s*5|ps5|xbox\s*series)\b/i.test(`${p.name} ${p.model}`) && !/\b(controller|headset|charging|dock|stand|cover|case|skin)\b/i.test(p.name))
    .sort((a, b) => b.retailerCount - a.retailerCount || a.bestPrice - b.bestPrice)
    .slice(0, limit);
}

/** The game runs at up to 4K on PS5 and Xbox Series X; a TV whose store listing states 4K and 120Hz or more, sold by 2+ stores,
 *  most stores first, then cheapest. Only the refresh rate the listing itself gives: a TV without one is left out, never guessed. */
export function gta6Tvs(products: readonly PhoneSummary[], limit = 6): PhoneSummary[] {
  return products
    .filter((p) => {
      if (p.category !== "tvs" || !p.inStock || p.retailerCount < 2) return false;
      const hz = parseInt(p.facets?.["Refresh rate"] ?? "", 10);
      return /\b4K\b/i.test(p.facets?.Resolution ?? "") && hz >= 120;
    })
    .sort((a, b) => b.retailerCount - a.retailerCount || a.bestPrice - b.bestPrice)
    .slice(0, limit);
}

/** Every console Rockstar names, with the maker's own built-in storage, so a buyer sees what each one is. `match` finds it in
 *  the day's catalogue (the cheapest in-stock listing wins); with none in stock, the row offers labelled Amazon and eBay
 *  searches instead. */
export interface Gta6ConsoleModel { key: string; name: string; storage: string; note: string; match: RegExp; not?: RegExp; query: string }
export const GTA6_CONSOLE_MODELS: Gta6ConsoleModel[] = [
  { key: "ps5", name: "PlayStation 5 (disc)", storage: "1TB", note: "Plays the boxed copy or a download", match: /\b(ps5|playstation\s*5)\b/i, not: /\b(pro|digital|controller|dualsense)\b/i, query: "PlayStation 5 console disc edition" },
  { key: "ps5-digital", name: "PlayStation 5 Digital Edition", storage: "1TB", note: "Downloads only, no disc drive", match: /\b(ps5|playstation\s*5)\b.*\bdigital\b/i, not: /\b(pro|controller|dualsense)\b/i, query: "PlayStation 5 Digital Edition console" },
  { key: "ps5-pro", name: "PlayStation 5 Pro", storage: "2TB", note: "Sony's most powerful console; not required for GTA 6", match: /\b(ps5|playstation\s*5)\s*pro\b/i, not: /\b(controller|dualsense)\b/i, query: "PlayStation 5 Pro console" },
  { key: "series-x", name: "Xbox Series X", storage: "1TB", note: "Microsoft's most powerful console", match: /\bxbox\s*series\s*x\b/i, not: /\b(digital|controller|storage|expansion)\b/i, query: "Xbox Series X console" },
  { key: "series-s", name: "Xbox Series S", storage: "512GB or 1TB", note: "The cheapest way in; downloads only", match: /\bxbox\s*series\s*s\b/i, not: /\b(controller|storage|expansion)\b/i, query: "Xbox Series S console" },
];

/** The cheapest in-stock catalogue listing of each model (or none). */
export function gta6ConsoleRows(products: readonly PhoneSummary[]): { model: Gta6ConsoleModel; product?: PhoneSummary }[] {
  const pool = products.filter((p) => p.category === "consoles" && p.inStock);
  return GTA6_CONSOLE_MODELS.map((model) => {
    const hits = pool.filter((p) => model.match.test(`${p.name} ${p.model}`) && !(model.not?.test(`${p.name} ${p.model}`)));
    hits.sort((a, b) => a.bestPrice - b.bestPrice || b.retailerCount - a.retailerCount);
    return { model, product: hits[0] };
  });
}

/** Monitors for a desk setup: the listing states 4K and 120Hz or more, 2+ stores, in stock. */
export function gta6Monitors(products: readonly PhoneSummary[], limit = 4): PhoneSummary[] {
  return products
    .filter((p) => p.category === "monitors" && p.inStock && p.retailerCount >= 2 && /\b4K\b/i.test(p.facets?.Resolution ?? "") && parseInt(p.facets?.["Refresh rate"] ?? "", 10) >= 120)
    .sort((a, b) => b.retailerCount - a.retailerCount || a.bestPrice - b.bestPrice)
    .slice(0, limit);
}

export interface Gta6Accessory { key: string; title: string; note: string; query: string }

/** What buyers add to a console: a search term for Amazon and for eBay's new listings. */
export const GTA6_ACCESSORIES: Gta6Accessory[] = [
  { key: "ps5-controller", title: "PS5 DualSense controller", note: "A second pad for the couch", query: "PS5 DualSense wireless controller" },
  { key: "gta6-dualsense", title: "GTA VI limited DualSense controller", note: "Sony's own GTA VI design, while it lasts", query: "GTA VI DualSense controller limited edition" },
  { key: "collectors", title: "GTA VI Collector's Edition", note: "Rockstar's boxed collection, from eBay sellers", query: "GTA VI collector's edition Vice City collection" },
  { key: "xbox-controller", title: "Xbox wireless controller", note: "Works with Xbox Series X|S", query: "Xbox wireless controller" },
  { key: "ps5-ssd", title: "PS5 internal SSD (M.2 NVMe)", note: "More room for a very large download", query: "PS5 M.2 NVMe SSD 2TB heatsink" },
  { key: "xbox-storage", title: "Xbox storage expansion card", note: "For Xbox Series X|S", query: "Xbox Series X|S storage expansion card" },
  { key: "headset", title: "Gaming headset", note: "For PS5 and Xbox", query: "wireless gaming headset PS5 Xbox" },
  { key: "ps-plus", title: "PlayStation Plus membership card", note: "Sony's paid online service, from the retailer", query: "PlayStation Plus membership card" },
  { key: "game-pass", title: "Xbox Game Pass card", note: "Microsoft's subscription, from the retailer", query: "Xbox Game Pass membership card" },
];

export const GTA6_FAQ = (place: string, region: "au" | "us" | "uk"): { q: string; a: string }[] => [
  { q: "When did GTA 6 come out?", a: "Grand Theft Auto VI came out on Thursday 19 November 2026, the date Rockstar Games set." },
  { q: `How much is GTA 6 in ${place}?`, a: `The Standard Edition lists at ${GTA6_EDITIONS[region].standard} and the Ultimate Edition at ${GTA6_EDITIONS[region].ultimate}. The game is the same price at every store, so this page compares the consoles and gear instead.` },
  { q: "Which consoles can play GTA 6?", a: `Rockstar's announcements name ${GTA6.platforms}: the PS5, PS5 Digital Edition, PS5 Pro, Xbox Series X and Xbox Series S.` },
  { q: "Is GTA 6 on PC?", a: "Not yet. Rockstar has not announced a PC version; some analysts expect one in 2027." },
  { q: "Is there a PS6, and should I wait for it?", a: "There is no PS6. Sony's chief executive has said its launch date is still undecided. GTA 6 runs on the PS5 you can buy today." },
  { q: "Do I need a PS5 Pro for GTA 6?", a: "No. Rockstar lists the PlayStation 5 family and Xbox Series X|S; the Pro is Sony's most powerful model, not a requirement." },
  { q: "Should I buy the Xbox Series S for GTA 6?", a: "It is the cheapest console Rockstar names, but it has no disc drive and the smallest storage (512GB or 1TB), so budget for a storage expansion card if you keep several big games." },
  { q: `Where can I compare PS5 and Xbox prices in ${place}?`, a: "On this page: each console Rockstar names, with the cheapest price we found at the region's stores today and a link to every store's price." },
];

/** The hub's link-preview URL (src/app/og/gta-6/route.tsx): every console row, priced ones cheapest first, in the query. */
export function gta6OgImage(region: "au" | "us" | "uk", rows: { model: Gta6ConsoleModel; product?: PhoneSummary }[]): string {
  const sorted = [...rows].sort((a, b) => (a.product ? a.product.bestPrice : Infinity) - (b.product ? b.product.bestPrice : Infinity));
  const q = new URLSearchParams();
  if (region !== "au") q.set("r", region);
  q.set("c", sorted.map((r) => `${r.model.name.replace(/[~|]/g, " ")}~${r.product ? r.product.bestPrice : ""}~${r.product ? r.product.retailerCount : 0}`).join("|"));
  q.set("e", `${GTA6_EDITIONS[region].standard}~${GTA6_EDITIONS[region].ultimate}`);
  return `/og/gta-6?${q}`;
}
