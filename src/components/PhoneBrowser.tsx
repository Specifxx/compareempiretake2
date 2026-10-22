"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { PhoneSummary } from "@/lib/catalog";
import { search } from "@/lib/search";
import { CloseIcon, FilterIcon, SearchIcon } from "./icons";
import { PhoneCard } from "./PhoneCard";

const SORTS = {
  popular: "Most compared",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  saving: "Biggest saving",
  newest: "Newest models",
} as const;
type Sort = keyof typeof SORTS;

const PRICE_BANDS: [string, number | undefined, number | undefined][] = [
  ["Under $300", undefined, 300],
  ["$300 – $700", 300, 700],
  ["$700 – $1,200", 700, 1200],
  ["$1,200 – $2,000", 1200, 2000],
  ["$2,000+", 2000, undefined],
];
const STORAGE = [128, 256, 512, 1024];

export function PhoneBrowser({ phones, fixedBrand }: { phones: PhoneSummary[]; fixedBrand?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [panel, setPanel] = useState(false);

  const q = params.get("q") ?? "";
  const brandParam = params.get("brand") ?? "";
  const brands = useMemo(() => brandParam.split(",").filter(Boolean), [brandParam]);
  const min = params.get("min") ? Number(params.get("min")) : undefined;
  const max = params.get("max") ? Number(params.get("max")) : undefined;
  const storage = params.get("storage") ? Number(params.get("storage")) : undefined;
  const fold = params.get("fold") === "1";
  const only5g = params.get("5g") === "1";
  const stock = params.get("stock") === "1";
  const multi = params.get("multi") === "1";
  const sort = (params.get("sort") as Sort) || (q ? "relevance" : "popular");

  const set = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  const allBrands = useMemo(() => {
    const m = new Map<string, number>();
    phones.forEach((p) => m.set(p.brand, (m.get(p.brand) ?? 0) + 1));
    return [...m].sort((a, b) => b[1] - a[1]);
  }, [phones]);

  const results = useMemo(() => {
    let r = q ? search(phones, q, 500) : phones;
    r = r.filter(
      (p) =>
        (!brands.length || brands.includes(p.brand)) &&
        (min === undefined || p.bestPrice >= min) &&
        (max === undefined || p.bestPrice <= max) &&
        (!storage || p.storages.some((s) => s >= storage)) &&
        (!fold || p.foldable) &&
        (!only5g || p.network === "5G") &&
        (!stock || p.inStock) &&
        (!multi || p.retailerCount >= 2),
    );
    const by: Record<string, (a: PhoneSummary, b: PhoneSummary) => number> = {
      popular: (a, b) => b.retailerCount - a.retailerCount || b.generation - a.generation || b.bestPrice - a.bestPrice,
      "price-asc": (a, b) => a.bestPrice - b.bestPrice,
      "price-desc": (a, b) => b.bestPrice - a.bestPrice,
      saving: (a, b) => b.saving - a.saving,
      newest: (a, b) => b.generation - a.generation || b.bestPrice - a.bestPrice,
    };
    return by[sort] ? [...r].sort(by[sort]) : r;
  }, [phones, q, brands, min, max, storage, fold, only5g, stock, multi, sort]);

  const active =
    brands.length + (min !== undefined || max !== undefined ? 1 : 0) + (storage ? 1 : 0) + [fold, only5g, stock, multi].filter(Boolean).length;

  const filters = (
    <div className="space-y-7">
      {!fixedBrand && (
        <Group title="Brand">
          <div className="flex flex-wrap gap-2">
            {allBrands.map(([b, n]) => {
              const on = brands.includes(b);
              return (
                <button key={b} className={`chip text-xs ${on ? "chip-on" : ""}`} onClick={() => set({ brand: (on ? brands.filter((x) => x !== b) : [...brands, b]).join(",") || undefined })}>
                  {b} <span className="opacity-60">{n}</span>
                </button>
              );
            })}
          </div>
        </Group>
      )}
      <Group title="Price">
        <div className="flex flex-wrap gap-2">
          {PRICE_BANDS.map(([label, lo, hi]) => {
            const on = min === lo && max === hi;
            return (
              <button key={label} className={`chip text-xs ${on ? "chip-on" : ""}`} onClick={() => set(on ? { min: undefined, max: undefined } : { min: lo?.toString(), max: hi?.toString() })}>
                {label}
              </button>
            );
          })}
        </div>
      </Group>
      <Group title="Storage">
        <div className="flex flex-wrap gap-2">
          {STORAGE.map((s) => (
            <button key={s} className={`chip text-xs ${storage === s ? "chip-on" : ""}`} onClick={() => set({ storage: storage === s ? undefined : String(s) })}>
              {s >= 1024 ? "1TB" : `${s}GB`}+
            </button>
          ))}
        </div>
      </Group>
      <Group title="Features">
        <div className="space-y-2.5">
          <Toggle label="In stock somewhere" on={stock} onChange={(v) => set({ stock: v ? "1" : undefined })} />
          <Toggle label="Sold by 2+ stores" on={multi} onChange={(v) => set({ multi: v ? "1" : undefined })} />
          <Toggle label="5G only" on={only5g} onChange={(v) => set({ "5g": v ? "1" : undefined })} />
          <Toggle label="Foldables & flips" on={fold} onChange={(v) => set({ fold: v ? "1" : undefined })} />
        </div>
      </Group>
      {active > 0 && (
        <button className="text-sm font-semibold text-brand hover:underline" onClick={() => router.replace(pathname + (q ? `?q=${encodeURIComponent(q)}` : ""), { scroll: false })}>
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24">{filters}</div>
      </aside>
      <div>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-line bg-bg-card px-3 shadow-sm focus-within:border-brand">
            <SearchIcon className="h-4 w-4 text-ink-mute" />
            <input
              value={q}
              onChange={(e) => set({ q: e.target.value || undefined })}
              placeholder={fixedBrand ? `Search ${fixedBrand} phones…` : "Filter by name…"}
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-mute"
            />
            {q && (
              <button onClick={() => set({ q: undefined })} aria-label="Clear search"><CloseIcon className="h-4 w-4 text-ink-mute" /></button>
            )}
          </label>
          <div className="flex gap-2">
            <button className="btn-ghost lg:hidden" onClick={() => setPanel(true)}>
              <FilterIcon /> Filters {active > 0 && <span className="rounded-full bg-brand px-1.5 text-[11px] text-white">{active}</span>}
            </button>
            <select
              value={sort in SORTS ? sort : "popular"}
              onChange={(e) => set({ sort: e.target.value === "popular" ? undefined : e.target.value })}
              className="h-11 rounded-xl border border-line bg-bg-card px-3 text-sm font-medium shadow-sm"
              aria-label="Sort"
            >
              {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="mb-4 text-sm text-ink-mute">
          {results.length} {results.length === 1 ? "phone" : "phones"}
          {q && <> matching “<span className="text-ink">{q}</span>”</>}
        </div>
        {results.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {results.map((p, i) => <PhoneCard key={p.slug} p={p} priority={i < 4} />)}
          </div>
        ) : (
          <div className="card grid place-items-center gap-2 px-6 py-16 text-center">
            <div className="font-display text-xl font-bold">No phones match</div>
            <p className="text-sm text-ink-mute">Try fewer filters or a different search.</p>
          </div>
        )}
      </div>

      {panel && (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setPanel(false)}>
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-bg-card p-6 animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <div className="font-display text-xl font-bold">Filters</div>
              <button onClick={() => setPanel(false)} aria-label="Close"><CloseIcon /></button>
            </div>
            {filters}
            <button className="btn-primary mt-8 w-full" onClick={() => setPanel(false)}>Show {results.length} phones</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow mb-3">{title}</div>
      {children}
    </div>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className="flex w-full items-center justify-between text-sm" onClick={() => onChange(!on)} role="switch" aria-checked={on}>
      <span className="text-ink-soft">{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition ${on ? "bg-brand" : "bg-line"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}
