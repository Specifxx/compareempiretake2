import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareView } from "@/components/CompareView";
import { getPhones } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Compare phones side by side",
  description: "Put up to four phones side by side: prices at every Australian retailer, storage, screen, camera and battery.",
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  return (
    <div className="container-x pt-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Compare phones</h1>
      <p className="mt-2 mb-8 text-ink-mute">Side by side: price at every store, and the specs that matter.</p>
      <Suspense>
        <CompareView phones={getPhones()} />
      </Suspense>
    </div>
  );
}
