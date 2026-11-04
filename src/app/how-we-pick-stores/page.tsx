import type { Metadata } from "next";
import { activeRetailers } from "@/lib/catalog";
import { REGION_IDS } from "@/lib/region";
import { HowWePickStores } from "@/components/HowWePickStores";

// The store-vetting page every Compare Empire site shares (owner, 2026-11-02).
export const metadata: Metadata = {
  title: "How we pick stores",
  description: "How Compare Empire checks every store before listing it, keeps checking it, and how to report one.",
  alternates: { canonical: "/how-we-pick-stores" },
};

export default function HowWePickPage() {
  // Stores with a price on the site today (a registered store whose feed has not started yet is not listed).
  const stores = [...new Set(REGION_IDS.flatMap((region) => activeRetailers(undefined, region)).filter((r) => r.type !== "carrier").map((r) => r.name))];
  return (
    <div className="container-x max-w-3xl pt-12 pb-16">
      <HowWePickStores
        site="Compare Empire"
        what="products"
        stores={stores}
        priceRule="With three or more stores selling the same product, a price under 55% of their median is dropped automatically, and used, refurbished and store-bundle listings are left out."
        marketplaces="eBay and Amazon rows are marketplaces, not stores: they are labelled and never counted as a store. We don't vet the individual sellers there, so check a seller's feedback before you buy."
        buttonClassName="btn-primary"
        suggestHref="/contact#suggest"
      />
    </div>
  );
}
