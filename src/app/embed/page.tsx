import type { Metadata } from "next";
import Link from "next/link";
import { activeCategories, categoryHref, getProducts, productHref } from "@/lib/catalog";
import { SITE, SITE_NAME } from "@/lib/site";
import { embedSnippet, textBadge } from "@/lib/embed";

// The free widgets directory (DECISIONS.md, "Free price widgets", 2026-11-02): what outreach points at instead of
// asking for a link. Built with the deploy like every hub page. Code only, never live iframes of our own widgets.
export const metadata: Metadata = {
  title: "Free Price Comparison Widgets for Tech Reviews",
  description: "A live price badge for phone, TV, laptop and headphone reviews: the cheapest price across US, UK and Australian stores, updated daily. One line of HTML, free, no signup.",
  alternates: { canonical: "/embed" },
};

export default function EmbedPage() {
  // A real US product most stores sell, so an unedited snippet shows a working badge.
  const example = [...getProducts(undefined, "us")].sort((a, b) => b.retailerCount - a.retailerCount)[0];
  const path = example ? productHref(example) : "/us/phones/PRODUCT";
  const snippet = embedSnippet(SITE, SITE_NAME, path, example?.name ?? "PRODUCT NAME");
  const cats = activeCategories("us").slice(0, 3);
  const badges = cats.map((c) => textBadge(SITE, SITE_NAME, categoryHref(c.id, "us"), c.name));
  return (
    <div className="container-x max-w-3xl pt-12 pb-16">
      <div className="eyebrow">Free widgets</div>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Free price widgets for reviews and guides</h1>
      <p className="mt-5 text-lg text-ink-soft">
        Put a live price on any review, buying guide or forum post with one line of HTML. It shows the cheapest price across the stores we check in
        the US, the UK or Australia, and updates itself every day. Free, no signup, no script and no tracking. The widget is noindex, so it never
        competes with your own page in search.
      </p>

      <section className="card mt-8 p-5">
        <h2 className="text-lg font-bold">Product price badge</h2>
        <p className="mt-1 text-sm text-ink-soft">
          One under each product you review. <Link className="underline" href={`/embed/price?p=${path}`} prefetch={false}>See it running →</Link>
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-800"><code>{snippet}</code></pre>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-soft">
          <li>Change <code>{path}</code> (in both places) to the address of any product page on {SITE_NAME}, without the domain.</li>
          <li>The address picks the country: <code>/us/…</code> for the US, <code>/uk/…</code> for the UK, no prefix for Australia.</li>
          <li>The plain link under the widget is optional; it is the part that tells search engines where the price comes from.</li>
        </ul>
      </section>

      <section className="card mt-6 p-5">
        <h2 className="text-lg font-bold">Plain text badge</h2>
        <p className="mt-1 text-sm text-ink-soft">No iframe at all: a small link to a category&apos;s price comparison, for a sidebar or a resources page. Swap the category for any of ours.</p>
        <div className="mt-3 flex flex-wrap gap-2">{badges.map((b, i) => <div key={i} dangerouslySetInnerHTML={{ __html: b }} />)}</div>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-800"><code>{badges[0] ?? ""}</code></pre>
      </section>
    </div>
  );
}
