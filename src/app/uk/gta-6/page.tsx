import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ogImage } from "@/lib/og";
import { Gta6View } from "@/views/Gta6View";
import { hubLanguages, regionLive } from "@/views/region-meta";
import { GTA6_REGIONS } from "@/lib/gta6";

export const metadata: Metadata = {
  title: "GTA 6 buying guide: PS5, Xbox, TVs and gear prices in the UK",
  description: "GTA 6 is out now on PS5 and Xbox Series X|S. Every console that plays it, 4K 120Hz TVs and monitors, controllers and storage, with real prices at UK stores today. No PS6 yet.",
  alternates: { canonical: "/uk/gta-6", languages: hubLanguages("/gta-6", (r) => GTA6_REGIONS.includes(r)) },
  openGraph: { images: [{ url: ogImage({ title: "GTA 6 buying guide: consoles and TVs, real store prices", region: "uk" }), width: 1200, height: 630 }] },
};

export default function Gta6Page() {
  if (!regionLive("uk")) notFound();
  return <Gta6View region="uk" />;
}
