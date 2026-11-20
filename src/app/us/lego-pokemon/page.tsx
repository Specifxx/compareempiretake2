import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSummaries } from "@/lib/catalog";
import { LegoPokemonView } from "@/views/LegoPokemonView";
import { hubLanguages, regionLive } from "@/views/region-meta";
import { LEGO_POKEMON_REGIONS, legoPokemonIndexable, legoPokemonSets } from "@/lib/lego-pokemon";

export function generateMetadata(): Metadata {
  const sets = legoPokemonSets(getSummaries("lego", "us"));
  return {
    title: "LEGO Pokémon prices in the US: every set compared",
    description: "Every LEGO Pokémon set matched by set number, with the cheapest price at US stores today. Pikachu, Poké Ball and more, refreshed every morning.",
    alternates: { canonical: "/us/lego-pokemon", languages: hubLanguages("/lego-pokemon", (r) => LEGO_POKEMON_REGIONS.includes(r)) },
    ...(legoPokemonIndexable(sets) ? {} : { robots: { index: false, follow: true } }),
  };
}

export default function LegoPokemonPage() {
  if (!regionLive("us")) notFound();
  return <LegoPokemonView region="us" />;
}
