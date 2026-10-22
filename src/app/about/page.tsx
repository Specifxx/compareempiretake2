import type { Metadata } from "next";
import { RetailerDot } from "@/components/RetailerChip";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "About Compare Empire — how we compare prices",
  description: "Compare Empire is an independent Australian price comparison site. Here's how we collect prices, rank stores and keep it honest.",
  alternates: { canonical: "/about" },
};

const CONTACT = "hello@compareempire.com";

export default function AboutPage() {
  const { retailers, phones, updatedAt } = getCatalog();
  const counts = new Map<string, number>();
  phones.forEach((p) => p.variants.forEach((v) => v.offers.forEach((o) => counts.set(o.retailer, (counts.get(o.retailer) ?? 0) + 1))));
  return (
    <div className="container-x max-w-3xl pt-12">
      <div className="eyebrow">About</div>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">One price comparison site, done properly.</h1>
      <p className="mt-5 text-lg text-ink-soft">
        Buying a phone in Australia means opening five tabs, decoding five naming schemes and still wondering if you missed a sale. Compare Empire does that
        legwork every day and puts the answer on one page. We&apos;re starting with phones and growing from there.
      </p>

      <Section title="Our promises">
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            ["The cheapest price is first", "Rankings are by price and stock. No retailer can pay to move up."],
            ["Real prices only", "Every price comes from the retailer's own website, checked daily. If we can't see it, we don't show it."],
            ["Like-for-like", "We match the exact model and storage size, so a 128GB price never hides behind a 512GB one."],
            ["No dark patterns", "No pop-ups, no sign-up walls, no fake countdowns. Saved phones stay in your browser."],
          ].map(([t, s]) => (
            <li key={t} className="card p-5">
              <div className="font-semibold">{t}</div>
              <p className="mt-1 text-sm text-ink-soft">{s}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="How it works" id="how">
        <ol className="space-y-4 text-ink-soft">
          <li><b className="text-ink">1. We visit every store.</b> Each morning our scrapers read the public phone listings of every retailer below.</li>
          <li><b className="text-ink">2. We match the phones.</b> “Apple iPhone 17 Pro 256GB (Deep Blue)” at one shop and “iPhone 17 Pro 256GB - Deep Blue” at another are the same phone — we line them up by brand, model and storage.</li>
          <li><b className="text-ink">3. We drop the noise.</b> Refurbished, carrier-locked and bundle listings are left out so you&apos;re comparing new, unlocked phones.</li>
          <li><b className="text-ink">4. We keep the history.</b> Every day&apos;s best price is stored, so a “sale” that&apos;s really last month&apos;s price shows up for what it is.</li>
        </ol>
      </Section>

      <Section title="Retailers we check" id="retailers">
        <div className="card divide-y divide-line">
          {retailers.map((r) => (
            <a key={r.id} href={`https://www.${r.site}`} target="_blank" rel="noopener nofollow" className="flex items-center justify-between px-5 py-4 hover:bg-bg-sunk">
              <span className="inline-flex items-center gap-3 font-medium"><RetailerDot id={r.id} className="h-3 w-3" /> {r.name}</span>
              <span className="text-sm text-ink-mute">{counts.get(r.id) ?? 0} listings</span>
            </a>
          ))}
        </div>
        <p className="mt-3 text-sm text-ink-mute">
          Last checked {new Date(updatedAt).toLocaleString("en-AU", { timeZone: "Australia/Sydney", dateStyle: "full", timeStyle: "short" })} (Sydney time).
        </p>
      </Section>

      <Section title="How we make money" id="money">
        <p className="text-ink-soft">
          Right now, we don&apos;t. When we do, it will be through affiliate links and clearly-labelled ads — and neither will ever change the order of prices.
          If a store pays us, you&apos;ll still see the cheapest one first.
        </p>
      </Section>

      <Section title="Help us build it" id="feedback">
        <p className="text-ink-soft">
          Missing a store? Spotted a wrong price or a phone we&apos;ve mismatched? Want a category after phones? We read everything.
        </p>
        <a className="btn-primary mt-5" href={`mailto:${CONTACT}?subject=Compare%20Empire%20feedback`}>Email {CONTACT}</a>
      </Section>
    </div>
  );
}

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-14 scroll-mt-24">
      <h2 className="mb-5 font-display text-2xl font-extrabold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
