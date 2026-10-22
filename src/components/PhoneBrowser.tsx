"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { PhoneSummary } from "@/lib/catalog";
import { categoryById } from "@/lib/categories";
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

type Band = [string, number | undefined, number | undefined];
const PRICE_BANDS: Record<string, Band[]> = {
  default: [
    ["Under $300", undefined, 300],
    ["$300 – $700", 300, 700],
    ["$700 – $1,200", 700, 1200],
    ["$1,200 – $2,000", 1200, 2000],
    ["$2,000+", 2000, undefined],
  ],
  tvs: [
    ["Under $800", undefined, 800],
    ["$800 – $1,500", 800, 1500],
    ["$1,500 – $3,000", 1500, 3000],
    ["$3,000 – $5,000", 3000, 5000],
    ["$5,000+", 5000, undefined],
  ],
  monitors: [
    ["Under $250", undefined, 250],
    ["$250 – $500", 250, 500],
    ["$500 – $1,000", 500, 1000],
    ["$1,000+", 1000, undefined],
  ],
  "graphics-cards": [
    ["Under $500", undefined, 500],
    ["$500 – $1,000", 500, 1000],
    ["$1,000 – $2,000", 1000, 2000],
    ["$2,000+", 2000, undefined],
  ],
  small: [
    ["Under $100", undefined, 100],
    ["$100 – $250", 100, 250],
    ["$250 – $500", 250, 500],
    ["$500 – $1,000", 500, 1000],
    ["$1,000+", 1000, undefined],
  ],
  laptops: [
    ["Under $800", undefined, 800],
    ["$800 – $1,500", 800, 1500],
    ["$1,500 – $2,500", 1500, 2500],
    ["$2,500+", 2500, undefined],
  ],
};
const STORAGE = [128, 256, 512, 1024];
/** Categories where most products cost under $500, so price bands start lower. */
const SMALL_TICKET = new Set(["headphones", "speakers", "ssds", "ram", "routers", "printers", "cpus", "motherboards", "smartwatches", "soundbars"]);

/** Spec filters per category: which facet to offer, and how to bucket its values. */
const FACETS: Record<string, { key: string; label: string; bucket?: (v: string) => string }[]> = {
  tvs: [
    { key: "Screen size", label: "Size", bucket: (v) => sizeBucket(parseFloat(v), [43, 50, 55, 65, 75, 85]) },
    { key: "Panel", label: "Panel" },
    { key: "Resolution", label: "Resolution" },
  ],
  monitors: [
    { key: "Screen size", label: "Size", bucket: (v) => sizeBucket(parseFloat(v), [24, 27, 32, 34, 49]) },
    { key: "Resolution", label: "Resolution" },
    { key: "Refresh rate", label: "Refresh rate", bucket: (v) => (parseInt(v) >= 240 ? "240Hz+" : parseInt(v) >= 144 ? "144Hz+" : "Under 144Hz") },
    { key: "Panel", label: "Panel" },
  ],
  "graphics-cards": [
    { key: "GPU", label: "GPU" },
    { key: "Memory", label: "Memory" },
  ],
  laptops: [
    { key: "Memory", label: "Memory" },
    { key: "Storage", label: "Storage" },
    { key: "Graphics", label: "Dedicated graphics" },
  ],
  tablets: [{ key: "Chip", label: "Chip" }],
  cpus: [
    { key: "Family", label: "Family" },
    { key: "Socket", label: "Socket" },
  ],
  ssds: [
    { key: "Interface", label: "Interface" },
    { key: "PCIe", label: "PCIe" },
  ],
  ram: [
    { key: "Type", label: "Type" },
    { key: "Capacity", label: "Capacity" },
    { key: "Speed", label: "Speed" },
  ],
  motherboards: [
    { key: "Socket", label: "Socket" },
    { key: "Chipset", label: "Chipset" },
    { key: "Form factor", label: "Form factor" },
    { key: "Wi-Fi", label: "Wi-Fi" },
  ],
  headphones: [
    { key: "Type", label: "Type" },
    { key: "Noise cancelling", label: "Noise cancelling" },
  ],
  smartwatches: [{ key: "Connectivity", label: "Connectivity" }],
  consoles: [{ key: "Platform", label: "Platform" }],
  cameras: [
    { key: "Type", label: "Type" },
    { key: "Kit", label: "Lens" },
  ],
  soundbars: [
    { key: "Channels", label: "Channels" },
    { key: "Dolby Atmos", label: "Dolby Atmos" },
  ],
  speakers: [{ key: "Type", label: "Type" }],
  routers: [
    { key: "Wi-Fi", label: "Wi-Fi standard" },
    { key: "Mesh", label: "Mesh" },
  ],
  printers: [
    { key: "Type", label: "Type" },
    { key: "Colour", label: "Colour" },
  ],
  "robot-vacuums": [
    { key: "Mops", label: "Mops" },
    { key: "Base station", label: "Base station" },
  ],
  desktops: [
    { key: "Memory", label: "Memory" },
    { key: "Storage", label: "Storage" },
  ],
};

