"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { storageLabel } from "@/lib/normalize";
import { compareGroup, normaliseHref, parseHref } from "@/lib/product-refs";
import { money, withRegion } from "@/lib/region";
import { RETAILERS } from "@/lib/retailers";
import { search } from "@/lib/search";
import { compare } from "@/lib/store";
import type { Phone, RetailerId } from "@/lib/types";
import { useProducts } from "@/lib/use-products";
import { useSearchIndex } from "@/lib/use-search-index";
import { CloseIcon, SearchIcon } from "./icons";
import { RetailerDot } from "./RetailerChip";
import { AmazonButton, AmazonNote } from "./AmazonLink";

/**
 * Up to four products side by side. The page carries no catalogue: the chosen products come from
 * /api/products, and the "add a product" search from the region's search index (lib/use-search-index.ts).
 */
export function CompareView() {
  const params = useSearchParams();
  const router = useRouter();
  const tray = compare.use();
  const fromUrl = params.get("p")?.split(",").filter(Boolean);
  const source = fromUrl?.length ? fromUrl : tray;
  const hrefs = useMemo(() => {
    const valid = [...new Set(source.map(normaliseHref))].filter((h) => parseHref(h));
    // One region and category at a time, as the tray keeps it (an old or hand-made link may mix
    // them): the rows, the prices' currency and the "add" search are the first product's.
    return valid.filter((h) => compareGroup(h) === compareGroup(valid[0])).slice(0, 4);
  }, [source.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const { get, pending, failed, retry } = useProducts(hrefs, "full");
  const chosen = hrefs.map(get).filter(Boolean) as Phone[];
  // Known-missing products drop out of the list; ones still loading stay in it.
  const kept = hrefs.filter((h) => get(h) !== null);
  const first = hrefs[0] ? parseHref(hrefs[0]) : null;
  const region = chosen[0]?.region ?? first?.region ?? "au";
  const category = chosen[0]?.category ?? first?.category;
  const $ = (n: number) => money(n, region);
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const index = useSearchIndex(focused || !!q, region);

  // Keep the tray and the URL in step so a shared link opens the same comparison (as product paths,
  // the form the Compare buttons store, and only the products the table shows).
  useEffect(() => {
    if (fromUrl?.length && hrefs.length && hrefs.join() !== tray.join()) {
      compare.clear();
      hrefs.forEach((s) => compare.toggle(s));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  const setList = (list: string[]) => {
    compare.clear();
    list.forEach((s) => compare.toggle(s));
    router.replace(list.length ? `/compare?p=${list.join(",")}` : "/compare", { scroll: false });
  };

  const options = useMemo(() => {
    if (!q || !index) return [];
    const within = category ? withRegion(`/${category}/`, region) : undefined;
    return search(index.filter((e) => e.kind === "phone" && (!within || e.href.startsWith(within)) && !kept.includes(e.href)), q, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, index, category, region, kept.join()]);
  const sells = (p: Phone, r: RetailerId) => p.variants.some((v) => v.offers.some((o) => o.retailer === r && o.kind !== "plan"));
  const retailers = (Object.keys(RETAILERS) as RetailerId[]).filter((r) => chosen.some((p) => sells(p, r)));
  const cheapest = chosen.length > 1 ? Math.min(...chosen.map((p) => p.bestPrice)) : undefined;
  // Amazon links are Amazon AU's.
  const amazon = chosen.every((p) => (p.region ?? "au") === "au");

  const rows: [string, (p: Phone) => React.ReactNode][] = [
    ["Best price", (p) => <span className={`price text-xl ${p.bestPrice === cheapest ? "text-save" : ""}`}>{$(p.bestPrice)}</span>],
    ...(category === "phones" || !category
      ? ([
          ["Storage", (p) => p.variants.map((v) => v.label).join(" · ")],
          ["Screen", (p) => (p.specs.screenInches ? `${p.specs.screenInches}"` : "—")],
          ["Chip", (p) => p.specs.chip ?? "—"],
          ["Main camera", (p) => (p.specs.mainCameraMp ? `${p.specs.mainCameraMp}MP` : "—")],
          ["Battery", (p) => (p.specs.batteryMah ? `${p.specs.batteryMah.toLocaleString()} mAh` : "—")],
          ["Network", (p) => p.specs.network ?? "—"],
          ["Foldable", (p) => (p.specs.foldable ? "Yes" : "No")],
        ] as [string, (p: Phone) => React.ReactNode][])
      : ([
          ...(chosen.some((p) => p.variants.length > 1) ? ([["Options", (p: Phone) => p.variants.map((v) => v.label).join(" · ")]] as [string, (p: Phone) => React.ReactNode][]) : []),
          // Every spec any chosen product has, in first-seen order.
          ...[...new Set(chosen.flatMap((p) => (p.specs.extra ?? []).map(([k]) => k)))].map(
            (k) => [k, (p: Phone) => (p.specs.extra ?? []).find(([x]) => x === k)?.[1] ?? "—"] as [string, (p: Phone) => React.ReactNode],
          ),
        ] as [string, (p: Phone) => React.ReactNode][])),
    ["Stores", (p) => `${p.retailerCount}`],
    ...retailers.map(
      (r) =>
        [
          RETAILERS[r].name,
          (p: Phone) => {
            const o = p.variants.flatMap((v) => v.offers.filter((x) => x.retailer === r && x.kind !== "plan").map((x) => ({ ...x, gb: v.storageGb }))).sort((a, b) => a.price - b.price)[0];
            return o ? (
              <a href={o.url} target="_blank" rel="noopener nofollow" data-buy={r} data-buy-product={hrefOf(p)} data-buy-price={o.price} data-buy-kind="compare" className="hover:text-brand">
                <span className="font-semibold">{$(o.price)}</span> <span className="text-xs text-ink-mute">{storageLabel(o.gb)}</span>
              </a>
            ) : (
              <span className="text-ink-mute">—</span>
            );
          },
        ] as [string, (p: Phone) => React.ReactNode],
    ),
    ...(amazon ? ([["Amazon AU", (p) => <AmazonButton query={p.name} product={hrefOf(p)} placement="compare" />]] as [string, (p: Phone) => React.ReactNode][]) : []),
  ];

  return (
    <div>
      {kept.length < 4 && (
        <div className="relative mb-8 max-w-md">
          <label className="flex h-12 items-center gap-2 rounded-xl border border-line bg-bg-card px-3 shadow-sm focus-within:border-brand">
            <SearchIcon className="h-4 w-4 text-ink-mute" />
            <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocused(true)} placeholder={category ? `Add another ${category === "phones" ? "phone" : "product"} to compare…` : "Add a product to compare…"} className="w-full bg-transparent text-sm outline-none" />
          </label>
          {q && !index && (
            <div className="card absolute inset-x-0 top-14 z-20 px-3.5 py-3 text-sm text-ink-mute" role="status">Loading products…</div>
          )}
          {options.length > 0 && (
            <ul className="card absolute inset-x-0 top-14 z-20 p-1.5">
              {options.map((e) => (
                <li key={e.href}>
                  <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-bg-sunk" onClick={() => { setList([...kept, e.href]); setQ(""); }}>
                    <span className="img-tile grid h-9 w-9 place-items-center rounded-md">{e.image && <img src={e.image} alt="" className="product-img h-8 w-8 object-contain" />}</span>
                    <span className="flex-1 text-sm font-medium">{e.name}</span>
                    {e.price !== undefined && <span className="text-sm text-ink-mute">{$(e.price)}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {chosen.length === 0 && pending ? (
        <div className="card px-6 py-16 text-center" role="status" aria-busy>
          <div className="mx-auto h-5 w-48 animate-pulse rounded bg-bg-sunk" />
          <p className="mt-3 text-sm text-ink-mute">Loading your comparison…</p>
        </div>
      ) : chosen.length === 0 && failed ? (
        <div className="card px-6 py-16 text-center">
          <div className="font-display text-xl font-bold">Couldn&apos;t load these products</div>
          <p className="mt-2 text-sm text-ink-mute">Check your connection and try again.</p>
          <button className="btn-primary mt-6" onClick={retry}>Try again</button>
        </div>
      ) : chosen.length === 0 ? (
        <div className="card px-6 py-16 text-center">
          <div className="font-display text-xl font-bold">Pick up to four products</div>
          <p className="mt-2 text-sm text-ink-mute">Search above, or tap “Compare” on any product. You can compare within one category at a time.</p>
          <Link href={withRegion("/phones", region)} className="btn-primary mt-6">Browse phones</Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {(pending || failed) && (
            <div className="mb-3 text-sm text-ink-mute" role="status">
              {pending ? (
                "Loading another product…"
              ) : (
                <>Couldn&apos;t load every product. <button className="font-semibold text-brand hover:underline" onClick={retry}>Try again</button></>
              )}
            </div>
          )}
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="w-36" />
                {chosen.map((p) => (
                  <th key={hrefOf(p)} className="px-3 pb-4 text-left align-bottom font-normal">
                    <div className="relative">
                      <button onClick={() => setList(kept.filter((h) => h !== hrefOf(p)))} className="absolute right-0 top-0 z-10 grid h-7 w-7 place-items-center rounded-full bg-bg-card shadow" aria-label={`Remove ${p.name}`}>
                        <CloseIcon className="h-3.5 w-3.5" />
                      </button>
                      <Link href={hrefOf(p)} prefetch={false} className="block">
                        <div className="img-tile mb-3 aspect-square overflow-hidden rounded-2xl">{p.image && <img src={p.image} alt={p.name} className="product-img h-full w-full object-contain p-5" />}</div>
                        <div className="text-xs text-ink-mute">{p.brand}</div>
                        <div className="font-semibold">{p.model}</div>
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, cell]) => (
                <tr key={label} className="[&>*]:border-t [&>*]:border-line">
                  <th className="py-3 pr-3 text-left font-medium text-ink-mute">
                    {label in Object.fromEntries(retailers.map((r) => [RETAILERS[r].name, 1])) ? (
                      <span className="inline-flex items-center gap-2"><RetailerDot id={retailers.find((r) => RETAILERS[r].name === label)!} /> {label}</span>
                    ) : label}
                  </th>
                  {chosen.map((p) => <td key={hrefOf(p)} className="px-3 py-3">{cell(p)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {amazon && <AmazonNote className="mt-3 px-1" />}
        </div>
      )}
    </div>
  );
}

/** A product's page path, region prefix included. */
const hrefOf = (p: Phone) => withRegion(`/${p.category}/${p.slug}`, p.region ?? "au");
