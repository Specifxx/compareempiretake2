import type { Metadata } from "next";
import Link from "next/link";
import { activeCategories, categoryHref, getProducts, liveRegions, regionUpdatedAt } from "@/lib/catalog";
import { REGIONS } from "@/lib/region";
import { SITE, SITE_NAME } from "@/lib/site";
import { categoryReport, pctText, type CategoryReport } from "@/lib/price-report";

// The self-updating monthly price report (DECISIONS.md, "Self-updating price report", 2026-11-02): built with each
// deploy from that day's catalogue (no ISR anywhere on this site), one URL kept for good. A neutral page.
const month = () => new Date(regionUpdatedAt("us") || Date.now()).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

export function generateMetadata(): Metadata {
  return {
    title: `Tech price report, ${month()}: where shopping around pays`,
    description: "How much the same phone, TV, laptop or pair of headphones costs from store to store this month in the US, the UK and Australia, category by category. Free to cite.",
    alternates: { canonical: "/price-report" },
  };
}

const ROWS: [string, (x: CategoryReport) => string][] = [
  ["Stores in stock", (x) => String(x.stores)],
  ["Products priced", (x) => x.priced.toLocaleString("en-US")],
  ["Shopping around saves 10%+", (x) => pctText(x.gap10)],
  ["Median gap, cheapest vs dearest", (x) => pctText(x.medianGap)],
];

export default function PriceReport() {
  const regions = liveRegions().sort((a, b) => ["us", "uk", "au"].indexOf(a) - ["us", "uk", "au"].indexOf(b));
  const cats = activeCategories("us").length ? activeCategories("us") : activeCategories("au");
  const at = regionUpdatedAt("us");
  const asOf = at ? new Date(at).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : null;
  const all = Object.fromEntries(regions.map((r) => [r, categoryReport(getProducts(undefined, r))]));
  const citation = `${SITE_NAME}, "Tech price report, ${month()}", ${SITE}/price-report`;
  return (
    <div className="container-x max-w-4xl pt-12 pb-16">
      <div className="eyebrow">Updated with every day&apos;s prices</div>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Tech price report, {month()}</h1>
      <p className="mt-5 text-lg text-ink-soft">
        The same model, matched across the stores we check in the US, the UK and Australia: how far apart the cheapest and the dearest store are,
        category by category.{asOf ? ` Last updated ${asOf}.` : ""} Free to quote with a link.
      </p>

      <section className="card mt-8 overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs uppercase text-ink-soft">
            <tr><th className="px-4 py-3">All categories</th>{regions.map((r) => <th key={r} className="px-4 py-3 text-right">{REGIONS[r].name}</th>)}</tr>
          </thead>
          <tbody>
            {ROWS.map(([label, f]) => (
              <tr key={label} className="border-t border-line">
                <td className="px-4 py-2">{label}</td>
                {regions.map((r) => <td key={r} className="px-4 py-2 text-right tabular-nums">{f(all[r])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <h2 className="mt-10 font-display text-2xl font-bold">Where shopping around pays, by category</h2>
      <p className="mt-1 text-sm text-ink-soft">For products two or more stores sell in stock: the share where the cheapest store is at least 10% under the dearest, for the same model and size. Many products sell at the same list price everywhere, so this, not the average, is where comparing earns its keep.</p>
      <section className="card mt-4 overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs uppercase text-ink-soft">
            <tr><th className="px-4 py-3">Category</th>{regions.map((r) => <th key={r} className="px-4 py-3 text-right">{REGIONS[r].flag} {r.toUpperCase()}</th>)}</tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id} className="border-t border-line">
                <td className="px-4 py-2"><Link className="underline" href={categoryHref(c.id, "us")}>{c.name}</Link></td>
                {regions.map((r) => {
                  const x = categoryReport(getProducts(c.id, r));
                  return <td key={r} className="px-4 py-2 text-right tabular-nums">{x.compared >= 3 ? pctText(x.gap10) : "—"}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="mt-2 text-xs text-ink-soft">A dash: fewer than three products to compare there. Outright prices only (no plans), in stock, in each country&apos;s own currency, before delivery.</p>

      <section className="card mt-10 p-5">
        <h2 className="font-semibold">Quote this report</h2>
        <p className="mt-1 text-sm text-ink-soft">You&apos;re welcome to use any number here in an article, video or post, with a link to this page. It updates itself, so the link stays current.</p>
        <p className="mt-3 rounded-lg bg-slate-100 p-2 font-mono text-xs text-slate-800">{citation}</p>
        <p className="mt-3 text-sm"><Link className="underline" href="/embed">Free price widgets for your site →</Link></p>
      </section>
    </div>
  );
}
