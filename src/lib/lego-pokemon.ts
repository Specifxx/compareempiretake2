// The LEGO Pokémon hub (/lego-pokemon, 2026-11-20, hype run: Christmas toy demand and the Pokémon 30th anniversary). Every
// LEGO Pokémon set the LEGO import matched by its set number, priced at each region's stores today. Pure (the view passes
// the catalogue read), so tests/lego-pokemon.test.ts checks the selection. Facts only: the set number and the stores' own
// prices. No release date, RRP, piece count or stock claim we cannot see in a store's listing.
import type { PhoneSummary } from "@/lib/catalog";
import type { RegionId } from "@/lib/region";

/** Regions the hub exists in: the ones with a LEGO catalogue and Amazon/eBay to send a buyer to. */
export const LEGO_POKEMON_REGIONS: RegionId[] = ["au", "us", "uk"];

/** A store listing names the theme: "Pokémon", "Pokemon", "POKEMON", or Pikachu. Never "poke" alone (poke bowls, Poké Ball
 *  keyrings from other brands are not LEGO sets, but the category is LEGO already, so the theme word is enough). */
const THEME = /\b(pok[eé]mon|pikachu)\b/i;

/** The five-digit LEGO set number in a name or model ("… Poke Ball 72154"). */
export function setNumber(p: Pick<PhoneSummary, "name" | "model">): string | null {
  return (`${p.model} ${p.name}`.match(/\b(\d{5})\b/) ?? [])[1] ?? null;
}

/** LEGO Pokémon sets in the catalogue, most stores first, then cheapest; in stock first. */
export function legoPokemonSets(products: readonly PhoneSummary[]): PhoneSummary[] {
  return products
    .filter((p) => p.category === "lego" && THEME.test(`${p.name} ${p.model}`) && setNumber(p) != null)
    .sort((a, b) => Number(b.inStock) - Number(a.inStock) || b.retailerCount - a.retailerCount || a.bestPrice - b.bestPrice);
}

/** The hub is worth indexing in a region only when at least one set is a real comparison there (three stores or more, the
 *  site's own indexing bar, DECISIONS.md 2026-11-19). Below that the page still serves visitors, noindexed. */
export const legoPokemonIndexable = (sets: readonly PhoneSummary[]) => sets.some((p) => p.inStock && p.retailerCount >= 3);

/** Clean display name: "LEGO Pokémon Pikachu and Poké Ball (72152)". Store names arrive in caps or without accents. */
/** A LEGO set of any theme, the store's own words: "LEGO Duplo Ice Cream Trip with Bluey (10458)". Never adds a theme
 *  word, so a Bluey or KPop set is not called Pokémon (hot-toys page, 2026-11-21). */
export function legoName(p: Pick<PhoneSummary, "name" | "model">): string {
  const n = setNumber(p);
  let s = p.name.replace(/^LEGO\s*(®|\(R\))?\s+/i, "").replace(/\(?\b\d{5}\b\)?/, "").replace(/\s{2,}/g, " ").trim();
  if (s === s.toUpperCase()) s = s.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase()).replace(/\b(And|Of|The|With)\b/g, (m) => m.toLowerCase());
  return `LEGO ${s}${n ? ` (${n})` : ""}`.replace(/\s{2,}/g, " ");
}

/** The right name for a set on a page that mixes themes: Pokémon sets keep the hub's clean name, every other theme its own. */
export const anyLegoName = (p: Pick<PhoneSummary, "name" | "model">): string =>
  /\b(pok[eé]mon|pikachu)\b/i.test(`${p.name} ${p.model}`) ? displayName(p) : legoName(p);

export function displayName(p: Pick<PhoneSummary, "name" | "model">): string {
  const n = setNumber(p);
  let s = p.name.replace(/^LEGO\s+/i, "").replace(/\b\d{5}\b/, "").replace(/\s{2,}/g, " ").trim();
  if (s === s.toUpperCase()) s = s.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase()).replace(/\b(And|Of|The)\b/g, (m) => m.toLowerCase());
  s = s.replace(/\bpokemon\b/gi, "Pokémon").replace(/\bpoke\s*ball\b/gi, "Poké Ball").replace(/^Pokémon:?\s*/i, "");
  return `LEGO Pokémon ${s}${n ? ` (${n})` : ""}`.replace(/\s{2,}/g, " ");
}

export interface Faq { q: string; a: string }

/** Questions answered from the day's data only. */
export function legoPokemonFaq(place: string, sets: readonly PhoneSummary[], money: (n: number) => string): Faq[] {
  const open = sets.filter((p) => p.inStock);
  const cheapest = [...open].sort((a, b) => a.bestPrice - b.bestPrice)[0];
  const widest = open[0];
  return [
    {
      q: `Which LEGO Pokémon set is cheapest in ${place} today?`,
      a: cheapest
        ? `${displayName(cheapest)}, from ${money(cheapest.bestPrice)} at the cheapest of ${cheapest.retailerCount} ${cheapest.retailerCount === 1 ? "store" : "stores"} we compare.`
        : `None of the stores we compare in ${place} has a LEGO Pokémon set in stock right now.`,
    },
    {
      q: `How many LEGO Pokémon sets can I compare in ${place}?`,
      a: `${sets.length} ${sets.length === 1 ? "set" : "sets"} today, ${open.length} of them in stock somewhere${widest ? `; ${displayName(widest)} is at the most stores (${widest.retailerCount})` : ""}.`,
    },
    {
      q: "How do you know two stores sell the same set?",
      a: "Every LEGO set is matched by its five-digit set number, so a store's own title never decides it. A listing without the set number is left out.",
    },
    {
      q: "Do you sell LEGO?",
      a: "No. We compare the prices stores show on their own sites and link you to the store. Some links, like Amazon and eBay, are paid and labelled.",
    },
  ];
}
