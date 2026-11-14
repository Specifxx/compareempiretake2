import type { Metadata } from "next";
import { LINK_GROUPS, tagged } from "@/lib/instagram-links";

// The Instagram link-in-bio page (owner, 2026-11-08: the @riftcompare account became Compare Empire, covering every
// site). One tap to each site, tagged so its analytics shows the visit came from Instagram. Static, no prices, no
// region. noindex: it is a menu for one profile, not a page for search (/network is the indexed list).
// A site goes here only once its domain is live. KaeYoung stands alone and is never listed (DECISIONS.md).
export const metadata: Metadata = {
  title: "Compare Empire: all our price comparison sites",
  description: "Every Compare Empire price comparison site in one place.",
  alternates: { canonical: "/links" },
  robots: { index: false, follow: true },
};

export default function LinksPage() {
  return (
    <div className="container-x max-w-md pb-16 pt-6 sm:pt-10">
      <div className="text-center">
        <div className="eyebrow">Compare Empire</div>
        <h1 className="mt-2 page-title">Pay less for the same thing</h1>
        <p className="mt-2 text-ink-soft">Independent price comparison. We check store prices every day and always list the cheapest first.</p>
      </div>
      {LINK_GROUPS.map((g) => (
        <section key={g.title} className="mt-8" aria-labelledby={`links-${g.title}`}>
          <h2 id={`links-${g.title}`} className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-mute">{g.title}</h2>
          <ul className="grid gap-3">
            {g.links.map((l) => (
              <li key={l.name}>
                <a
                  href={tagged(l.url)}
                  rel="noopener"
                  className="card flex items-center gap-4 p-4 transition hover:shadow-md"
                >
                  <span aria-hidden className="h-10 w-10 shrink-0 rounded-xl" style={{ background: l.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{l.name}</span>
                    <span className="block text-sm text-ink-soft">{l.what}</span>
                  </span>
                  <span aria-hidden className="text-ink-mute">→</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="mt-10 text-center text-xs text-ink-mute">Free, no sign-up. Some links earn us a commission; it never changes the order.</p>
    </div>
  );
}
