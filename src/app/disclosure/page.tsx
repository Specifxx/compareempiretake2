import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "How Compare Empire makes money — affiliate disclosure",
  description: "Compare Empire is free. Some links, such as eBay, are affiliate links that may earn us a commission. They never change our price rankings.",
  alternates: { canonical: "/disclosure" },
};

export default function DisclosurePage() {
  return (
    <div className="container-x max-w-3xl pt-12 pb-16">
      <div className="eyebrow">Affiliate disclosure</div>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">How we make money.</h1>
      <div className="mt-8 space-y-6 text-ink-soft [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink">
        <p>Compare Empire is free to use. To keep it that way, some links on the site are affiliate links.</p>
        <h2>Which links</h2>
        <p>
          Links to eBay are part of the eBay Partner Network. If you click one and buy something on eBay, eBay may pay us a small commission. You pay exactly
          the same price. These links are marked &quot;Ad&quot;, &quot;affiliate link&quot; or sit in an eBay or marketplace box. We may add other store
          programs later; when we do, they will be listed here.
        </p>
        <h2>What it never changes</h2>
        <p>
          Store prices are ranked cheapest first using the store&apos;s own price, checked daily. No store can pay to rank higher, and whether a store pays us
          or not has no effect on its position, the price check or the price history.
        </p>
        <h2>Questions</h2>
        <p>
          Email <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </div>
    </div>
  );
}
