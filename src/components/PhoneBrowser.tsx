"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { facetDefs, facetValue, isSort, PAGE_SIZE, SORT_FNS, SORTS, unpackGrid, type GridFile, type GridItem, type GridProps } from "@/lib/browse";
import { categoryById } from "@/lib/categories";
import { search } from "@/lib/search";
import { CloseIcon, FilterIcon, SearchIcon } from "./icons";
import { PhoneCard } from "./PhoneCard";

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

/**
 * Full lists by URL, kept for the visit. `lists` is read during render, so a grid that mounts
 * again (back to a category already seen) has its list at once instead of flashing a skeleton.
 */
const lists = new Map<string, GridItem[]>();
const loading = new Map<string, Promise<GridItem[]>>();
function loadList(src: string): Promise<GridItem[]> {
  let p = loading.get(src);
  if (!p) {
    p = fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(`${src}: ${r.status}`);
        return r.json() as Promise<GridFile>;
      })
      .then((file) => {
        const items = unpackGrid(file);
        lists.set(src, items);
        return items;
      })
      .catch((e) => {
        loading.delete(src);
        throw e;
      });
    loading.set(src, p);
  }
  return p;
}

type Params = Pick<URLSearchParams, "get" | "toString">;
const NO_PARAMS: Params = new URLSearchParams();
type Props = GridProps & { fixedBrand?: string; category?: string; showCategory?: boolean };

/**
 * The product grid with its filters. A prerendered page can't know its query string, so
 * useSearchParams() sends the server to the Suspense fallback: the same grid in its default view
 * (first page, most compared first), which is what crawlers and the first paint get. The browser
 * then renders it with the real query string. On a filtered deep link (/phones?max=500) the root
 * layout's head script marks <html class="gq"> before first paint, and globals.css shows the
 * fallback's skeleton instead of its unfiltered cards, so nobody sees the wrong products first.
 */
export function PhoneBrowser(props: Props) {
  return (
    <Suspense fallback={<Browser {...props} params={NO_PARAMS} fallback />}>
      <WithParams {...props} />
    </Suspense>
  );
}

function WithParams(props: Props) {
  const params = useSearchParams();
  return <Browser {...props} params={params} />;
}

