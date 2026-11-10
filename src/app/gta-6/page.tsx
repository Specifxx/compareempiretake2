import type { Metadata } from "next";

import { ogImage } from "@/lib/og";
import { Gta6View } from "@/views/Gta6View";
import { hubLanguages } from "@/views/region-meta";
import { GTA6_REGIONS } from "@/lib/gta6";

export const metadata: Metadata = {
  title: "GTA 6 consoles: PS5 and Xbox prices in Australia",
  description: "Grand Theft Auto VI launches 19 November 2026 on PS5 and Xbox Series X|S. What Australian stores charge for each console today, plus controllers and storage.",
  alternates: { canonical: "/gta-6", languages: hubLanguages("/gta-6", (r) => GTA6_REGIONS.includes(r)) },
  openGraph: { images: [{ url: ogImage({ title: "GTA 6 consoles, with real store prices" }), width: 1200, height: 630 }] },
};

export default function Gta6Page() {

  return <Gta6View region="au" />;
}
