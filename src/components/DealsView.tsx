import Link from "next/link";
import { activeCategories, getCatalog, getDeals } from "@/lib/catalog";
import { categoryById } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";
import { REGIONS, withRegion, type RegionId } from "@/lib/region";
import { DealCard } from "./DealCard";
import { NewsletterSignup } from "./NewsletterSignup";
import { blackFriday as bfDate, cyberMonday, longDate, seasonYear } from "@/lib/black-friday";
import { saleHeading, saleIntro, saleYear, type SaleSlug } from "@/lib/sale-seasons";

/** The deals list for every category, or one. */
export function DealsView({ category, region = "au", blackFriday = false, sale }: { category?: CategoryId; region?: RegionId; blackFriday?: boolean; sale?: SaleSlug }) {
  const deals = getDeals(category ? 60 : 90, category, region);
  const { updatedAt } = getCatalog(undefined, region);
  const R = REGIONS[region];
  const drops = deals.filter((d) => d.kind === "drop");
  const rest = deals.filter((d) => d.kind !== "drop");
  const c = category ? categoryById(category) : undefined;
  const tabs = activeCategories(region).filter((x) => getDeals(1, x.id, region).length > 0);
  return (
    <div className="container-x pt-10">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{sale ? `${saleHeading(sale, saleYear(sale, updatedAt.slice(0, 10))).replace(/ deals /, " tech deals ")}` : blackFriday ? `Black Friday tech deals ${seasonYear(updatedAt.slice(0, 10))}` : c ? `${c.name} deals` : "Today's deals"}</h1>
        {sale ? <SaleDates slug={sale} today={updatedAt.slice(0, 10)} place={/^United /.test(R.name) ? `the ${R.name}` : R.name} /> : blackFriday && <BlackFridayDates today={updatedAt.slice(0, 10)} />}
        <p className="mt-2 text-ink-mute">
          Every deal here is worked out from real prices we checked on{" "}
          {new Date(updatedAt).toLocaleDateString(R.locale, { timeZone: R.timeZone, weekday: "long", day: "numeric", month: "long" })} — no sponsored spots, no
          &ldquo;was&rdquo; prices we can&apos;t back up.
        </p>
      </div>
      <nav className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="Deal categories">
        <Link href={withRegion("/deals", region)} className={`chip shrink-0 text-xs ${!category ? "chip-on" : ""}`}>All</Link>
        {tabs.map((t) => (
          <Link key={t.id} href={withRegion(`/deals/${t.id}`, region)} className={`chip shrink-0 text-xs ${category === t.id ? "chip-on" : ""}`}>
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

/** The Black Friday page's dates line (DECISIONS.md, "Black Friday page", 2026-11-02). */
function BlackFridayDates({ today }: { today: string }) {
  const y = seasonYear(today);
  const bf = bfDate(y);
  return (
    <p className="mt-2 text-ink-mute">
      Black Friday is {longDate(bf)} and Cyber Monday is {longDate(cyberMonday(y))} {y}.{today < bf ? " Many stores start their sales earlier." : ""} This page
      updates with every price check through the sales, so bookmark it. We only see what a store asks when we read its prices: check the price on its page before you buy.
    </p>
  );
}

/** The seasonal sale pages' opening line (DECISIONS.md, "Seasonal sale pages", 2026-11-02). */
function SaleDates({ slug, today, place }: { slug: SaleSlug; today: string; place: string }) {
  return (
    <p className="mt-2 text-ink-mute">
      {saleIntro(slug, saleYear(slug, today), place)} This page updates with every price check through the sales, so bookmark it. We only see what a store asks
      when we read its prices: check the price on its page before you buy.
    </p>
  );
}
