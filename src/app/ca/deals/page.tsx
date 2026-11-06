import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DealsView } from "@/components/DealsView";
import { EbayStrip } from "@/components/EbayStrip";
import { ogImage } from "@/lib/og";
import { hubLanguages, regionLive } from "@/views/region-meta";

export const metadata: Metadata = {
  title: "Today's best tech deals in Canada — checked against real prices",
  description: "The biggest real savings today across Canadian stores: price drops, retailer sales and store gaps, with no fake 'was' prices.",
  alternates: { canonical: "/ca/deals", languages: hubLanguages("/deals") },
  openGraph: { images: [{ url: ogImage({ title: "Today's real deals — no fake 'was' prices", region: "ca" }), width: 1200, height: 630 }] },
};

export default function DealsPage() {
  if (!regionLive("ca")) notFound();
  return (
    <>
      <DealsView region="ca" />
      <div className="container-x pb-4">
        <EbayStrip query="electronics" label="tech" customid="ca-deals-all" region="ca" />
      </div>
    </>
  );
}
