"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { search } from "@/lib/search";
import { useSearchIndex } from "@/lib/use-search-index";
import { SearchIcon } from "./icons";

export interface SearchEntry {
  kind: "phone" | "guide" | "vs" | "category";
  /** Category name for products ("TVs"), shown beside the result. */
  category?: string;
  href: string;
  name: string;
  sub?: string;
  image?: string;
  price?: number;
  stores?: number;
}

const EMPTY: SearchEntry[] = [];

/** Live results under the box as you type: phones first, then comparisons and guides. */
export function useResults(items: SearchEntry[], q: string) {
  return useMemo(() => {
    const t = q.trim();
    const phones = items.filter((i) => i.kind === "phone");
    if (!t) return { phones: phones.slice(0, 5), other: [] as SearchEntry[] };
    const under = t.match(/(?:under|below|<)\s*\$?(\d{2,5})/i);
    if (under) {
      const base = t.replace(under[0], "").trim();
      const pool = phones.filter((p) => (p.price ?? 0) <= Number(under[1]));
      return { phones: (base ? search(pool, base, 8) : pool.sort((a, b) => (b.stores ?? 0) - (a.stores ?? 0))).slice(0, 8), other: [] };
    }
    if (/^fold|^flip/i.test(t)) return { phones: phones.filter((i) => /fold|flip|razr|magic v/i.test(i.name)).slice(0, 8), other: [] };
    return {
      phones: search(phones, t, 6),
      other: [
        ...search(items.filter((i) => i.kind === "category"), t, 2),
        ...search(items.filter((i) => i.kind === "vs"), t, 3),
        ...search(items.filter((i) => i.kind === "guide"), t, 3),
      ],
    };
  }, [items, q]);
}

export function SearchBox({ size = "md", autoFocus }: { size?: "md" | "lg"; autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const loaded = useSearchIndex(open);
  const items = loaded ?? EMPTY;
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { phones, other } = useResults(items, q);
  const flat = [...phones, ...other];

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    const focus = () => input.current?.focus();
    if (size === "md") window.addEventListener("ce:focus-search", focus);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("ce:focus-search", focus);
    };
  }, [size]);

  const go = (href?: string) => {
    setOpen(false);
    input.current?.blur();
    router.push(href ?? `/phones?q=${encodeURIComponent(q.trim())}`);
  };

  const lg = size === "lg";
  return (
    <div ref={box} className="relative w-full">
      <label
        className={`flex items-center gap-3 border border-line bg-bg-card transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15 ${
          lg ? "h-16 rounded-2xl px-5 shadow-lift" : "h-10 rounded-xl px-3 shadow-sm"
        }`}
      >
        <SearchIcon className={lg ? "h-6 w-6 text-brand" : "h-4 w-4 text-ink-mute"} />
        <input
          ref={input}
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setOpen(false); input.current?.blur(); }
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, flat.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === "Enter" && (flat[active] || q.trim())) go(flat[active]?.href);
          }}
          placeholder={lg ? "Search phones, TVs, laptops, graphics cards…" : "Search products…"}
          className={`w-full min-w-0 bg-transparent outline-none placeholder:text-ink-mute ${lg ? "text-lg" : "text-sm"}`}
          aria-label="Search"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-results"
          aria-autocomplete="list"
        />
        {!lg && !q && <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 text-[11px] text-ink-mute lg:block">/</kbd>}
      </label>
      {open && (
        <div id="search-results" role="listbox" className={`card absolute inset-x-0 z-50 mt-2 overflow-hidden text-left shadow-lift animate-fade-up ${lg ? "" : "min-w-[22rem]"}`}>
          {!q.trim() && <div className="px-4 pb-1 pt-3 eyebrow">Popular right now</div>}
          {!loaded && <div className="px-4 py-6 text-center text-sm text-ink-mute">Loading…</div>}
          {loaded && flat.length === 0 && <div className="px-4 py-6 text-center text-sm text-ink-mute">No matches for “{q}”. Try a brand or model number.</div>}
          <ul className="max-h-[60vh] overflow-y-auto p-1.5">
            {phones.map((r, i) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex items-center gap-3 rounded-xl px-2.5 py-2 ${i === active ? "bg-bg-sunk" : ""}`}
                >
                  <span className="img-tile grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg">
                    {r.image && <img src={r.image} alt="" className="product-img h-10 w-10 object-contain" loading="lazy" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium"><Highlight text={r.name} q={q} /></span>
                    <span className="block text-xs text-ink-mute">{r.category ? `${r.category} · ` : ""}{r.stores} {r.stores === 1 ? "store" : "stores"} compared</span>
                  </span>
                  {r.price !== undefined && (
                    <span className="text-right">
                      <span className="block text-[10px] text-ink-mute">from</span>
                      <span className="price text-sm">${r.price.toLocaleString("en-AU")}</span>
                    </span>
                  )}
                </Link>
              </li>
            ))}
            {other.length > 0 && <li className="eyebrow px-2.5 pb-1 pt-3">Categories, comparisons & guides</li>}
            {other.map((r, j) => {
              const i = phones.length + j;
              return (
                <li key={r.href}>
                  <Link href={r.href} onClick={() => setOpen(false)} onMouseEnter={() => setActive(i)} className={`flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm ${i === active ? "bg-bg-sunk" : ""}`}>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-xs font-bold text-brand">{r.kind === "vs" ? "VS" : r.kind === "category" ? "▦" : "📖"}</span>
                    <span className="min-w-0 flex-1 truncate">{r.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {q.trim() && (
            <button onClick={() => go()} className="w-full border-t border-line px-4 py-2.5 text-left text-sm font-medium text-brand hover:bg-bg-sunk">
              See all results for “{q.trim()}” →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Highlight({ text, q }: { text: string; q: string }) {
  const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return <>{text}</>;
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i}>
          {i > 0 && " "}
          {words.some((q) => w.toLowerCase().startsWith(q)) ? <b className="font-semibold text-brand">{w}</b> : w}
        </span>
      ))}
    </>
  );
}
