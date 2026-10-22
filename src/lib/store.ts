"use client";
import { useSyncExternalStore } from "react";

/**
 * Per-viewer lists (saved phones, compare tray) kept in localStorage.
 * Reads and writes are guarded: private windows and blocked storage just
 * behave like an empty list.
 */
function createList(key: string, max: number) {
  const listeners = new Set<() => void>();
  let cache: string[] | null = null;
  const read = (): string[] => {
    if (cache) return cache;
    try {
      cache = JSON.parse(localStorage.getItem(key) ?? "[]");
    } catch {
      cache = [];
    }
    return cache!;
  };
  const write = (v: string[]) => {
    cache = v.slice(-max);
    try {
      localStorage.setItem(key, JSON.stringify(cache));
    } catch {}
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        cache = null;
        l();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener("storage", onStorage);
    };
  };
  const EMPTY: string[] = [];
  return {
    use: () => useSyncExternalStore(subscribe, read, () => EMPTY),
    toggle: (id: string) => {
      const v = read();
      write(v.includes(id) ? v.filter((x) => x !== id) : [...v, id]);
    },
    remove: (id: string) => write(read().filter((x) => x !== id)),
    clear: () => write([]),
    max,
  };
}

export const saved = createList("ce-saved", 100);
export const compare = createList("ce-compare", 4);
