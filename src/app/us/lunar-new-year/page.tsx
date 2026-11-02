import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { saleYear, SALE_SEASONS } from "@/lib/sale-seasons";
import { DealsView } from "@/components/DealsView";
import { EbayStrip } from "@/components/EbayStrip";
import { ogImage } from "@/lib/og";
import { hubLanguages, regionLive } from "@/views/region-meta";

const year = saleYear("lunar-new-year", new Date().toISOString().slice(0, 10));

export const metadata: Metadata = {
  title: `Lunar New Year tech deals ${year} in the US: real prices checked daily`,
  description: `Lunar New Year ${year} deals in the US on phones, TVs, laptops, headphones, consoles and more: today's real price drops, sales and store gaps, with no fake 'was' prices.`,
  alternates: { canonical: "/us/lunar-new-year", languages: hubLanguages("/lunar-new-year") },
  openGraph: { images: [{ url: ogImage({ title: `${SALE_SEASONS["lunar-new-year"].linkLabel}, checked against real prices`, region: "us" }), width: 1200, height: 630 }] },
};

// A seasonal sale page (DECISIONS.md, "Seasonal sale pages", 2026-11-02): the deals at one URL kept every year, like /black-friday.
export default function Page() {
  if (!regionLive("us")) notFound();
  return (
    <>
      <DealsView region="us" sale="lunar-new-year" />
      <div className="container-x pb-4">
        <EbayStrip query="electronics" label="tech" customid="us-lunar-new-year" region="us" />
      </div>
    </>
  );
}
