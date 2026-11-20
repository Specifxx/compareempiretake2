import type { Metadata } from "next";

import { getSummaries } from "@/lib/catalog";
import { Gta6View } from "@/views/Gta6View";
import { hubLanguages } from "@/views/region-meta";
import { GTA6_REGIONS, gta6ConsoleRows, gta6WorldOgImage } from "@/lib/gta6";

export function generateMetadata(): Metadata {
  return {
    title: "GTA 6 buying guide: PS5, Xbox, TVs and gear prices in Australia",
    description: "GTA 6 is out now on PS5 and Xbox Series X|S. Every console that plays it, 4K 120Hz TVs and monitors, controllers and storage, with real prices at Australian stores today. No PS6 yet.",
    alternates: { canonical: "/gta-6", languages: hubLanguages("/gta-6", (r) => GTA6_REGIONS.includes(r)) },
    // /gta-6 is the link a post or share carries for every country (visitors are moved to their own region's page), so its
    // preview names no single country (gta6WorldOgImage); /us/gta-6 and /uk/gta-6 keep their own region's table.
    openGraph: { images: [{ url: gta6WorldOgImage((["us", "uk", "au"] as const).map((region) => ({ region, rows: gta6ConsoleRows(getSummaries("consoles", region)) }))), width: 1200, height: 630 }] },
  };
}

export default function Gta6Page() {

  return <Gta6View region="au" />;
}
