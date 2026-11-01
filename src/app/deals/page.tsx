import type { Metadata } from "next";
import { EbayStrip } from "@/components/EbayStrip";
import { DealsView } from "@/components/DealsView";
import { ogImage } from "@/lib/og";
import { hubLanguages } from "@/views/region-meta";

export const metadata: Metadata = {
  title: "Today's best tech deals in Australia — checked against real prices",
  description: "The biggest real savings today on phones, TVs, laptops, headphones, consoles and more — price drops, retailer sales and store gaps, with no fake 'was' prices.",
  alternates: { canonical: "/deals", languages: hubLanguages("/deals") },
  openGraph: { images: [{ url: ogImage({ title: "Today's real deals — no fake 'was' prices" }), width: 1200, height: 630 }] },
};

export default function DealsPage() {
  return (
    <>
      <DealsView />
      <div className="container-x pb-4">
        <EbayStrip query="electronics" label="tech" customid="deals-all" />
      </div>
    </>
  );
}
