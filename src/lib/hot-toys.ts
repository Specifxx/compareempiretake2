// The hot toys page (/hot-toys, weekly hype run 2026-11-20). Two parts:
//  1. LEGO sets from this Christmas's hyped themes (Pokémon, KPop Demon Hunters, Bluey) that the LEGO import matched by set
//     number at two or more stores, from the day's catalogue: a real comparison.
//  2. The toys on the 2026 hot-toy lists that our stores carry at one shop or none (probed 20 Nov 2026): no comparison, so
//     only labelled Amazon and eBay searches, and the list that named each, dated. No price, stock or rank claim of our own.
// Pure (the view passes the catalogue read), so tests/hot-toys.test.ts checks the selection.
import type { PhoneSummary } from "@/lib/catalog";
import type { RegionId } from "@/lib/region";

export const HOT_TOYS_REGIONS: RegionId[] = ["au", "us", "uk"];

export interface HotTheme { key: string; name: string; match: RegExp }
/** Same themes as focus.ts LEGO_HYPE_THEMES, each its own section. */
export const HOT_LEGO_THEMES: HotTheme[] = [
  { key: "kpop", name: "LEGO KPop Demon Hunters", match: /\bk-?\s?pop demon hunters\b|\b72537\b/i },
  { key: "pokemon", name: "LEGO Pokémon", match: /\b(pok[eé]mon|pikachu)\b/i },
  { key: "bluey", name: "LEGO Bluey", match: /\bbluey\b/i },
];

/** In-stock LEGO sets of a theme at two or more stores, most stores first, then cheapest. */
export function hotLego(products: readonly PhoneSummary[], theme: HotTheme, limit = 8): PhoneSummary[] {
  return products
    .filter((p) => p.category === "lego" && p.inStock && p.retailerCount >= 2 && theme.match.test(`${p.name} ${p.model}`))
    .sort((a, b) => b.retailerCount - a.retailerCount || a.bestPrice - b.bestPrice)
    .slice(0, limit);
}

/** Indexed only while one set is in stock at three stores or more (the 2026-11-19 bar). */
export const hotToysIndexable = (products: readonly PhoneSummary[]) => HOT_LEGO_THEMES.some((t) => hotLego(products, t).some((p) => p.retailerCount >= 3));

export interface ListSource { label: string; url: string; date: string }
export const SOURCES = {
  toyInsider: { label: "The Toy Insider's Hot 20, via TODAY", url: "https://www.today.com/shop/the-toy-insider-hottest-toys-2026-rcna596659", date: "5 Nov 2026" },
  consumerAffairs: { label: "ConsumerAffairs", url: "https://www.consumeraffairs.com/news/the-hottest-christmas-toys-of-2026-7-toys-showing-early-signs-of-taking-off-110926.html", date: "9 Nov 2026" },
  dreamToys: { label: "DreamToys 2026, via MadeForMums", url: "https://www.madeformums.com/news/product-news/dreamtoys-2026-top-toy-list-revealed/", date: "11 Nov 2026" },
} satisfies Record<string, ListSource>;

export interface ListToy { key: string; name: string; query: string; lists: (keyof typeof SOURCES)[] }
/** Toys named on two or more of the lists above (KPop Demon Hunters dolls on all three). */
export const LIST_TOYS: ListToy[] = [
  { key: "huntrx-dolls", name: "KPop Demon Hunters HUNTR/X singing dolls (Mattel)", query: "KPop Demon Hunters singing doll", lists: ["toyInsider", "consumerAffairs", "dreamToys"] },
  { key: "elmo-giggle-max", name: "Tickle Me Elmo Giggle Max", query: "Tickle Me Elmo Giggle Max", lists: ["toyInsider", "consumerAffairs"] },
  { key: "furreal-gabby", name: "furReal Gabby the Grow & Roar Tiger", query: "furReal Gabby Grow and Roar Tiger", lists: ["toyInsider", "dreamToys"] },
  { key: "bluey-heeler-house", name: "Bluey's Light & Surprise Heeler House", query: "Bluey Light and Surprise Heeler House", lists: ["toyInsider", "consumerAffairs"] },
  { key: "paw-megasaurus", name: "PAW Patrol: The Dino Movie Megasaurus Dino Vehicle", query: "PAW Patrol Megasaurus Dino Vehicle", lists: ["toyInsider", "dreamToys"] },
  { key: "gui-gui-slime", name: "Gui Gui Mega Slime Haul", query: "Gui Gui Mega Slime Haul", lists: ["toyInsider", "dreamToys"] },
];

export interface Faq { q: string; a: string }
export function hotToysFaq(place: string, top: PhoneSummary | undefined, money: (n: number) => string): Faq[] {
  return [
    {
      q: "What are the hottest toys for Christmas 2026?",
      a: "On the big 2026 lists (The Toy Insider, ConsumerAffairs and the UK's DreamToys), the KPop Demon Hunters HUNTR/X singing dolls appear on all three; Tickle Me Elmo Giggle Max, the furReal Gabby tiger, Bluey's Heeler House, the PAW Patrol Megasaurus and the Gui Gui Mega Slime Haul on two each.",
    },
    {
      q: `Which hot toy can I compare across the most stores in ${place}?`,
      a: top ? `${top.name}: ${top.retailerCount} stores today, from ${money(top.bestPrice)}.` : `None of the hyped LEGO sets is in stock at two stores we compare in ${place} today.`,
    },
    {
      q: "Why are the dolls and plush toys not compared here?",
      a: "We checked the toy shops we read: each of those toys was at one shop or none per country, so there is nothing to compare yet. They link to Amazon and eBay searches instead, labelled as paid links.",
    },
  ];
}
