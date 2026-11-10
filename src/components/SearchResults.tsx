"use client";
import { track } from "@vercel/analytics";
import { useEffect, useState } from "react";
import { useRegionKit } from "@/lib/use-region";
import { Currency } from "./RegionTag";
import { SPONSORED_REL } from "@/lib/ebay";

/**
 * The /search results (DECISIONS.md 2026-11-10): reads ?q= in the browser, asks /api/search (CDN-cached six hours per
 * query and region) and lists Compare Empire's products, then the sister sites' products, then a labelled eBay search.
 * The page itself is one static file; nothing here is in its HTML, and it is noindex.
 */
interface Own { name: string; category?: string; url: string; path: string; image?: string; price: number; stores: number; inStock: boolean }
interface Fam { siteName: string; topic: string; name: string; url: string; price: number; currency: string }
interface Answer { query: string; products: Own[]; family: Fam[]; ebay: { url: string; label: string } }

const QUERY_MAX = 80;
const norm = (q: string) => q.replace(/\s+/g, " ").trim().toLowerCase().slice(0, QUERY_MAX);

function fmt(n: number, currency: string) {
  const whole = Math.abs(n - Math.round(n)) < 0.005;
  return new Intl.NumberFormat("en", { style: "currency", currency, currencyDisplay: "narrowSymbol", minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(n);
}

export function SearchResults() {
  const { $, region } = useRegionKit();
  const [q, setQ] = useState<string | null>(null);
  const [state, setState] = useState<{ status: "idle" | "loading" | "done" | "error"; data?: Answer }>({ status: "idle" });

  useEffect(() => {
    setQ(norm(new URLSearchParams(location.search).get("q") ?? ""));
  }, []);

  useEffect(() => {
    if (q === null || q.length < 2) return;
    let live = true;
    setState({ status: "loading" });
    fetch(`/api/search?q=${encodeURIComponent(q)}&r=${region}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Answer) => {
        if (!live) return;
        setState({ status: "done", data });
        const results = data.products.length + data.family.length;
        // The 4-week test (owner, 2026-11-10): searches, and the words of searches nothing answered (the list of what
        // to add next). The query text only, nothing about the visitor.
        track("search", results ? { region, results } : { region, results: 0, q: q.slice(0, 50) });
      })
      .catch(() => live && setState({ status: "error" }));
    return () => {
      live = false;
    };
  }, [q, region]);

  if (q === null) return null;
  if (q.length < 2) return <p className="mt-6 text-ink-soft">Type at least two letters in the search box above.</p>;
  if (state.status === "loading" || state.status === "idle") return <p className="mt-6 text-ink-mute">Searching every Compare Empire site for “{q}”…</p>;
  if (state.status === "error" || !state.data) return <p className="mt-6 text-ink-soft">Search didn’t answer just now. Try again in a minute.</p>;
  const d = state.data;
  const none = !d.products.length && !d.family.length;
  return (
    <div className="mt-6 space-y-10">
      {none && <p className="text-ink-soft">Nothing on our sites matches “{d.query}” yet. Try a brand or a model number, or see eBay’s listings below.</p>}
      {d.products.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold">Tech and appliances</h2>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-bg-card">
            {d.products.map((p, i) => (
              <li key={p.path}>
                <a href={p.path} onClick={() => track("search_click", { to: "ce", rank: i + 1 })} className="flex items-center gap-3 px-4 py-3 hover:bg-bg-sunk">
                  <span className="img-tile grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg">
                    {p.image && <img src={p.image} alt={p.name} className="product-img h-11 w-11 object-contain" loading="lazy" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="block text-xs text-ink-mute">
                      {p.category ? `${p.category} · ` : ""}
                      {p.stores} {p.stores === 1 ? "store" : "stores"} compared{p.inStock ? "" : " · out of stock"}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[10px] text-ink-mute">from</span>
                    <span className="price text-sm">{$(p.price)}<Currency region={region} /></span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      {d.family.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold">On our sister sites</h2>
          <p className="mt-1 text-sm text-ink-mute">Cards, sealed product, figures and wargames, each compared across stores on its own site.</p>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-bg-card">
            {d.family.map((f, i) => (
              <li key={f.url}>
                <a href={f.url} onClick={() => track("search_click", { to: "family", site: f.siteName, rank: i + 1 })} className="flex items-center gap-3 px-4 py-3 hover:bg-bg-sunk">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{f.name}</span>
                    <span className="block text-xs text-ink-mute">{f.siteName} · {f.topic}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[10px] text-ink-mute">from</span>
                    <span className="price text-sm">{fmt(f.price, f.currency)} <span className="text-[10px] text-ink-mute">{f.currency}</span></span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <a
          href={d.ebay.url}
          target="_blank"
          rel={SPONSORED_REL}
          data-buy="ebay"
          data-buy-kind="ebay-search"
          data-buy-product={`search:${d.query.slice(0, 50)}`}
          className="card flex items-center justify-between gap-3 p-4 hover:border-brand/40"
        >
          <span>
            <span className="block font-medium">{d.ebay.label}</span>
            <span className="block text-xs text-ink-mute">New, Buy It Now. Ad · Paid link</span>
          </span>
          <span className="text-sm font-semibold text-brand">eBay →</span>
        </a>
      </section>
    </div>
  );
}
