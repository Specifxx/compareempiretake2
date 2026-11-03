import type { Metadata } from "next";
import { ogImage } from "@/lib/og";
import { LaunchesView } from "@/views/LaunchesView";
import { hubLanguages } from "@/views/region-meta";

export const metadata: Metadata = {
  title: "New phone launches: iPhone Duo, Galaxy Z Fold8 and more, prices in Australia",
  description: "Release dates for the year's big phone launches, from Apple's and Samsung's own announcements, and what stores in Australia charge for them today.",
  alternates: { canonical: "/launches", languages: hubLanguages("/launches") },
  openGraph: { images: [{ url: ogImage({ title: "New phone launches, with real store prices" }), width: 1200, height: 630 }] },
};

export default function LaunchesPage() {
  return <LaunchesView region="au" />;
}