function sizeBucket(n: number, steps: number[]): string {
  if (!n) return "";
  // Nearest listed size class, e.g. 64.5" → 65".
  const near = steps.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));
  return Math.abs(near - n) <= 3 ? `${near}"` : `${Math.round(n)}"`;
}

export function PhoneBrowser({ phones, fixedBrand, category = "phones", showCategory }: { phones: PhoneSummary[]; fixedBrand?: string; category?: string; showCategory?: boolean }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [panel, setPanel] = useState(false);
  // Big categories have thousands of products: render a page at a time.
  const [limit, setLimit] = useState(48);

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
  const catParam = params.get("cat") ?? "";
  const sort = (params.get("sort") as Sort) || (q ? "relevance" : "popular");
  const facetDefs = FACETS[category] ?? [];
  const facetValue = (p: PhoneSummary, f: (typeof facetDefs)[number]) => {
    const v = p.facets[f.key];
    return v ? (f.bucket ? f.bucket(v) : v) : "";
  };
  const facetParam = (key: string) => `f.${key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const facetSel = useMemo(
    () => Object.fromEntries(facetDefs.map((f) => [f.key, params.get(facetParam(f.key))?.split("|").filter(Boolean) ?? []])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params, category],
  );
  const facetOptions = useMemo(
    () =>
      facetDefs.map((f) => {
        const m = new Map<string, number>();
        phones.forEach((p) => {
          const v = facetValue(p, f);
          if (v) m.set(v, (m.get(v) ?? 0) + 1);
        });
        const opts = [...m].sort((a, b) => (parseFloat(a[0]) && parseFloat(b[0]) ? parseFloat(a[0]) - parseFloat(b[0]) : b[1] - a[1]));
        return { f, opts };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phones, category],
  );

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
        (!multi || p.retailerCount >= 2) &&
        (!catParam || p.category === catParam) &&
        facetDefs.every((f) => !facetSel[f.key]?.length || facetSel[f.key].includes(facetValue(p, f))),
    );
    const by: Record<string, (a: PhoneSummary, b: PhoneSummary) => number> = {
      popular: (a, b) => b.retailerCount - a.retailerCount || b.generation - a.generation || b.bestPrice - a.bestPrice,
      "price-asc": (a, b) => a.bestPrice - b.bestPrice,
      "price-desc": (a, b) => b.bestPrice - a.bestPrice,
      saving: (a, b) => b.saving - a.saving,
      newest: (a, b) => b.generation - a.generation || b.bestPrice - a.bestPrice,
    };
    return by[sort] ? [...r].sort(by[sort]) : r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phones, q, brands, min, max, storage, fold, only5g, stock, multi, sort, facetSel, catParam]);

  const active =
    brands.length +
    (min !== undefined || max !== undefined ? 1 : 0) +
    (catParam ? 1 : 0) +
    (storage ? 1 : 0) +
    [fold, only5g, stock, multi].filter(Boolean).length +
    Object.values(facetSel).reduce((n, v) => n + v.length, 0);
  const isPhone = category === "phones";

  const cats = useMemo(() => {
    const m = new Map<string, number>();
    phones.forEach((p) => m.set(p.category, (m.get(p.category) ?? 0) + 1));
    return [...m];
  }, [phones]);
  const filters = (
    <div className="space-y-7">
      {showCategory && cats.length > 1 && (
        <Group title="Category">
          <div className="flex flex-wrap gap-2">
            {cats.map(([c, n]) => (
              <button key={c} className={`chip text-xs ${catParam === c ? "chip-on" : ""}`} onClick={() => set({ cat: catParam === c ? undefined : c })}>
                {categoryById(c)?.name ?? c} <span className="opacity-60">{n}</span>
              </button>
            ))}
          </div>
        </Group>
      )}
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
          {(PRICE_BANDS[category] ?? (SMALL_TICKET.has(category) ? PRICE_BANDS.small : PRICE_BANDS.default)).map(([label, lo, hi]) => {
            const on = min === lo && max === hi;
            return (
              <button key={label} className={`chip text-xs ${on ? "chip-on" : ""}`} onClick={() => set(on ? { min: undefined, max: undefined } : { min: lo?.toString(), max: hi?.toString() })}>
                {label}
              </button>
            );
          })}
        </div>
      </Group>
      {facetOptions.filter(({ opts }) => opts.length > 1).map(({ f, opts }) => (
        <Group key={f.key} title={f.label}>
          <div className="flex flex-wrap gap-2">
            {opts.slice(0, 18).map(([v, n]) => {
              const sel = facetSel[f.key] ?? [];
              const on = sel.includes(v);
              return (
                <button key={v} className={`chip text-xs ${on ? "chip-on" : ""}`} onClick={() => set({ [facetParam(f.key)]: (on ? sel.filter((x) => x !== v) : [...sel, v]).join("|") || undefined })}>
                  {v} <span className="opacity-60">{n}</span>
                </button>
              );
            })}
          </div>
        </Group>
      ))}
      {(isPhone || category === "tablets" || category === "ssds") && (
      <Group title="Storage">
        <div className="flex flex-wrap gap-2">
          {STORAGE.map((s) => (
            <button key={s} className={`chip text-xs ${storage === s ? "chip-on" : ""}`} onClick={() => set({ storage: storage === s ? undefined : String(s) })}>
              {s >= 1024 ? "1TB" : `${s}GB`}+
            </button>
          ))}
        </div>
      </Group>
      )}
      <Group title="Features">
        <div className="space-y-2.5">
          <Toggle label="In stock somewhere" on={stock} onChange={(v) => set({ stock: v ? "1" : undefined })} />
          <Toggle label="Sold by 2+ stores" on={multi} onChange={(v) => set({ multi: v ? "1" : undefined })} />
          {isPhone && <Toggle label="5G only" on={only5g} onChange={(v) => set({ "5g": v ? "1" : undefined })} />}
          {isPhone && <Toggle label="Foldables & flips" on={fold} onChange={(v) => set({ fold: v ? "1" : undefined })} />}
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
              placeholder={fixedBrand ? `Search ${fixedBrand}…` : "Filter by name or model…"}
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
          {results.length} {results.length === 1 ? "product" : "products"}
          {q && <> matching “<span className="text-ink">{q}</span>”</>}
        </div>
        {results.length ? (
          <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {results.slice(0, limit).map((p, i) => <PhoneCard key={p.href} p={p} priority={i < 4} showCategory={showCategory} />)}
          </div>
          {results.length > limit && (
            <div className="mt-8 text-center">
              <button className="btn-ghost" onClick={() => setLimit((l) => l + 48)}>
                Show more <span className="text-ink-mute">({(results.length - limit).toLocaleString()} left)</span>
              </button>
            </div>
          )}
          </>
        ) : (
          <div className="card grid place-items-center gap-2 px-6 py-16 text-center">
            <div className="font-display text-xl font-bold">Nothing matches</div>
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
            <button className="btn-primary mt-8 w-full" onClick={() => setPanel(false)}>Show {results.length} results</button>
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
