"use client";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import type { PhoneSummary } from "@/lib/catalog";
import { normaliseHref, parseHref } from "@/lib/product-refs";
import { saved } from "@/lib/store";
import { useProducts } from "@/lib/use-products";
import { PhoneCard } from "./PhoneCard";

const noop = () => () => {};

/** Everything saved in this browser, as product cards fetched from /api/products (the page carries no catalogue). */
export function SavedList() {
  const list = saved.use();
  // The saved list lives in localStorage, so the server (and the first paint) can't tell an empty list from a full one.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  // Early saves were bare phone slugs; newer ones are full product paths, region prefix included.
  const hrefs = useMemo(() => [...new Set(list.map(normaliseHref))].filter((h) => parseHref(h)), [list]);
  const { get, pending, failed, failedCount, retry } = useProducts(hrefs, "summary");
  const mine = hrefs.map(get).filter(Boolean) as PhoneSummary[];
  if (!mounted || (pending && !mine.length))
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4" role="status" aria-busy aria-label="Loading saved products">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="img-tile aspect-square animate-pulse" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-1/3 animate-pulse rounded bg-bg-sunk" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-bg-sunk" />
              <div className="h-6 w-2/5 animate-pulse rounded bg-bg-sunk" />
            </div>
          </div>
        ))}
      </div>
    );
  if (failed && !mine.length)
    return (
      <div className="card px-6 py-16 text-center">
        <div className="font-display text-xl font-bold">Couldn&apos;t load your saved products</div>
        <p className="mt-2 text-sm text-ink-mute">They&apos;re still saved in this browser. Check your connection and try again.</p>
        <button className="btn-primary mt-6" onClick={retry}>Try again</button>
      </div>
    );
  if (!mine.length)
    return (
      <div className="card px-6 py-16 text-center">
        <div className="font-display text-xl font-bold">Nothing saved yet</div>
        <p className="mt-2 text-sm text-ink-mute">Tap the heart on anything to keep an eye on its price. Saved phones live in this browser — no account needed.</p>
        <Link href="/phones" className="btn-primary mt-6">Browse phones</Link>
      </div>
    );
  return (
    <>
      {/* A list over 50 goes out as several requests: say so when one is still out, or failed. */}
      {(pending || failed) && (
        <div className="mb-4 text-sm text-ink-mute" role="status">
          {pending ? (
            "Loading the rest of your saved products…"
          ) : (
            <>
              Couldn&apos;t load {failedCount} saved {failedCount === 1 ? "product" : "products"}.{" "}
              <button className="font-semibold text-brand hover:underline" onClick={retry}>Try again</button>
            </>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">{mine.map((p) => <PhoneCard key={p.href} p={p} showCategory />)}</div>
    </>
  );
}
