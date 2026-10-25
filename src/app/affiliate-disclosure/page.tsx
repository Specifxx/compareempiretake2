import type { Metadata } from "next";
import Link from "next/link";
import { AMAZON_DISCLOSURE } from "@/lib/amazon";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Affiliate disclosure — Compare Empire",
  description: "Compare Empire earns from some links, including as an Amazon Associate. Here is which links, and what they never change.",
  alternates: { canonical: "/affiliate-disclosure" },
};

export default function AffiliateDisclosurePage() {
  return (
    <div className="container-x max-w-3xl pt-12 pb-16">
      <div className="eyebrow">Affiliate disclosure</div>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Affiliate disclosure</h1>
      <div className="mt-8 space-y-6 text-ink-soft [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink">
        <p className="rounded-2xl border border-line bg-bg-card p-5 font-semibold text-ink">{AMAZON_DISCLOSURE}</p>
        <h2>Amazon</h2>
        <p>
          Compare Empire is a participant in the Amazon Services LLC Associates Program for Amazon Australia (amazon.com.au). Links marked
          &quot;Check price on Amazon&quot; go straight to amazon.com.au with our tracking tag. If you buy something after clicking one, Amazon may
          pay us a commission. You pay the same price.
        </p>
        <p>
          We don&apos;t show Amazon&apos;s prices, ratings or stock on our pages. Amazon changes them often, so check the price on Amazon
          before you buy.
        </p>
        <h2>eBay and other stores</h2>
        <p>
          Links to eBay are part of the eBay Partner Network and may also earn us a commission. Links to every other store are ordinary links
          unless we say otherwise here.
        </p>
        <h2>What affiliate links never change</h2>
        <p>
          Store prices are ranked cheapest first using each store&apos;s own price, checked daily. Amazon and eBay are shown separately and
          labelled, and no store can pay to rank higher. See <Link href="/disclosure" className="underline">how we make money</Link>.
        </p>
        <h2>Questions</h2>
        <p>
          Email <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </div>
    </div>
  );
}
