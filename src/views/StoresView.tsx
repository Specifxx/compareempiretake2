import Link from "next/link";
import { Flag } from "@/components/Flag";
import { activeRetailers, getProducts, regionUpdatedAt } from "@/lib/catalog";
import { storeLink } from "@/lib/store-links";
import { REGIONS, type RegionId } from "@/lib/region";
import { RetailerDot } from "@/components/RetailerChip";
import { UNCOVERED } from "@/lib/uncovered-stores";
import { CATEGORIES } from "@/lib/categories";
import { storeCheckedAt } from "@/lib/catalog";
import type { CategoryId, RetailerId } from "@/lib/types";

/**
 * Every store we check in a region: how many listings each has today, how many are in stock, and when its prices
 * were last read; then the big stores we don't cover yet and why (Reddit feedback, 2026-11-07: "a public retailer
 * coverage page … an explanation of why some retailers aren't included").
 */
export function StoresView({ region }: { region: RegionId }) {
  const R = REGIONS[region];
  const counts = new Map<string, number>();
  const live = new Map<string, number>();
  for (const p of getProducts(undefined, region))
    for (const v of p.variants)
      for (const o of v.offers) {
        counts.set(o.retailer, (counts.get(o.retailer) ?? 0) + 1);
        if (o.inStock) live.set(o.retailer, (live.get(o.retailer) ?? 0) + 1);
      }
  const checked = new Map<RetailerId, string>();
  for (const c of CATEGORIES)
    for (const [r, at] of Object.entries(storeCheckedAt(c.id as CategoryId, region)) as [RetailerId, string][])
      if (!checked.has(r) || at > checked.get(r)!) checked.set(r, at);
  const stores = activeRetailers(undefined, region).sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
  const names = new Set(stores.map((s) => s.name.toLowerCase()));
  const missing = UNCOVERED[region].filter((u) => !names.has(u.name.toLowerCase()));
  const when = (iso: string) => new Date(iso).toLocaleString(R.locale, { timeZone: R.timeZone, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  return (
    <div className="container-x max-w-3xl pt-6 pb-16 sm:pt-10">
      <div className="eyebrow"><Flag code={R.id} /> {R.name}</div>
      <h1 className="mt-2 page-title">The {stores.length} {R.adjective} stores we check</h1>
      <p className="page-lede">
        Every price comes from the store&apos;s own website or product feed, checked daily. {R.taxNote}. No store pays to be listed or to rank higher.
        Prices last imported {when(regionUpdatedAt(region))} ({R.timeZone.split("/")[1].replace(/_/g, " ")} time).
      </p>
      <ul className="card mt-6 divide-y divide-line overflow-hidden sm:mt-8">
        {stores.map((r) => (
          <li key={r.id}>
            <a href={storeLink(`https://www.${r.site.replace(/^www\./, "")}`, "stores").href} target="_blank" rel={storeLink(`https://www.${r.site.replace(/^www\./, "")}`, "stores").rel} className="flex min-h-[3rem] items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-bg-sunk sm:px-5 sm:py-3.5">
              <span className="inline-flex min-w-0 items-center gap-2 font-medium"><RetailerDot id={r.id} /> {r.name}</span>
              <span className="shrink-0 text-right text-xs tabular-nums text-ink-mute sm:text-sm">
                {(counts.get(r.id) ?? 0).toLocaleString()} listings · {(live.get(r.id) ?? 0).toLocaleString()} in stock
                {checked.get(r.id) && <span className="block text-[11px]">Checked {when(checked.get(r.id)!)}</span>}
              </span>
            </a>
          </li>
        ))}
      </ul>

      {missing.length > 0 && (
        <section className="mt-12">
          <h2 className="section-title">Big stores we don&apos;t cover yet</h2>
          <p className="mt-2 text-sm text-ink-soft">
            We&apos;d rather tell you than leave you guessing. These stores aren&apos;t in our comparisons today, so check them too before you buy.
          </p>
          <ul className="card mt-4 divide-y divide-line">
            {missing.map((u) => (
              <li key={u.name} className="px-5 py-3.5 text-sm">
                <b>{u.name}</b>
                <span className="block text-ink-mute">{u.why} {u.next}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12 text-sm text-ink-soft">
        <h2 className="section-title text-ink">Missing a store?</h2>
        <p className="mt-2">
          Tell us and we&apos;ll check it: <Link prefetch={false} href="/contact#suggest" className="font-semibold text-brand hover:underline">suggest a store</Link>. Run one?{" "}
          <Link prefetch={false} href="/list-your-store" className="font-semibold text-brand hover:underline">List your store</Link> for free. See{" "}
          <Link prefetch={false} href="/how-we-pick-stores" className="font-semibold text-brand hover:underline">how we pick stores</Link>.
        </p>
      </section>
    </div>
  );
}
