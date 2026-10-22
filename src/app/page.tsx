import Link from "next/link";
import { DealCard } from "@/components/DealCard";
import { ArrowRight } from "@/components/icons";
import { PhoneCard } from "@/components/PhoneCard";
import { RetailerDot } from "@/components/RetailerChip";
import { SearchHero } from "@/components/SearchHero";
import { getBrands, getCatalog, getDeals, getSummaries } from "@/lib/catalog";

export default function Home() {
  const { retailers, updatedAt, phones } = getCatalog();
  const summaries = getSummaries();
  const deals = getDeals(6);
  const brands = getBrands().slice(0, 10);
  const offers = phones.reduce((n, p) => n + p.offerCount, 0);
  const popular = summaries.filter((p) => p.retailerCount >= 3 && p.image).sort((a, b) => b.retailerCount - a.retailerCount || b.generation - a.generation || b.bestPrice - a.bestPrice).slice(0, 8);
  const budget = summaries.filter((p) => p.bestPrice <= 500 && p.retailerCount >= 2 && p.image && p.inStock).sort((a, b) => b.retailerCount - a.retailerCount || b.generation - a.generation).slice(0, 4);
  const updated = new Date(updatedAt).toLocaleString("en-AU", { timeZone: "Australia/Sydney", weekday: "long", hour: "numeric", minute: "2-digit" });

  return (
    <>
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
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
              Stop overpaying
              <br />
              for your <span className="bg-gradient-to-r from-brand to-[#B04BFF] bg-clip-text text-transparent">next phone.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-ink-soft">
              {phones.length} phones, {offers.toLocaleString()} live prices from {retailers.length} Australian retailers — side by side, cheapest first.
            </p>
            <div className="mx-auto mt-8 max-w-2xl">
              <SearchHero />
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink-mute">
              {retailers.map((r) => (
                <span key={r.id} className="inline-flex items-center gap-2"><RetailerDot id={r.id} /> {r.name}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-x">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {brands.map((b) => (
            <Link key={b.slug} href={`/brands/${b.slug}`} className="chip shrink-0">
              {b.brand} <span className="text-ink-mute">{b.count}</span>
            </Link>
          ))}
          <Link href="/phones?fold=1" className="chip shrink-0">Foldables</Link>
          <Link href="/phones?max=500" className="chip shrink-0">Under $500</Link>
        </div>
      </section>

      {deals.length > 0 && (
        <section className="container-x mt-12">
          <SectionHead title="Today's best deals" sub="Real savings right now — against other stores, the retailer's own RRP, or last week's price." href="/deals" cta="All deals" />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {deals.map((d, i) => <DealCard key={d.phone.slug} d={d} rank={i} />)}
          </div>
        </section>
      )}

      <section className="container-x mt-16">
        <SectionHead title="Most compared" sub="Stocked by the most retailers, so the price gap is real." href="/phones" cta="All phones" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {popular.map((p, i) => <PhoneCard key={p.slug} p={p} priority={i < 4} />)}
        </div>
      </section>

      <section className="container-x mt-16">
        <div className="card grid gap-8 overflow-hidden p-6 sm:p-10 md:grid-cols-3">
          {[
            ["Cheapest first. Always.", "No retailer pays to rank. The lowest in-stock price sits on top, full stop."],
            ["Every storage, every colour.", "We split prices by storage size — the trick shops use to make a phone look cheap."],
            ["Checked every day.", "Our scrapers visit every store each morning and keep the price history, so you can see a fake sale."],
          ].map(([t, s]) => (
            <div key={t}>
              <div className="font-display text-lg font-bold">{t}</div>
              <p className="mt-1.5 text-sm text-ink-soft">{s}</p>
            </div>
          ))}
        </div>
      </section>

      {budget.length > 0 && (
        <section className="container-x mt-16">
          <SectionHead title="Great phones under $500" sub="In stock now, compared across stores." href="/phones?max=500" cta="See all under $500" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {budget.map((p) => <PhoneCard key={p.slug} p={p} />)}
          </div>
        </section>
      )}

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
