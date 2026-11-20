import type { Metadata } from "next";

import { ogImage } from "@/lib/og";
import { Gta6View } from "@/views/Gta6View";
import { hubLanguages } from "@/views/region-meta";
import { GTA6_REGIONS } from "@/lib/gta6";

export const metadata: Metadata = {
  title: "GTA 6 buying guide: PS5, Xbox, TVs and gear prices in Australia",
  description: "GTA 6 is out now on PS5 and Xbox Series X|S. Every console that plays it, 4K 120Hz TVs and monitors, controllers and storage, with real prices at Australian stores today. No PS6 yet.",
  alternates: { canonical: "/gta-6", languages: hubLanguages("/gta-6", (r) => GTA6_REGIONS.includes(r)) },
  openGraph: { images: [{ url: ogImage({ title: "GTA 6 buying guide: consoles and TVs, real store prices" }), width: 1200, height: 630 }] },
};

export default function Gta6Page() {

  return <Gta6View region="au" />;
}
