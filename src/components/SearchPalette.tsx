"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "./icons";
import { useResults, type SearchEntry } from "./SearchBox";
import { useSearchIndex } from "@/lib/use-search-index";
import { useRegionKit } from "@/lib/use-region";
import { AMAZON_REL, amazonLink } from "@/lib/amazon";

const NONE: SearchEntry[] = [];
const SUGGESTIONS = ["iPhone 17 Pro", "RTX 5070 Ti", '65" OLED', "AirPods", "PS5", "under $500"];

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { $, region } = useRegionKit();
  const items = useSearchIndex(open) ?? NONE;
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { phones, other } = useResults(items, q);
  const results = [...phones, ...other];

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => input.current?.focus(), 10);
    }
  }, [open]);
  useEffect(() => setActive(0), [q]);

  if (!open) return null;
  const go = (href?: string) => {
    onClose();
    if (href) router.push(href);
    else if (q.trim()) router.push(`/phones?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[10vh] backdrop-blur-sm animate-fade-up" onClick={onClose}>
      <div className="card w-full max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Search">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <SearchIcon className="h-5 w-5 text-ink-mute" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              if (e.key === "Enter") go(results[active]?.href);
            }}
            placeholder="Search 'iphone 17 pro', 's26u', 'under $500'…"
            className="h-14 w-full bg-transparent text-base outline-none placeholder:text-ink-mute"
            aria-label="Search phones"
          />
          <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 text-[11px] text-ink-mute sm:block">esc</kbd>
        </div>
        {!q && (
          <div className="flex flex-wrap gap-2 border-b border-line px-4 py-3">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chip text-xs" onClick={() => setQ(s)}>{s}</button>
            ))}
          </div>
        )}
        <ul className="max-h-[55vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-ink-mute">No phones match “{q}”. Try a brand or model number.</li>}
          {results.map((r, i) => (
            <li key={r.href}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.href)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${i === active ? "bg-bg-sunk" : ""}`}
              >
                <div className="img-tile grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg">
                  {r.image ? <img src={r.image} alt="" className="product-img h-11 w-11 object-contain" loading="lazy" /> : <span className="text-xs font-bold text-brand">{r.kind === "vs" ? "VS" : "📖"}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{r.name}</div>
                  <div className="text-xs text-ink-mute">{r.kind === "phone" ? `${r.stores} ${r.stores === 1 ? "store" : "stores"}` : r.kind === "vs" ? "Comparison" : "Guide"}</div>
                </div>
                {r.price !== undefined && (
                  <div className="text-right">
                    <div className="text-[11px] text-ink-mute">from</div>
                    <div className="price">{$(r.price)}</div>
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
        {q.trim() && (
          <button onClick={() => go()} className="w-full border-t border-line px-4 py-3 text-left text-sm text-brand hover:bg-bg-sunk">
            See all results for “{q}” →
          </button>
        )}
        {q.trim() && amazonLink(region, q.trim()) && (
          <a href={amazonLink(region, q.trim(), "search")!} target="_blank" rel={AMAZON_REL} data-buy="amazon" data-buy-kind="amazon-search" data-amazon="search" data-buy-product={q.trim()} className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm hover:bg-bg-sunk">
            <span>Check price on Amazon for “{q.trim()}” ↗</span>
            <span className="text-[10px] text-ink-mute">Ad · affiliate link</span>
          </a>
        )}
      </div>
    </div>
  );
}
