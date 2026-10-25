"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { storageLabel } from "@/lib/normalize";
import { RETAILERS } from "@/lib/retailers";
import { search } from "@/lib/search";
import { compare } from "@/lib/store";
import type { Phone, RetailerId } from "@/lib/types";
import { CloseIcon, SearchIcon } from "./icons";
import { RetailerDot } from "./RetailerChip";
import { AmazonButton, AmazonNote } from "./AmazonLink";

export function CompareView({ phones }: { phones: Phone[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const tray = compare.use();
  const fromUrl = params.get("p")?.split(",").filter(Boolean);
  const slugs = (fromUrl?.length ? fromUrl : tray).slice(0, 4);
  const byHref = (s: string) => phones.find((p) => `/${p.category}/${p.slug}` === (s.startsWith("/") ? s : `/phones/${s}`));
  const chosen = slugs.map(byHref).filter(Boolean) as Phone[];
  const category = chosen[0]?.category;
  const [q, setQ] = useState("");

  // Keep the tray and the URL in step so a shared link opens the same comparison.
  useEffect(() => {
    if (fromUrl?.length && fromUrl.join() !== tray.join()) {
      compare.clear();
      fromUrl.slice(0, 4).forEach((s) => compare.toggle(s));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  const setList = (list: string[]) => {
    compare.clear();
    list.forEach((s) => compare.toggle(s));
    router.replace(list.length ? `/compare?p=${list.join(",")}` : "/compare", { scroll: false });
  };

  const options = useMemo(
    () => (q ? search(category ? phones.filter((p) => p.category === category) : phones, q, 6) : []).filter((p) => !chosen.includes(p)),
    [q, phones, chosen, category],
  );
  const sells = (p: Phone, r: RetailerId) => p.variants.some((v) => v.offers.some((o) => o.retailer === r && o.kind !== "plan"));
  const retailers = (Object.keys(RETAILERS) as RetailerId[]).filter((r) => chosen.some((p) => sells(p, r)));
  const cheapest = chosen.length > 1 ? Math.min(...chosen.map((p) => p.bestPrice)) : undefined;

  const rows: [string, (p: Phone) => React.ReactNode][] = [
    ["Best price", (p) => <span className={`price text-xl ${p.bestPrice === cheapest ? "text-save" : ""}`}>${p.bestPrice.toLocaleString("en-AU")}</span>],
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
              <a href={o.url} target="_blank" rel="noopener nofollow" data-buy={r} data-buy-product={`/${p.category}/${p.slug}`} data-buy-price={o.price} data-buy-kind="compare" className="hover:text-brand">
                <span className="font-semibold">${o.price.toLocaleString("en-AU")}</span> <span className="text-xs text-ink-mute">{storageLabel(o.gb)}</span>
              </a>
            ) : (
              <span className="text-ink-mute">—</span>
            );
          },
        ] as [string, (p: Phone) => React.ReactNode],
    ),
    ["Amazon AU", (p) => <AmazonButton query={p.name} product={`/${p.category}/${p.slug}`} placement="compare" />],
  ];

  return (
    <div>
      {chosen.length < 4 && (
        <div className="relative mb-8 max-w-md">
          <label className="flex h-12 items-center gap-2 rounded-xl border border-line bg-bg-card px-3 shadow-sm focus-within:border-brand">
            <SearchIcon className="h-4 w-4 text-ink-mute" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={category ? `Add another ${category === "phones" ? "phone" : "product"} to compare…` : "Add a product to compare…"} className="w-full bg-transparent text-sm outline-none" />
          </label>
          {options.length > 0 && (
            <ul className="card absolute inset-x-0 top-14 z-20 p-1.5">
              {options.map((p) => (
                <li key={`${p.category}/${p.slug}`}>
                  <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-bg-sunk" onClick={() => { setList([...chosen.map((c) => `/${c.category}/${c.slug}`), `/${p.category}/${p.slug}`]); setQ(""); }}>
                    <span className="img-tile grid h-9 w-9 place-items-center rounded-md">{p.image && <img src={p.image} alt="" className="product-img h-8 w-8 object-contain" />}</span>
                    <span className="flex-1 text-sm font-medium">{p.name}</span>
                    <span className="text-sm text-ink-mute">${p.bestPrice.toLocaleString("en-AU")}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {chosen.length === 0 ? (
        <div className="card px-6 py-16 text-center">
          <div className="font-display text-xl font-bold">Pick up to four products</div>
          <p className="mt-2 text-sm text-ink-mute">Search above, or tap “Compare” on any product. You can compare within one category at a time.</p>
          <Link href="/phones" className="btn-primary mt-6">Browse phones</Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="w-36" />
                {chosen.map((p) => (
                  <th key={p.slug} className="px-3 pb-4 text-left align-bottom font-normal">
                    <div className="relative">
                      <button onClick={() => setList(chosen.filter((c) => c !== p).map((c) => `/${c.category}/${c.slug}`))} className="absolute right-0 top-0 z-10 grid h-7 w-7 place-items-center rounded-full bg-bg-card shadow" aria-label={`Remove ${p.name}`}>
                        <CloseIcon className="h-3.5 w-3.5" />
                      </button>
                      <Link href={`/${p.category}/${p.slug}`} className="block">
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
                  {chosen.map((p) => <td key={p.slug} className="px-3 py-3">{cell(p)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <AmazonNote className="mt-3 px-1" />
        </div>
      )}
    </div>
  );
}
