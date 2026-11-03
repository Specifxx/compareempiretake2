import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ogImage } from "@/lib/og";
import { LaunchesView } from "@/views/LaunchesView";
import { hubLanguages, regionLive } from "@/views/region-meta";

export const metadata: Metadata = {
  title: "New phone launches: iPhone Duo, Galaxy Z Fold8 and more, prices in the US",
  description: "Release dates for the year's big phone launches, from Apple's and Samsung's own announcements, and what stores in the US charge for them today.",
  alternates: { canonical: "/us/launches", languages: hubLanguages("/launches") },
  openGraph: { images: [{ url: ogImage({ title: "New phone launches, with real store prices", region: "us" }), width: 1200, height: 630 }] },
};

export default function LaunchesPage() {
  if (!regionLive("us")) notFound();
  return <LaunchesView region="us" />;
}
