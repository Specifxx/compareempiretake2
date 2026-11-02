import type { Metadata } from "next";
import { seasonYear } from "@/lib/black-friday";
import { notFound } from "next/navigation";
import { DealsView } from "@/components/DealsView";
import { EbayStrip } from "@/components/EbayStrip";
import { ogImage } from "@/lib/og";
import { hubLanguages, regionLive } from "@/views/region-meta";

export const metadata: Metadata = {
  title: `Black Friday tech deals ${seasonYear(new Date().toISOString().slice(0, 10))} in the UK: real prices checked daily`,
  description: `Black Friday and Cyber Monday ${seasonYear(new Date().toISOString().slice(0, 10))} deals in the UK on phones, TVs, laptops, headphones, consoles and more: today's real price drops, sales and store gaps, with no fake 'was' prices.`,
  alternates: { canonical: "/uk/black-friday", languages: hubLanguages("/black-friday") },
  openGraph: { images: [{ url: ogImage({ title: "Black Friday deals, checked against real prices", region: "uk" }), width: 1200, height: 630 }] },
};

// The Black Friday page (DECISIONS.md, "Black Friday page", 2026-11-02): the deals at one URL kept every year.
export default function BlackFridayPage() {
  if (!regionLive("uk")) notFound();
  return (
    <>
      <DealsView region="uk" blackFriday />
      <div className="container-x pb-4">
        <EbayStrip query="electronics" label="tech" customid="uk-black-friday" region="uk" />
      </div>
    </>
  );
}
