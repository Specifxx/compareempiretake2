import Link from "next/link";
import { DealCard } from "@/components/DealCard";
import { ArrowRight } from "@/components/icons";
import { PhoneCard } from "@/components/PhoneCard";
import { SearchBox } from "@/components/SearchBox";
import { getGuides } from "@/lib/guides";
import { GuideCard } from "@/components/GuideCard";
import { catalogDay, comparedCategories, getCatalog, historyMature, historySince, liveRegions, getDeals, getSummaries, type PhoneSummary } from "@/lib/catalog";
import type { CategoryId } from "@/lib/types";
import { money, REGIONS, withRegion, type RegionId } from "@/lib/region";
import { FEATURED } from "@/lib/categories";
import { PartnerOffers } from "@/components/PartnerOffers";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { HomeRegionPicker } from "@/components/HomeRegionPicker";
import { HotLaunches } from "@/components/HotLaunches";
import { hotLaunches, storePreorders } from "@/lib/launches";
import { CreatorsCornerBadge } from "@/components/creators/CreatorsCornerBadge";

export function HomeView({ region }: { region: RegionId }) {
  const R = REGIONS[region];
  const $ = (n: number) => money(n, region);
  const to = (h: string) => withRegion(h, region);
  const { retailers, updatedAt, phones } = getCatalog(undefined, region);
  const summaries = getSummaries("phones", region);
  const deals = getDeals(6, undefined, region);
  const stores = retailers.length;
  // Only categories with a real comparison: 2+ stores and a product two of them sell (US shopper review, 2026-11-06).
  // Ordered by what visitors open (FEATURED is the 30-day analytics order, 2026-11-09), the rest after.
  const rank = (id: string) => { const i = FEATURED.indexOf(id as CategoryId); return i < 0 ? 99 : i; };
  const cats = [...comparedCategories(region)].sort((a, b) => rank(a.id) - rank(b.id)).map((c) => {
    const items = getSummaries(c.id as CategoryId, region);
    return { c, count: items.length, from: Math.min(...items.map((p) => p.bestPrice)), image: popularOf(items, 1)[0]?.image, popular: popularOf(items, 4) };
  });
  const offers = phones.reduce((n, p) => n + p.offerCount, 0);
  const popular = summaries.filter((p) => p.retailerCount >= 2 && p.image).sort((a, b) => b.retailerCount - a.retailerCount || b.generation - a.generation || b.bestPrice - a.bestPrice).slice(0, 10);
  // The "is that sale real?" promise only once the region's history can keep it (lib/catalog.ts HISTORY_CLAIM_DAYS).
  const mature = historyMature(region);
  const since = new Date(`${historySince(region)}T12:00:00Z`).toLocaleDateString(R.locale, { day: "numeric", month: "long", timeZone: "UTC" });
  // The year's big launches (content/launches.ts), dated by the last import, not the build clock.
  const hot = hotLaunches(region, catalogDay(region), getSummaries);
  // ...and whatever the stores opened pre-orders for on their own (lib/preorders.ts), filling the row to four cards.
  const pre = storePreorders(region, catalogDay(region), getSummaries).slice(0, Math.max(0, 4 - hot.length));
  const updated = new Date(updatedAt).toLocaleString(R.locale, { timeZone: R.timeZone, weekday: "long", hour: "numeric", minute: "2-digit" });

  // Laid out like a big comparison site's front page (owner, 2026-11-10, DECISIONS.md "PriceRunner-style redesign"):
  // one plain search band, the categories, today's price drops, then the products people compare most. No floating
  // promos, strips or reviews between the visitor and the products.
  return (
    <>
      <section className="relative z-20 border-b border-line bg-bg-card">
        <div className="container-x relative pb-6 pt-6 sm:pb-10 sm:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            {/* The creators hub, above the fold (owner, 2026-11-03): top-right corner from sm, a centred pill above the headline on a phone. */}
            <CreatorsCornerBadge />
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              {mature ? <>Is that sale actually real?</> : <>Every store&apos;s price, cheapest first.</>}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-ink-soft sm:text-lg">
              {mature ? (
                <>We save the price of everything we compare at {stores} {R.adjective} stores, every day. So when a store says &ldquo;was {$(1499)}&rdquo;, you can see if it ever was.</>
              ) : (
                <>We check {stores} {R.adjective} stores every morning and put their prices side by side. Every price saved since {since}.</>
              )}
            </p>
            {/* Phones already have the search under the logo (Header) and the country flag beside it. */}
            <div className="mx-auto mt-6 hidden max-w-2xl md:block">
              <SearchBox size="lg" />
            </div>
            <div className="mt-5 hidden sm:block">
              <HomeRegionPicker region={region} regions={liveRegions()} />
            </div>
          </div>
        </div>
        {/* What the site promises, in one line of facts (the trust strip). */}
        <div className="border-t border-line/70 bg-bg-sunk/60">
          <ul className="container-x flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 py-2.5 text-xs text-ink-soft sm:text-sm">
            <li className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-save" aria-hidden /> Prices checked {updated}
            </li>
            <li>
              <b className="text-ink">{phones.length.toLocaleString()}</b> products · <b className="text-ink">{offers.toLocaleString()}</b> prices
            </li>
            <li>
              <Link prefetch={false} href={region === "au" ? "/about#retailers" : to("/stores")} className="underline decoration-line underline-offset-4 hover:text-ink">{stores} stores compared</Link>
            </li>
            <li className="hidden sm:list-item">Cheapest in stock first · no paid rankings</li>
          </ul>
        </div>
      </section>

      <section className="container-x mt-8">
        <SectionHead title="Popular categories" href={to("/browse")} cta="All categories" />
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {cats.map(({ c, count, image }) => (
            <Link prefetch={false} key={c.id} href={to(c.href)} className="card tile-hover group flex flex-col items-center px-2 pb-3 pt-3 text-center">
              <div className="img-tile relative h-16 w-16 overflow-hidden rounded-full border border-line/60 sm:h-20 sm:w-20">
                {image && <img src={image} alt={c.name} loading="lazy" className="product-img absolute inset-0 h-full w-full object-contain p-2.5" />}
              </div>
              <div className="mt-2 text-[13px] font-semibold leading-tight group-hover:text-brand sm:text-sm">{c.name}</div>
              <div className="mt-0.5 text-[11px] text-ink-mute">{count.toLocaleString()} products</div>
            </Link>
          ))}
        </div>
      </section>

      {deals.length > 0 && (
        <section className="container-x mt-10">
          <SectionHead title="Price drops today" sub={mature ? "Real savings: against other stores, a was price we recorded, or last week's price." : "The biggest gaps between stores today, and drops we recorded at the same store."} href={to("/deals")} cta="All deals" />
          <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
            {deals.map((d, i) => <DealCard key={`${d.phone.category}/${d.phone.slug}`} d={d} rank={i} />)}
          </div>
        </section>
      )}

      {popular.length >= 4 && (
        <section className="container-x mt-10">
          <SectionHead title="Most compared phones" sub="Stocked by the most stores, so the price gap is real." href={to("/phones")} cta="All phones" />
          <Row>
            {popular.map((p, i) => <PhoneCard key={p.href} p={p} priority={i < 4} />)}
          </Row>
        </section>
      )}

      <div className="mt-10">
        <HotLaunches items={hot} preorders={pre} region={region} />
      </div>

      {cats.filter(({ c, popular }) => c.id !== "phones" && FEATURED.slice(0, 7).includes(c.id) && popular.length >= 4).map(({ c, popular }) => (
        <section key={c.id} className="container-x mt-10">
          <SectionHead title={`Popular ${c.name.toLowerCase()}`} href={to(c.href)} cta={`All ${c.name.toLowerCase()}`} />
          <Row>
            {popular.map((p) => <PhoneCard key={p.href} p={p} />)}
          </Row>
        </section>
      ))}

      {/* The newest guides: what search engines and readers come back for. Every region since 2026-11-06. */}
      <section className="container-x mt-12">
        <SectionHead title="Buying guides" sub="The year's big launches, best picks and head-to-heads, with live prices." href="/guides" cta="All guides" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {getGuides().slice(0, 3).map((g) => <GuideCard key={g.slug} g={g} />)}
        </div>
      </section>

      <div className="container-x"><PartnerOffers region={region} placement="home" /></div>

      <section className="container-x mt-12">
        <NewsletterSignup />
      </section>
    </>
  );
}

/** A row of product cards: swipes sideways on a phone, a grid from md. */
function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0 md:grid md:grid-cols-4 md:overflow-visible lg:grid-cols-5 [&>*]:w-[44vw] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-[30vw] md:[&>*]:w-auto">
      {children}
    </div>
  );
}

function SectionHead({ title, sub, href, cta }: { title: string; sub?: string; href: string; cta: string }) {
  return (
    <div className="mb-3.5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        {sub && <p className="mt-0.5 text-sm text-ink-mute">{sub}</p>}
      </div>
      <Link prefetch={false} href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand hover:underline">
        {cta} <ArrowRight />
      </Link>
    </div>
  );
}

/** Stocked by the most stores first: that's where the price gap means something. */
function popularOf(items: PhoneSummary[], n: number) {
  return items
    // Sold by two or more stores: a one-store product is not a comparison.
    .filter((p) => p.image && p.inStock && p.retailerCount >= 2)
    .sort((a, b) => b.retailerCount - a.retailerCount || b.offerCount - a.offerCount || b.generation - a.generation)
    .slice(0, n);
}
