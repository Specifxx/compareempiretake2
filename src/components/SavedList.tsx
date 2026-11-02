"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { PhoneSummary } from "@/lib/catalog";
import { normaliseHref, parseHref } from "@/lib/product-refs";
import { saved } from "@/lib/store";
import { useProducts } from "@/lib/use-products";
import { PhoneCard } from "./PhoneCard";
import { ShareButton } from "./ShareButton";
import { decodeSavedList, encodeSavedList, SHARED_PARAM } from "@/lib/share-link";

const noop = () => () => {};

/**
 * Everything saved in this browser, as product cards fetched from /api/products (the page carries no catalogue).
 * A shared list (/saved?l=/phones/a,/us/tvs/b: word of mouth, owner 2026-11-02) shows the link's products instead,
 * read-only, with "Keep this list" to add them to the visitor's own. Nothing is stored anywhere but the link.
 */
export function SavedList() {
  const list = saved.use();
  // The saved list lives in localStorage, so the server (and the first paint) can't tell an empty list from a full one.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [shared, setShared] = useState<string[] | null>(null);
  useEffect(() => {
    const onNav = () => setShared(decodeSavedList(location.search));
    onNav();
    window.addEventListener("popstate", onNav);
    return () => window.removeEventListener("popstate", onNav);
  }, []);
  // Early saves were bare phone slugs; newer ones are full product paths, region prefix included.
  const own = useMemo(() => [...new Set(list.map(normaliseHref))].filter((h) => parseHref(h)), [list]);
  const hrefs = shared ?? own;
  const { get, pending, failed, failedCount, retry } = useProducts(hrefs, "summary");
  const mine = hrefs.map(get).filter(Boolean) as PhoneSummary[];
  const [kept, setKept] = useState(false);
  const keep = () => {
    for (const h of shared ?? []) if (!own.includes(h)) saved.toggle(h);
    setKept(true);
  };
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
        <div className="font-display text-xl font-bold">{shared ? "This shared list is empty" : "Nothing saved yet"}</div>
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
      {shared ? (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-bg-card p-4 text-sm">
          <span className="text-ink-mute">Someone shared this list with you. Today&apos;s prices, each at its cheapest store.</span>
          <button type="button" className="btn-primary" onClick={keep}>{kept ? "Added to your saved list" : "Keep this list"}</button>
          <Link href="/saved" className="font-semibold text-brand hover:underline" onClick={() => setShared(null)}>Your own list</Link>
        </div>
      ) : (
        <div className="mb-5">
          <ShareButton
            title="My saved list"
            path={`/saved?${SHARED_PARAM}=${encodeSavedList(mine.map((p) => p.href))}`}
            text={`${mine.length} ${mine.length === 1 ? "product" : "products"} I'm watching, each at its cheapest store today:`}
            medium="list"
            label="Share this list"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {mine.map((p) => (
          <div key={p.href} className="flex flex-col">
            <PhoneCard p={p} showCategory />
            {p.bestStore && <div className="mt-1.5 px-1 text-xs text-ink-mute">Cheapest at {p.bestStore}</div>}
          </div>
        ))}
      </div>
    </>
  );
}
