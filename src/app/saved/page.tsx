import type { Metadata } from "next";
import { SavedList } from "@/components/SavedList";
import { getSummaries } from "@/lib/catalog";

export const metadata: Metadata = { title: "Saved phones", robots: { index: false } };

export default function SavedPage() {
  return (
    <div className="container-x pt-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Saved phones</h1>
      <p className="mb-8 mt-2 text-ink-mute">Today&apos;s best prices for the phones you&apos;re watching.</p>
      <SavedList phones={getSummaries()} />
    </div>
  );
}
