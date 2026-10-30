import type { Metadata } from "next";
import { HomeView } from "@/views/HomeView";
import { homeLanguages } from "@/views/region-meta";

// The Australian home is the root. Without its own canonical it was the one
// indexable page with none (crawl-audit-sites, 2026-10-30), and the regional
// homes' hreflang pointed at it without it pointing back.
export const metadata: Metadata = { alternates: { canonical: "/", languages: homeLanguages() } };

export default function Home() {
  return <HomeView region="au" />;
}
