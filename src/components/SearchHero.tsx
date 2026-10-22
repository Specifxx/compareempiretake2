"use client";
import { SearchIcon } from "./icons";

/** The big home search box: opens the same palette as ⌘K. */
export function SearchHero() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("ce:search"))}
      className="group flex h-16 w-full items-center gap-3 rounded-2xl border border-line bg-bg-card px-5 text-left shadow-lift transition hover:border-brand/40"
    >
      <SearchIcon className="h-6 w-6 text-brand" />
      <span className="flex-1 truncate text-base text-ink-mute sm:text-lg"><span className="sm:hidden">Search any phone…</span><span className="hidden sm:inline">Try “iPhone 17 Pro”, “S26 Ultra” or “under $400”</span></span>
      <span className="btn-primary hidden sm:inline-flex">Search</span>
    </button>
  );
}
