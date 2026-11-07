import type { Metadata } from "next";
import { seasonYear } from "@/lib/black-friday";
import { notFound } from "next/navigation";
import { DealsView } from "@/components/DealsView";
import { EbayStrip } from "@/components/EbayStrip";
import { ogImage } from "@/lib/og";
import { hubLanguages, regionLive } from "@/views/region-meta";

export const metadata: Metadata = {
  title: `Cyber Monday tech deals ${seasonYear(new Date().toISOString().slice(0, 10))} in Singapore: real prices checked daily`,
  description: `Cyber Monday ${seasonYear(new Date().toISOString().slice(0, 10))} deals in Singapore on phones, TVs, laptops, headphones, consoles and more: today's real price drops, sales and store gaps, with no fake 'was' prices.`,
  alternates: { canonical: "/sg/cyber-monday", languages: hubLanguages("/cyber-monday") },
  openGraph: { images: [{ url: ogImage({ title: "Cyber Monday deals, checked against real prices", region: "sg" }), width: 1200, height: 630 }] },
};

// The Cyber Monday page (DECISIONS.md, "Cyber Monday page", 2026-11-07): the deals at one URL kept every year.
export default function CyberMondayPage() {
  if (!regionLive("sg")) notFound();
  return (
    <>
      <DealsView region="sg" cyberMonday />
      <div className="container-x pb-4">
        <EbayStrip query="electronics" label="tech" customid="sg-cyber-monday" region="sg" />
      </div>
    </>
  );
}
