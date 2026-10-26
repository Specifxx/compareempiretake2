"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { PhoneSummary } from "./catalog";
import { productsUrls, type ProductView } from "./product-refs";
import { withRegion } from "./region";
import type { Phone } from "./types";

type Item<V extends ProductView> = V extends "summary" ? PhoneSummary : Phone;

/**
 * Products by path from /api/products, kept for the visit: null once the endpoint says it has no
 * such product. Every hook re-renders when any request finishes, so two components asking for the
 * same product share one request.
 */
const cache: Record<ProductView, Map<string, Phone | PhoneSummary | null>> = { full: new Map(), summary: new Map() };
const inflight: Record<ProductView, Set<string>> = { full: new Set(), summary: new Set() };
const failed: Record<ProductView, Set<string>> = { full: new Set(), summary: new Set() };
let version = 0;
const listeners = new Set<() => void>();
const bump = () => {
  version++;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const hrefOf = (p: Phone | PhoneSummary) => ("href" in p ? p.href : withRegion(`/${p.category}/${p.slug}`, p.region ?? "au"));

function request(hrefs: string[], view: ProductView) {
  const requests = productsUrls(hrefs, view);
  // A path the endpoint would refuse is no product: settle it now rather than leave it loading.
  const asked = new Set(requests.flatMap((r) => r.hrefs));
  const refused = hrefs.filter((h) => !asked.has(h));
  refused.forEach((h) => cache[view].set(h, null));
  if (refused.length) bump();
  for (const { url, hrefs: chunk } of requests) {
    chunk.forEach((h) => inflight[view].add(h));
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`/api/products: ${r.status}`);
        return r.json() as Promise<{ products: (Phone | PhoneSummary)[] }>;
      })
      .then(({ products }) => {
        const byHref = new Map(products.map((p) => [hrefOf(p), p]));
        for (const h of chunk) cache[view].set(h, byHref.get(h) ?? null);
      })
      .catch(() => chunk.forEach((h) => failed[view].add(h)))
      .finally(() => {
        chunk.forEach((h) => inflight[view].delete(h));
        bump();
      });
  }
}

/** Valid product paths in; each one's product (undefined while it loads, null if it's gone) out. */
export function useProducts<V extends ProductView>(hrefs: string[], view: V) {
  // A failure stands while the component that saw it stays mounted (it offers "Try again"). One that
  // mounts later, say after navigating away and back, asks again rather than inherit it.
  useState(() => hrefs.forEach((h) => failed[view].delete(h)));
  const v = useSyncExternalStore(subscribe, () => version, () => 0);
  const key = hrefs.join(",");
  useEffect(() => {
    const missing = [...new Set(hrefs)].filter((h) => !cache[view].has(h) && !inflight[view].has(h) && !failed[view].has(h));
    if (missing.length) request(missing, view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, view, v]);
  return {
    get: (href: string) => cache[view].get(href) as Item<V> | null | undefined,
    /** Some product is still loading. */
    pending: hrefs.some((h) => !cache[view].has(h) && !failed[view].has(h)),
    /** A request failed (offline, or the endpoint is down). */
    failed: hrefs.some((h) => failed[view].has(h)),
    /** How many of these products a failed request left out. */
    failedCount: hrefs.filter((h) => failed[view].has(h)).length,
    retry: () => {
      hrefs.forEach((h) => failed[view].delete(h));
      bump();
    },
  };
}
