import type { Metadata } from "next";
import Link from "next/link";
import { LinkChecker } from "@/components/LinkChecker";

// /is-this-a-good-price (2026-11-08): paste a store link, see how its price compares with every store we read in that store's
// country. A neutral page (lib/region.ts), prerendered with the deploy; the checker is a client island that fetches the store's
// static /check/<host> file. The copy and FAQ are in the HTML.
export const metadata: Metadata = {
  title: "Is this a good price? Paste a store link to check",
  description: "Paste a store's link to a phone, TV, laptop or appliance and see if it's a good price against every store Compare Empire reads in the US, UK, Australia, Canada and Singapore. Free, no sign-up.",
  alternates: { canonical: "/is-this-a-good-price" },
};

const STEPS = [
  "Copy the address of the store's product page (in a phone browser: Share, then Copy).",
  "Paste it into the box. The checker looks it up straight away.",
  "Read the verdict and the cheapest and median in-stock prices beside it.",
  "If the page shows a different price now, type it to check again.",
];

const FAQ = [
  { q: "Which links does it work with?", a: "Product pages at any store Compare Empire reads, in any country we cover: it compares the price with the other stores in that store's country, for the same model and storage. For Amazon, eBay, marketplaces and stores we don't read, it shows the products the link's words match." },
  { q: "Do you open the page I paste?", a: "No. The checker only reads the store's address and the product's part of the link, then looks it up in the listings we already read from that store every day." },
  { q: "Why is the store's price different from the page?", a: "We read each store once a day, so a price can change in between. Type the price the page shows now and the verdict updates." },
  { q: "What counts as a good price?", a: "The cheapest in-stock store price we found, or within 1% of it. Under the median (the middle in-stock store price) is fair; about the median is typical; above it, you can usually pay less elsewhere. Carrier plans, Amazon and eBay are not counted as stores here." },
  { q: "Does it include delivery?", a: "No. Every price is the store's own price before delivery, the way the rest of the site compares them." },
];

export default function Page() {
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  return (
    <div className="container-x max-w-3xl pt-6 sm:pt-10 pb-16">
      <div className="eyebrow">Free price checker</div>
      <h1 className="mt-2 page-title">Is this a good price?</h1>
      <p className="mt-3 text-ink-soft">
        Paste the link to a phone, TV, laptop or appliance at any store and see how its price compares with the cheapest and the typical in-stock price at every other store we read.
      </p>
      <LinkChecker />
      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold">How to use it</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-ink-soft">
          {STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>
      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold">Questions</h2>
        <dl className="mt-3 space-y-4">
          {FAQ.map((f) => (
            <div key={f.q}>
              <dt className="font-semibold">{f.q}</dt>
              <dd className="mt-1 text-ink-soft">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
      <p className="mt-8 text-sm text-ink-mute">
        Where does shopping around pay most? <Link href="/price-report" prefetch={false} className="font-semibold text-brand hover:underline">This month’s price report</Link>.
      </p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    </div>
  );
}