function Browser({ initial, total, options, src, fixedBrand, category = "phones", showCategory, params, fallback }: Props & { params: Params; fallback?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [panel, setPanel] = useState(false);
  // Big categories have thousands of products: render a page at a time.
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [, setLoadedCount] = useState(0);
  const [failed, setFailed] = useState<string | null>(null);

  const full = src ? lists.get(src) : undefined;
  const phones = full ?? initial;
  const complete = !!full || !src || initial.length >= total;

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
  const sortParam = params.get("sort") ?? "";
  // Only a sort we offer; anything else (?sort=valueOf included) is the default for the view.
  const sort = isSort(sortParam) ? sortParam : q ? "relevance" : "popular";
  const defs = facetDefs(category);
  const facetParam = (key: string) => `f.${key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const facetSel = useMemo(
    () => Object.fromEntries(defs.map((f) => [f.key, params.get(facetParam(f.key))?.split("|").filter(Boolean) ?? []])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params, category],
  );

  const set = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

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
        defs.every((f) => !facetSel[f.key]?.length || facetSel[f.key].includes(facetValue(p, f))),
    );
    return sort === "relevance" ? r : [...r].sort(SORT_FNS[sort]);
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

  // The first page of the default view is `initial` itself; anything else needs the full list.
  const isDefault = !q && !active && sort === "popular";
  const needAll = !complete && (!isDefault || limit > initial.length);
  const attempt = `${src}|${needAll}`;
  useEffect(() => {
    if (complete || !src || failed === attempt) return;
    let live = true;
    const go = () => loadList(src).then(
      (items) => live && setLoadedCount(items.length),
      () => live && setFailed(attempt),
    );
    if (needAll) {
      go();
      return () => {
        live = false;
      };
    }
    // Otherwise as soon as the page is idle, so the next filter, sort or "Show more" is instant.
    // (Safari has no requestIdleCallback.)
    const idle = typeof window.requestIdleCallback === "function";
    const id = idle ? window.requestIdleCallback(go, { timeout: 4000 }) : window.setTimeout(go, 1500);
    return () => {
      live = false;
      if (idle) window.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, [src, complete, needAll, failed, attempt]);
  // A filtered or sorted view shows nothing until the list arrives, so ask while rendering rather
  // than after the first commit. loadList is idempotent; the effect above takes the answer.
  if (needAll && src && failed !== attempt && typeof window !== "undefined") loadList(src).catch(() => {});
  const waiting = needAll && failed !== attempt;
  const gaveUp = needAll && failed === attempt;
  /** How many products the view holds, when it's known: the full count for the default view before the list arrives. */
  const count = complete || gaveUp ? results.length : isDefault ? total : undefined;

  const filters = (
    <div className="space-y-7">
      {showCategory && options.cats && options.cats.length > 1 && (
        <Group title="Category">
          <div className="flex flex-wrap gap-2">
            {options.cats.map(([c, n]) => (
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
            {(options.brands ?? []).map(([b, n]) => {
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
      {options.facets.map((f) => (
        <Group key={f.key} title={f.label}>
          <div className="flex flex-wrap gap-2">
            {f.opts.map(([v, n]) => {
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

  const grid =
    waiting && !isDefault ? (
      <Skeleton />
    ) : results.length ? (
      <>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {results.slice(0, limit).map((p, i) => <PhoneCard key={p.href} p={p} priority={i < 4} showCategory={showCategory} />)}
        </div>
        {(count ?? 0) > limit && (
          <div className="mt-8 text-center">
            {waiting ? (
              <button className="btn-ghost" disabled aria-busy>Loading more…</button>
            ) : (
              <button className="btn-ghost" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
                Show more <span className="text-ink-mute">({((count ?? 0) - limit).toLocaleString()} left)</span>
              </button>
            )}
          </div>
        )}
      </>
    ) : (
      <div className="card grid place-items-center gap-2 px-6 py-16 text-center">
        <div className="font-display text-xl font-bold">Nothing matches</div>
        <p className="text-sm text-ink-mute">Try fewer filters or a different search.</p>
      </div>
    );

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]" data-grid-fallback={fallback ? "" : undefined}>
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
              value={sort === "relevance" ? "popular" : sort}
              onChange={(e) => set({ sort: e.target.value === "popular" ? undefined : e.target.value })}
              className="h-11 rounded-xl border border-line bg-bg-card px-3 text-sm font-medium shadow-sm"
              aria-label="Sort"
            >
              {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="mb-4 text-sm text-ink-mute" role="status">
          {count === undefined ? (
            <>Loading all {total} products…</>
          ) : fallback ? (
            <>
              <span data-unfiltered>{count} {count === 1 ? "product" : "products"}</span>
              <span data-filtered-only>Loading products…</span>
            </>
          ) : (
            <>
              {count} {count === 1 ? "product" : "products"}
              {q && <> matching “<span className="text-ink">{q}</span>”</>}
            </>
          )}
        </div>
        {gaveUp && (
          <div className="card mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <span className="text-ink-soft">Couldn&apos;t load all {total} products, so this only covers the first {initial.length}.</span>
            <button className="font-semibold text-brand hover:underline" onClick={() => setFailed(null)}>Try again</button>
          </div>
        )}
        {fallback ? (
          <>
            <div data-unfiltered>{grid}</div>
            <div data-filtered-only>
              <Skeleton />
            </div>
          </>
        ) : (
          grid
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
            <button className="btn-primary mt-8 w-full" onClick={() => setPanel(false)}>{count === undefined ? "Show results" : `Show ${count} results`}</button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Stands in for the grid while a filtered or sorted view waits for the full list. */
function Skeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="img-tile aspect-square animate-pulse" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-bg-sunk" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-bg-sunk" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-bg-sunk" />
            <div className="h-6 w-2/5 animate-pulse rounded bg-bg-sunk pt-3" />
          </div>
        </div>
      ))}
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
