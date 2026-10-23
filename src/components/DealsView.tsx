import Link from "next/link";
import { activeCategories, getCatalog, getDeals } from "@/lib/catalog";
import { categoryById } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";
import { DealCard } from "./DealCard";
import { NewsletterSignup } from "./NewsletterSignup";

/** The deals list for every category, or one. */
export function DealsView({ category }: { category?: CategoryId }) {
  const deals = getDeals(category ? 60 : 90, category);
  const { updatedAt } = getCatalog();
  const drops = deals.filter((d) => d.kind === "drop");
  const rest = deals.filter((d) => d.kind !== "drop");
  const c = category ? categoryById(category) : undefined;
  const tabs = activeCategories().filter((x) => getDeals(1, x.id).length > 0);
  return (
    <div className="container-x pt-10">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{c ? `${c.name} deals` : "Today's deals"}</h1>
        <p className="mt-2 text-ink-mute">
          Every deal here is worked out from real prices we checked on{" "}
          {new Date(updatedAt).toLocaleDateString("en-AU", { timeZone: "Australia/Sydney", weekday: "long", day: "numeric", month: "long" })} — no sponsored spots, no
          &ldquo;was&rdquo; prices we can&apos;t back up.
        </p>
      </div>
      <nav className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="Deal categories">
        <Link href="/deals" className={`chip shrink-0 text-xs ${!category ? "chip-on" : ""}`}>All</Link>
        {tabs.map((t) => (
          <Link key={t.id} href={`/deals/${t.id}`} className={`chip shrink-0 text-xs ${category === t.id ? "chip-on" : ""}`}>
            {t.emoji} {t.name}
          </Link>
        ))}
      </nav>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-soft">
        <Legend color="bg-hot" label="Price drop — cheaper than our check a week ago" />
        <Legend color="bg-save" label="Off RRP — backed by another store's price" />
        <Legend color="bg-brand" label="Store gap — vs what other stores typically charge" />
      </div>
      {drops.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-xl font-bold">Price drops this week</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{drops.map((d, i) => <DealCard key={`${d.phone.category}/${d.phone.slug}`} d={d} rank={i} />)}</div>
        </section>
      )}
      <section className="mt-10">
        {drops.length > 0 && <h2 className="mb-4 font-display text-xl font-bold">Sales and store gaps</h2>}
        {rest.length ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((d, i) => <DealCard key={`${d.phone.category}/${d.phone.slug}`} d={d} rank={drops.length ? undefined : i} />)}
          </div>
        ) : (
          <p className="text-sm text-ink-mute">No deals worth calling one today. That&apos;s a result too: prices are where they usually are.</p>
        )}
      </section>
      <div className="mt-12"><NewsletterSignup /></div>
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
