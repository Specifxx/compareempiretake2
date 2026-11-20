import type { Metadata } from "next";
import { getSummaries } from "@/lib/catalog";
import { LegoPokemonView } from "@/views/LegoPokemonView";
import { hubLanguages } from "@/views/region-meta";
import { LEGO_POKEMON_REGIONS, legoPokemonIndexable, legoPokemonSets } from "@/lib/lego-pokemon";

export function generateMetadata(): Metadata {
  const sets = legoPokemonSets(getSummaries("lego", "au"));
  return {
    title: "LEGO Pokémon prices in Australia: every set compared",
    description: "Every LEGO Pokémon set matched by set number, with the cheapest price at Australian stores today. Pikachu, Poké Ball and more, refreshed every morning.",
    alternates: { canonical: "/lego-pokemon", languages: hubLanguages("/lego-pokemon", (r) => LEGO_POKEMON_REGIONS.includes(r)) },
    ...(legoPokemonIndexable(sets) ? {} : { robots: { index: false, follow: true } }),
  };
}

export default function LegoPokemonPage() {
  return <LegoPokemonView region="au" />;
}
