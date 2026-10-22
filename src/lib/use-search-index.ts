"use client";
import { useEffect, useState } from "react";
import type { SearchEntry } from "@/components/SearchBox";

let cache: Promise<SearchEntry[]> | null = null;

/** The search index, loaded once per visit when a search box first needs it. */
export function useSearchIndex(active: boolean): SearchEntry[] | null {
  const [items, setItems] = useState<SearchEntry[] | null>(null);
  useEffect(() => {
    if (!active || items) return;
    cache ??= fetch("/search-index.json")
      .then((r) => r.json() as Promise<SearchEntry[]>)
      .catch(() => {
        cache = null;
        return [];
      });
    let live = true;
    cache.then((x) => live && setItems(x));
    return () => {
      live = false;
    };
  }, [active, items]);
  return items;
}
