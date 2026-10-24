"use client";
import { useEffect, useState } from "react";
import type { SearchEntry } from "@/components/SearchBox";
import { withRegion } from "./region";
import { useRegion } from "./use-region";

const caches = new Map<string, Promise<SearchEntry[]>>();

/** The search index, loaded once per visit when a search box first needs it. */
export function useSearchIndex(active: boolean): SearchEntry[] | null {
  const region = useRegion();
  const [loaded, setLoaded] = useState<{ region: string; items: SearchEntry[] } | null>(null);
  const items = loaded?.region === region ? loaded.items : null;
  useEffect(() => {
    if (!active || items) return;
    const url = withRegion("/search-index.json", region);
    let p = caches.get(url);
    if (!p) {
      p = fetch(url)
        .then((r) => r.json() as Promise<SearchEntry[]>)
        .catch(() => {
          caches.delete(url);
          return [];
        });
      caches.set(url, p);
    }
    let live = true;
    p.then((x) => live && setLoaded({ region, items: x }));
    return () => {
      live = false;
    };
  }, [active, items, region]);
  return items;
}
