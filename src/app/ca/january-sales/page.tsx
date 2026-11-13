import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { saleYear, SALE_SEASONS } from "@/lib/sale-seasons";
import { DealsView } from "@/components/DealsView";
import { InlineAds } from "@/components/InlineAds";
import { ogImage } from "@/lib/og";
import { hubLanguages, regionLive } from "@/views/region-meta";

const year = saleYear("january-sales", new Date().toISOString().slice(0, 10));

export const metadata: Metadata = {
  title: `January sales tech deals ${year} in Canada: real prices checked daily`,
  description: `January sales ${year} deals in Canada on phones, TVs, laptops, headphones, consoles and more: today's real price drops, sales and store gaps, with no fake 'was' prices.`,
  alternates: { canonical: "/ca/january-sales", languages: hubLanguages("/january-sales") },
  openGraph: { images: [{ url: ogImage({ title: `${SALE_SEASONS["january-sales"].linkLabel}, checked against real prices`, region: "ca" }), width: 1200, height: 630 }] },
};

// A seasonal sale page (DECISIONS.md, "Seasonal sale pages", 2026-11-02): the deals at one URL kept every year, like /black-friday.
export default function Page() {
  if (!regionLive("ca")) notFound();
  return (
    <>
      <DealsView region="ca" sale="january-sales" />
      <div className="container-x pb-4">
        <InlineAds />
      </div>
    </>
  );
}
