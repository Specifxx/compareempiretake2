import type { Metadata } from "next";
import { Suspense } from "react";
import { PhoneBrowser } from "@/components/PhoneBrowser";
import { getCatalog, getSummaries } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "All mobile phones — compare prices in Australia",
  description: "Browse and filter every new phone sold by JB Hi-Fi, Harvey Norman, The Good Guys and Mobileciti. Sort by price, saving or brand.",
  alternates: { canonical: "/phones" },
};

export default function PhonesPage() {
  const { retailers } = getCatalog();
  const phones = getSummaries();
  return (
    <div className="container-x pt-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">All phones</h1>
      <p className="mt-2 text-ink-mute">{phones.length} new, unlocked phones across {retailers.length} Australian retailers.</p>
      <div className="mt-8">
        <Suspense>
          <PhoneBrowser phones={phones} />
        </Suspense>
      </div>
    </div>
  );
}
