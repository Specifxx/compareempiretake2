import type { Metadata } from "next";
import { DealCard } from "@/components/DealCard";
import { getCatalog, getDeals } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Today's best phone deals in Australia",
  description: "The biggest real savings on new phones today — price drops, retailer sales and the gap between the cheapest and dearest Australian store.",
  alternates: { canonical: "/deals" },
};

export default function DealsPage() {
  const deals = getDeals(90);
  const { updatedAt } = getCatalog();
  const drops = deals.filter((d) => d.kind === "drop");
  const rest = deals.filter((d) => d.kind !== "drop");
  return (
    <div className="container-x pt-10">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Today&apos;s deals</h1>
        <p className="mt-2 text-ink-mute">
          Every deal here is computed from real prices we checked on{" "}
          {new Date(updatedAt).toLocaleDateString("en-AU", { timeZone: "Australia/Sydney", weekday: "long", day: "numeric", month: "long" })} — no sponsored spots, no
          &ldquo;was&rdquo; prices we can&apos;t see on the retailer&apos;s own site.
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3 text-xs text-ink-soft">
        <Legend color="bg-hot" label="Price drop — cheaper than our check a week ago" />
        <Legend color="bg-save" label="Off RRP — the retailer's own sale price" />
        <Legend color="bg-brand" label="Store gap — vs what other stores typically charge" />
      </div>
      {drops.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-xl font-bold">Price drops this week</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{drops.map((d, i) => <DealCard key={d.phone.slug} d={d} rank={i} />)}</div>
        </section>
      )}
      <section className="mt-10">
        {drops.length > 0 && <h2 className="mb-4 font-display text-xl font-bold">Sales and store gaps</h2>}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{rest.map((d, i) => <DealCard key={d.phone.slug} d={d} rank={drops.length ? undefined : i} />)}</div>
      </section>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-bg-card px-3 py-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} /> {label}
    </span>
  );
}
