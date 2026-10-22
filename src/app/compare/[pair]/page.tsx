import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideBody } from "@/components/GuideBody";
import { getVsPairs } from "@/lib/catalog";
import { storageLabel } from "@/lib/normalize";
import type { Phone } from "@/lib/types";

export const dynamicParams = false;
export const generateStaticParams = () => getVsPairs().map((p) => ({ pair: p.slug }));
const find = (slug: string) => getVsPairs().find((p) => p.slug === slug);

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const p = find((await params).pair);
  if (!p) return {};
  const title = `${p.a.name} vs ${p.b.name}: price & specs in Australia`;
  return {
    title,
    description: `${p.a.name} (from $${p.a.bestPrice.toLocaleString("en-AU")}) vs ${p.b.name} (from $${p.b.bestPrice.toLocaleString("en-AU")}): today's prices at every Australian store, storage, screen, camera and battery side by side.`,
    alternates: { canonical: `/compare/${p.slug}` },
  };
}

export default async function VsPage({ params }: { params: Promise<{ pair: string }> }) {
  const p = find((await params).pair);
  if (!p) notFound();
  const { a, b } = p;
  const [cheap, dear] = a.bestPrice <= b.bestPrice ? [a, b] : [b, a];
  const gap = dear.bestPrice - cheap.bestPrice;
  const facts = verdict(a, b);
  const related = getVsPairs().filter((x) => x.slug !== p.slug && (x.a.slug === a.slug || x.b.slug === a.slug || x.a.slug === b.slug || x.b.slug === b.slug)).slice(0, 6);
  const rows: [string, (x: Phone) => string][] = [
    ["Lowest price today", (x) => `$${x.bestPrice.toLocaleString("en-AU")}`],
    ["Storage", (x) => x.variants.map((v) => storageLabel(v.storageGb)).join(" · ")],
    ["Screen", (x) => (x.specs.screenInches ? `${x.specs.screenInches}"` : "—")],
    ["Chip", (x) => x.specs.chip ?? "—"],
    ["Main camera", (x) => (x.specs.mainCameraMp ? `${x.specs.mainCameraMp}MP` : "—")],
    ["Battery", (x) => (x.specs.batteryMah ? `${x.specs.batteryMah.toLocaleString()} mAh` : "—")],
    ["Foldable", (x) => (x.specs.foldable ? "Yes" : "No")],
    ["Stores selling it", (x) => String(x.retailerCount)],
  ];
  return (
    <div className="container-x max-w-4xl pt-10">
      <nav className="mb-6 text-sm text-ink-mute"><Link href="/compare" className="hover:text-ink">Compare</Link> / <span className="text-ink">{a.model} vs {b.model}</span></nav>
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{a.name} vs {b.name}</h1>
      <p className="mt-3 text-lg text-ink-soft">
        Today the <b className="text-ink">{cheap.name}</b> is{" "}
        {gap > 0 ? <><b className="text-save">${gap.toLocaleString("en-AU")} cheaper</b> at its lowest price</> : "the same price"}{" "}
        ({`$${cheap.bestPrice.toLocaleString("en-AU")}`} vs ${dear.bestPrice.toLocaleString("en-AU")}).
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4">
        {[a, b].map((x) => (
          <Link key={x.slug} href={`/${x.category}/${x.slug}`} className="card group overflow-hidden text-center transition hover:shadow-lift">
            <div className="img-tile aspect-square">{x.image && <img src={x.image} alt={x.name} className="product-img h-full w-full object-contain p-6" />}</div>
            <div className="p-4">
              <div className="text-xs text-ink-mute">{x.brand}</div>
              <div className="font-semibold">{x.model}</div>
              <div className="price mt-1 text-xl">${x.bestPrice.toLocaleString("en-AU")}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card mt-8 overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([label, f]) => (
              <tr key={label} className="border-b border-line last:border-0">
                <th className="w-1/3 px-4 py-3 text-left font-medium text-ink-mute">{label}</th>
                <td className="px-4 py-3 font-medium">{f(a)}</td>
                <td className="px-4 py-3 font-medium">{f(b)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-12 font-display text-2xl font-extrabold tracking-tight">Price at every store</h2>
      <GuideBody body={`[[compare:${a.slug},${b.slug}]]`} />

      {facts.length > 0 && (
        <>
          <h2 className="mt-12 font-display text-2xl font-extrabold tracking-tight">The short version</h2>
          <ul className="prose-ce mt-4">{facts.map((f) => <li key={f} dangerouslySetInnerHTML={{ __html: f }} />)}</ul>
        </>
      )}

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 font-display text-xl font-bold">Related comparisons</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((r) => <Link key={r.slug} href={`/compare/${r.slug}`} className="chip">{r.a.model} vs {r.b.model}</Link>)}
          </div>
        </section>
      )}
    </div>
  );
}

/** Plain statements that follow from the data — no invented opinions. */
function verdict(a: Phone, b: Phone): string[] {
  const out: string[] = [];
  const s = (x: Phone) => `<b>${x.model}</b>`;
  const [cheap, dear] = a.bestPrice <= b.bestPrice ? [a, b] : [b, a];
  if (dear.bestPrice > cheap.bestPrice) out.push(`${s(cheap)} costs less today: $${cheap.bestPrice.toLocaleString("en-AU")} vs $${dear.bestPrice.toLocaleString("en-AU")}.`);
  const sa = a.specs.screenInches, sb = b.specs.screenInches;
  if (sa && sb && Math.abs(sa - sb) >= 0.2) out.push(`${s(sa > sb ? a : b)} has the bigger screen (${Math.max(sa, sb)}" vs ${Math.min(sa, sb)}").`);
  const ma = Math.max(...a.variants.map((v) => v.storageGb)), mb = Math.max(...b.variants.map((v) => v.storageGb));
  if (ma !== mb) out.push(`${s(ma > mb ? a : b)} comes with more storage — up to ${storageLabel(Math.max(ma, mb))}.`);
  const ba = a.specs.batteryMah, bb = b.specs.batteryMah;
  if (ba && bb && Math.abs(ba - bb) >= 300) out.push(`${s(ba > bb ? a : b)} has the larger battery (${Math.max(ba, bb).toLocaleString()} mAh).`);
  if (a.retailerCount !== b.retailerCount) out.push(`${s(a.retailerCount > b.retailerCount ? a : b)} is sold by more stores, so it's easier to find on sale.`);
  if (a.specs.foldable !== b.specs.foldable) out.push(`${s(a.specs.foldable ? a : b)} is a foldable.`);
  return out;
}
