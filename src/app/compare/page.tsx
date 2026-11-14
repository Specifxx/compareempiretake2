import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareView } from "@/components/CompareView";

export const metadata: Metadata = {
  title: "Compare products side by side",
  description: "Put up to four phones, TVs, laptops, monitors or graphics cards side by side: prices at every Australian retailer and the specs that matter.",
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  return (
    <div className="container-x pt-6 sm:pt-10">
      <h1 className="page-title">Compare</h1>
      <p className="page-lede mb-8">Side by side: price at every store, and the specs that matter.</p>
      {/* The empty picker's height is held while it loads (2026-11-14): the footer no longer jumps up the page (CLS 0.15). */}
      <Suspense fallback={<div aria-hidden className="min-h-[370px] sm:min-h-[330px]" />}>
        {/* No catalogue in the page: CompareView fetches the chosen products and searches the search index. */}
        <CompareView />
      </Suspense>
    </div>
  );
}
