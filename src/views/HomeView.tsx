import Link from "next/link";
import { DealCard } from "@/components/DealCard";
import { ArrowRight } from "@/components/icons";
import { PhoneCard } from "@/components/PhoneCard";
import { SearchBox } from "@/components/SearchBox";
import { getGuides } from "@/lib/guides";
import { GuideCard } from "@/components/GuideCard";
import { activeCategories, checkVariant, getCatalog, getDeals, getPhones, getSummaries, type PhoneSummary } from "@/lib/catalog";
import type { CategoryId } from "@/lib/types";
import { money, REGIONS, withRegion, type RegionId } from "@/lib/region";
import { FEATURED } from "@/lib/categories";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { ReviewsSection } from "@/components/ReviewsSection";
import { storageLabel } from "@/lib/normalize";
import { PriceCheckCard } from "@/components/PriceCheckCard";
import { AmazonPicks } from "@/components/AmazonPicks";
import { EbayStrip } from "@/components/EbayStrip";

export function HomeView({ region }: { region: RegionId }) {
  const R = REGIONS[region];
  const $ = (n: number) => money(n, region);
  const to = (h: string) => withRegion(h, region);
  const { retailers, updatedAt, phones } = getCatalog(undefined, region);
  const summaries = getSummaries("phones", region);
  const deals = getDeals(6, undefined, region);
  const cats = activeCategories(region).map((c) => {
    const items = getSummaries(c.id as CategoryId, region);
    return { c, count: items.length, from: Math.min(...items.map((p) => p.bestPrice)), image: popularOf(items, 1)[0]?.image, popular: popularOf(items, 4) };
  });
  const offers = phones.reduce((n, p) => n + p.offerCount, 0);
  const popular = summaries.filter((p) => p.retailerCount >= 3 && p.image).sort((a, b) => b.retailerCount - a.retailerCount || b.generation - a.generation || b.bestPrice - a.bestPrice).slice(0, 8);
  const budget = summaries.filter((p) => p.bestPrice <= 500 && p.retailerCount >= 2 && p.image && p.inStock).sort((a, b) => b.retailerCount - a.retailerCount || b.generation - a.generation).slice(0, 4);
  const example = pickExample(region);
  const updated = new Date(updatedAt).toLocaleString(R.locale, { timeZone: R.timeZone, weekday: "long", hour: "numeric", minute: "2-digit" });

  return (
    <>
      <section className="relative z-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
          <div className="absolute -right-40 top-20 h-72 w-72 rounded-full bg-save/10 blur-3xl" />
        </div>
        <div className="container-x pb-12 pt-14 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-bg-card px-3 py-1 text-xs font-medium text-ink-soft shadow-sm">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-save opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-save" /></span>
              Prices checked {updated}
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Is that sale
              <br />
              <span className="bg-gradient-to-r from-brand to-[#B04BFF] bg-clip-text text-transparent">actually real?</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-ink-soft">
              We save the price of everything we compare at {retailers.length} {R.adjective} stores, every day. So when a store says &ldquo;was {$(1499)}&rdquo;, you can see if it ever was.
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm text-ink-mute">
              {phones.length.toLocaleString()} products · {offers.toLocaleString()} live prices · cheapest in-stock first · no paid rankings
            </p>
            <div className="mx-auto mt-8 max-w-2xl">
              <SearchBox size="lg" />
            </div>
            <p className="mt-5 text-sm text-ink-mute">
              Including {retailers.slice(0, 3).map((r) => r.name).join(", ")}
              {retailers.length > 3 && (
                <>
                  {" "}and{" "}
                  <Link href={region === "au" ? "/about#retailers" : to("/stores")} className="font-medium text-ink-soft underline decoration-line underline-offset-4 hover:text-ink">{retailers.length - 3} more stores</Link>
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {example && (
        <section className="container-x -mt-4 mb-10">
          <Link href={`${to(`/${example.phone.category}/${example.phone.slug}`)}?v=${example.variant.id}`} prefetch={false} className="mx-auto flex max-w-3xl flex-col items-stretch gap-4 rounded-3xl border border-line bg-bg-card p-4 shadow-card transition hover:shadow-lift sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="img-tile grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl">
                {example.phone.image && <img src={example.phone.image} alt="" className="product-img h-full w-full object-contain p-2" />}
              </div>
              <div>
                <div className="eyebrow">Live example</div>
                <div className="font-semibold">{example.phone.name} {storageLabel(example.variant.storageGb)}</div>
                <div className="price text-2xl">{$(example.variant.bestPrice)}</div>
              </div>
            </div>
            <PriceCheckCard check={example.check} />
          </Link>
        </section>
      )}

      <section className="container-x">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-display text-xl font-extrabold tracking-tight">Shop by category</h2>
          <Link href={to("/browse")} className="text-sm font-semibold text-brand hover:underline">Browse all products →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {cats.map(({ c, count, from, image }) => (
            <Link key={c.id} href={to(c.href)} className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
              <div className="img-tile relative aspect-square">
                {image && <img src={image} alt="" loading="lazy" className="product-img absolute inset-0 h-full w-full object-contain p-4 transition group-hover:scale-105" />}
              </div>
              <div className="p-3">
                <div className="font-semibold">{c.emoji} {c.name}</div>
                <div className="text-xs text-ink-mute">{count.toLocaleString()} products · from {$(Math.round(from))}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* The newest guides and posts, high on the page: they're what search engines and readers come back for. */}
      {region === "au" && (
        <section className="container-x mt-12">
          <SectionHead title="Latest from the blog" sub="Our take on the year's big launches, best picks and head-to-heads, with live prices that update each morning." href="/guides" cta="All guides" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {getGuides().slice(0, 6).map((g, i) => <GuideCard key={g.slug} g={g} big={i === 0} />)}
          </div>
          <ul className="mt-6 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {getGuides().slice(6, 18).map((g) => (
              <li key={g.slug} className="border-b border-dashed border-line pb-2">
                <Link href={`/guides/${g.slug}`} className="font-medium text-ink-soft hover:text-brand">{g.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="container-x mt-12">
        <ReviewsSection limit={3} />
      </section>

      {region === "au" && (
        <div className="container-x">
          <AmazonPicks />
        </div>
      )}

      <div className="container-x">
        <EbayStrip query="unlocked smartphone" label="phones and tech" phones customid={`${region === "au" ? "" : `${region}-`}home`} region={region} />
      </div>

      {deals.length > 0 && (
        <section className="container-x mt-12">
          <SectionHead title="Today's best deals" sub="Real savings right now — against what other stores charge, a backed-up RRP, or last week's price." href={to("/deals")} cta="All deals" />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {deals.map((d, i) => <DealCard key={`${d.phone.category}/${d.phone.slug}`} d={d} rank={i} />)}
          </div>
        </section>
      )}

      <section className="container-x mt-16">
        <SectionHead title="Most compared phones" sub="Stocked by the most retailers, so the price gap is real." href={to("/phones")} cta="All phones" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {popular.map((p, i) => <PhoneCard key={p.href} p={p} priority={i < 4} />)}
        </div>
      </section>

      {cats.filter(({ c, popular }) => c.id !== "phones" && FEATURED.slice(0, 7).includes(c.id) && popular.length >= 4).map(({ c, popular }) => (
        <section key={c.id} className="container-x mt-16">
          <SectionHead title={`Popular ${c.name}`} sub={c.blurb} href={to(c.href)} cta={`All ${c.name}`} />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {popular.map((p) => <PhoneCard key={p.href} p={p} />)}
          </div>
        </section>
      ))}

      <section className="container-x mt-16">
        <div className="mb-6 max-w-2xl">
          <div className="eyebrow">Why not just Google it?</div>
          <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Google shows you ads. We show you the price.</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["We call out fake sales", "We record every price, every day. If a “was $1,999” never cost $1,999, the price check next to it says so."],
            ["Nobody buys the top spot", "Shopping results put paid listings first. Ours are cheapest in-stock first — no retailer can pay to move up."],
            ["The exact phone, not a lookalike", "We split every phone by storage and leave out refurbs, grey imports and carrier-locked stock, so the cheapest price is for the phone you actually want."],
            region === "au" ? ["Real Aussie stores, in stock", "Only Australian retailers with local warranty, and we tell you who actually has it in stock today."] : [`Real ${R.adjective} stores, in stock`, `Only ${R.adjective} retailers selling new stock, and we tell you who actually has it in stock today.`],
          ].map(([t, d]) => (
            <div key={t} className="card p-5">
              <div className="font-display text-lg font-bold leading-snug">{t}</div>
              <p className="mt-2 text-sm text-ink-soft">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {budget.length > 0 && (
        <section className="container-x mt-16">
          <SectionHead title={`Great phones under ${$(500)}`} sub="In stock now, compared across stores." href={`${to("/phones")}?max=500`} cta="See all under $500" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {budget.map((p) => <PhoneCard key={p.href} p={p} />)}
          </div>
        </section>
      )}


      <section className="container-x mt-16">
        <NewsletterSignup />
      </section>



      <section className="container-x mt-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2A1A8C] via-brand to-[#9B4DFF] p-8 text-white sm:p-12">
          <div className="max-w-xl">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Built with the community</div>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Spotted a better price?</h2>
            <p className="mt-3 text-white/80">
              Compare Empire is new and built in the open. Tell us about a store we&apos;re missing or a price we got wrong and we&apos;ll add it — the more stores we check, the more everyone saves.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/about#feedback" className="btn bg-white text-[#2A1A8C] hover:bg-white/90">Suggest a store</Link>
              <Link href="/about" className="btn border border-white/30 text-white hover:bg-white/10">How we compare</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHead({ title, sub, href, cta }: { title: string; sub: string; href: string; cta: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
        <p className="mt-1 text-sm text-ink-mute">{sub}</p>
      </div>
      <Link href={href} className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand hover:underline sm:inline-flex">
        {cta} <ArrowRight />
      </Link>
    </div>
  );
}

/** The home page's proof: a popular phone whose history best shows the price check working. */
function pickExample(region: RegionId) {
  const rank = { lowest: 0, below: 1, above: 2, usual: 3, new: 4 } as const;
  const phones = getPhones(region);
  const min = phones.some((p) => p.retailerCount >= 6) ? 6 : 3;
  const candidates = phones
    .filter((p) => p.retailerCount >= min && p.image)
    .slice(0, 30)
    .map((phone) => {
      const variant = phone.variants.reduce((a, b) => (new Set(b.offers.map((o) => o.retailer)).size > new Set(a.offers.map((o) => o.retailer)).size ? b : a));
      return { phone, variant, check: checkVariant(phone, variant).check };
    })
    .sort((a, b) => rank[a.check.verdict] - rank[b.check.verdict] || b.check.points.length - a.check.points.length);
  return candidates[0];
}

/** Stocked by the most stores first: that's where the price gap means something. */
function popularOf(items: PhoneSummary[], n: number) {
  return items
    .filter((p) => p.image && p.inStock)
    .sort((a, b) => b.retailerCount - a.retailerCount || b.offerCount - a.offerCount || b.generation - a.generation)
    .slice(0, n);
}
