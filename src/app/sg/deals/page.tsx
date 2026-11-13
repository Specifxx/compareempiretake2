import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DealsView } from "@/components/DealsView";
import { InlineAds } from "@/components/InlineAds";
import { ogImage } from "@/lib/og";
import { hubLanguages, regionLive } from "@/views/region-meta";

export const metadata: Metadata = {
  title: "Today's best tech deals in Singapore — checked against real prices",
  description: "The biggest real savings today across Singapore stores: price drops, retailer sales and store gaps, with no fake 'was' prices.",
  alternates: { canonical: "/sg/deals", languages: hubLanguages("/deals") },
  openGraph: { images: [{ url: ogImage({ title: "Today's real deals — no fake 'was' prices", region: "sg" }), width: 1200, height: 630 }] },
};

export default function DealsPage() {
  if (!regionLive("sg")) notFound();
  return (
    <>
      <DealsView region="sg" />
      <div className="container-x pb-4">
        <InlineAds />
      </div>
    </>
  );
}
