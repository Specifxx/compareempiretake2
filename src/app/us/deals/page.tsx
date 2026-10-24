import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DealsView } from "@/components/DealsView";
import { EbayStrip } from "@/components/EbayStrip";
import { ogImage } from "@/lib/og";
import { regionLive } from "@/views/region-meta";

export const metadata: Metadata = {
  title: "Today's best tech deals in the US — checked against real prices",
  description: "The biggest real savings today across US stores: price drops, retailer sales and store gaps, with no fake 'was' prices.",
  alternates: { canonical: "/us/deals" },
  openGraph: { images: [{ url: ogImage({ title: "Today's real deals — no fake 'was' prices", region: "us" }), width: 1200, height: 630 }] },
};

export default function DealsPage() {
  if (!regionLive("us")) notFound();
  return (
    <>
      <DealsView region="us" />
      <div className="container-x pb-4">
        <EbayStrip query="electronics" label="tech" customid="us-deals-all" region="us" />
      </div>
    </>
  );
}
