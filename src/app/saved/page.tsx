import type { Metadata } from "next";
import { SavedList } from "@/components/SavedList";

export const metadata: Metadata = { title: "Saved", robots: { index: false } };

export default function SavedPage() {
  return (
    <div className="container-x pt-6 sm:pt-10">
      <h1 className="page-title">Saved</h1>
      <p className="mb-8 mt-2 text-ink-mute">Today&apos;s best prices for everything you&apos;re watching.</p>
      {/* No catalogue in the page: SavedList fetches the saved products from /api/products. */}
      <SavedList />
    </div>
  );
}
