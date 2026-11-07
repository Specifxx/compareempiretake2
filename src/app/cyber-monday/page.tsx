import type { Metadata } from "next";
import { seasonYear } from "@/lib/black-friday";
import { EbayStrip } from "@/components/EbayStrip";
import { DealsView } from "@/components/DealsView";
import { ogImage } from "@/lib/og";
import { hubLanguages } from "@/views/region-meta";

export const metadata: Metadata = {
  title: `Cyber Monday tech deals ${seasonYear(new Date().toISOString().slice(0, 10))} in Australia: real prices checked daily`,
  description: `Cyber Monday ${seasonYear(new Date().toISOString().slice(0, 10))} deals in Australia on phones, TVs, laptops, headphones, consoles and more: today's real price drops, sales and store gaps, with no fake 'was' prices.`,
  alternates: { canonical: "/cyber-monday", languages: hubLanguages("/cyber-monday") },
  openGraph: { images: [{ url: ogImage({ title: "Cyber Monday deals, checked against real prices" }), width: 1200, height: 630 }] },
};

// The Cyber Monday page (DECISIONS.md, "Cyber Monday page", 2026-11-07): the deals at one URL kept every year.
export default function CyberMondayPage() {
  return (
    <>
      <DealsView cyberMonday />
      <div className="container-x pb-4">
        <EbayStrip query="electronics" label="tech" customid="cyber-monday" />
      </div>
    </>
  );
}
