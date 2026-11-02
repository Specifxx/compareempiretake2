import type { Metadata } from "next";
import Link from "next/link";
import { CLUSTER_NAMES, FAMILY_SITES, type ClusterId } from "@/lib/family-network";

// The Compare Empire network page (DECISIONS.md "Sites that grow each other", 2026-11-02): the one page
// every sister site's footer links ("A Compare Empire site"), listing every site once, grouped the way
// the sites link each other. Static; no region, no prices.
export const metadata: Metadata = {
  title: "The Compare Empire sites: independent price comparison",
  description: "Every Compare Empire price comparison site in one place: card games, hobby and tech. Independent, free, and the cheapest price always first.",
  alternates: { canonical: "/network" },
};

const ORDER: ClusterId[] = ["cards", "hobby", "tech"];
const INTRO: Record<ClusterId, string> = {
  cards: "Booster boxes, sealed product and singles, compared across independent card stores.",
  hobby: "Miniatures, anime figures and Gunpla kits, matched across hobby shops by their barcodes and product codes.",
  tech: "Phones, cameras, laptops, TVs and home appliances, compared across retailers.",
};

export default function NetworkPage() {
  return (
    <div className="container-x max-w-3xl pt-12">
      <div className="eyebrow">Our sites</div>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">The Compare Empire sites</h1>
      <p className="mt-4 text-lg text-ink-soft">
        Each site compares one kind of product across independent stores, checks prices every day, and always lists the cheapest price first. No store
        pays to rank higher. They are free to use and need no account.
      </p>
      {ORDER.map((c) => (
        <section key={c} className="mt-10" aria-labelledby={`network-${c}`}>
          <h2 id={`network-${c}`} className="font-display text-2xl font-extrabold tracking-tight">{CLUSTER_NAMES[c]}</h2>
          <p className="mt-1 text-sm text-ink-mute">{INTRO[c]}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {FAMILY_SITES.filter((s) => s.clusters[0] === c || (c === "hobby" && s.clusters.includes("hobby"))).map((s) => (
              <li key={`${c}-${s.id}`} className="card p-4">
                {s.id === "empire" ? (
                  <Link href="/" className="font-semibold hover:underline">{s.name}</Link>
                ) : (
                  <a href={c === "hobby" && s.id === "gundam" ? `${s.url}/kits` : s.url} rel="noopener" className="font-semibold hover:underline">{s.name}</a>
                )}
                <div className="text-sm text-ink-soft">{c === "hobby" && s.id === "gundam" ? "Gunpla model kit prices" : s.label}</div>
                {s.report && c === s.clusters[0] ? (
                  <a href={`${s.url}${s.report}`} rel="noopener" className="mt-1 inline-block text-xs text-ink-mute hover:text-ink">Monthly price report →</a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
