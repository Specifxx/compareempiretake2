import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSummaries } from "@/lib/catalog";
import { HotToysView } from "@/views/HotToysView";
import { hubLanguages, regionLive } from "@/views/region-meta";
import { HOT_TOYS_REGIONS, hotToysIndexable } from "@/lib/hot-toys";

export function generateMetadata(): Metadata {
  return {
    title: "Hot toys for Christmas 2026 in the US: prices compared",
    description: "The 2026 hot-toy lists (KPop Demon Hunters, Bluey, Pokémon, Elmo) and the LEGO sets from the same crazes, with the cheapest price at US stores today.",
    alternates: { canonical: "/us/hot-toys", languages: hubLanguages("/hot-toys", (r) => HOT_TOYS_REGIONS.includes(r)) },
    ...(hotToysIndexable(getSummaries("lego", "us")) ? {} : { robots: { index: false, follow: true } }),
  };
}

export default function HotToysPage() {
  if (!regionLive("us")) notFound();
  return <HotToysView region="us" />;
}
