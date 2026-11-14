import type { Metadata } from "next";
import { CONTACT_EMAIL, SITE } from "@/lib/site";
import { activeRetailers } from "@/lib/catalog";
import { REGION_IDS, REGIONS } from "@/lib/region";
import { ListYourStore } from "@/components/ListYourStore";
import { storeBadge } from "@/lib/store-badge";

// The store-owner page every Compare Empire site shares (owner, 2026-11-04).
export const metadata: Metadata = {
  title: "List your store on Compare Empire, free",
  description: "Run an online store? Get it listed on Compare Empire's price comparison for free: shoppers comparing prices go straight to your product pages.",
  alternates: { canonical: "/list-your-store" },
};

export default function ListYourStorePage() {
  const stores = new Set(REGION_IDS.flatMap((region) => activeRetailers(undefined, region)).filter((r) => r.type !== "carrier").map((r) => r.name));
  const names = REGION_IDS.map((r) => REGIONS[r].name);
  const markets = `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return (
    <div className="container-x max-w-3xl pt-6 sm:pt-10 pb-16">
      <ListYourStore
        badge={storeBadge(`${SITE}/stores`, "Prices compared on Compare Empire")}
        site="Compare Empire"
        what="electronics, appliances and everyday products"
        markets={markets}
        storeCount={stores.size}
        regions={REGION_IDS.map((r) => [r.toUpperCase(), REGIONS[r].name])}
        email={CONTACT_EMAIL}
        platforms="Shopify, WooCommerce and BigCommerce stores, and affiliate-network product feeds"
        pricesRule="with three or more stores selling the same product, a price under 55% of their median is dropped as a likely mistake"
        suggestHref="/contact#suggest"
        buttonClassName="btn-primary"
      >
        <li><strong>Brand and model in your titles.</strong> We match a listing to one exact model, so a title that names the brand, model and variant is matched; a vague one is left out.</li>
      </ListYourStore>
    </div>
  );
}
