import Link from "next/link";
import { catalogDay, getSummaries, type PhoneSummary } from "@/lib/catalog";
import { amazonLink, AMAZON_DISCLOSURE, AMAZON_REL } from "@/lib/amazon";
import { ebaySearch, SPONSORED_REL } from "@/lib/ebay";
import { displayName, legoPokemonFaq, legoPokemonSets, setNumber } from "@/lib/lego-pokemon";
import { blackFriday, cyberMonday, longDate, seasonYear } from "@/lib/black-friday";
import { money, REGIONS, withRegion, type RegionId } from "@/lib/region";
import { sized } from "@/lib/image-size";
import { SITE } from "@/lib/site";
import { InlineAds } from "@/components/InlineAds";

// The LEGO Pokémon hub (lib/lego-pokemon.ts, hype run 2026-11-20). Every LEGO Pokémon set the LEGO import matched by set
// number, priced at the region's stores today, each linking to its own comparison page; labelled Amazon and eBay searches for
// a set no store we track has in stock. The one ad block sits below the content. Buy clicks carry data-buy-product
// "lego-pokemon-<set>" so the hub's own click-through can be read.
const IN: Record<RegionId, string> = { au: "Australia", us: "the US", uk: "the UK", ca: "Canada", sg: "Singapore" };
const h2 = "font-display text-xl font-bold tracking-tight";
const btn = "rounded-xl border border-line bg-bg-card px-3 py-2 text-xs font-semibold hover:border-brand/40";

function PaidButtons({ region, p }: { region: RegionId; p: PhoneSummary }) {
  const n = setNumber(p) ?? "set";
  const q = `LEGO ${n}`;
  const tag = `lego-pokemon-${n}`;
  const amazon = amazonLink(region, q, tag);
  return (
    <>
      {amazon && <a href={amazon} target="_blank" rel={AMAZON_REL} data-buy="amazon" data-buy-kind="amazon-lego-pokemon" data-buy-product={tag} data-amazon={tag} className={btn}>Amazon ↗</a>}
      <a href={ebaySearch(q, { condition: "new", customid: tag, region })} target="_blank" rel={SPONSORED_REL} data-buy="ebay" data-buy-kind="lego-pokemon-ebay" data-buy-product={tag} className={btn}>New on eBay ↗</a>
    </>
  );
}

export function LegoPokemonView({ region }: { region: RegionId }) {
  const R = REGIONS[region];
  const place = IN[region];
  const sets = legoPokemonSets(getSummaries("lego", region));
  const open = sets.filter((p) => p.inStock);
  const out = sets.filter((p) => !p.inStock);
  const faq = legoPokemonFaq(place, sets, (n) => money(n, region));
  const bfYear = seasonYear(new Date().toISOString().slice(0, 10));
  const path = withRegion("/lego-pokemon", region);
  const ld = [
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    {
      "@context": "https://schema.org", "@type": "ItemList", name: `LEGO Pokémon sets in ${place}`,
      itemListElement: sets.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: displayName(p), url: `${SITE}${p.href}` })),
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Compare Empire", item: `${SITE}${withRegion("/", region) === "/" ? "" : withRegion("/", region)}` },
        { "@type": "ListItem", position: 2, name: "LEGO", item: `${SITE}${withRegion("/lego", region)}` },
        { "@type": "ListItem", position: 3, name: "LEGO Pokémon", item: `${SITE}${path}` },
      ],
    },
  ];
  return (
    <div className="container-x pb-12 pt-6 sm:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <nav className="mb-3 text-xs text-ink-mute"><Link prefetch={false} href={withRegion("/lego", region)} className="underline">LEGO</Link> / LEGO Pokémon</nav>
      <header className="max-w-2xl">
        <h1 className="font-display text-[1.75rem] font-bold leading-[1.12] tracking-tight sm:text-4xl" style={{ textWrap: "balance" }}>LEGO Pokémon prices in {place}</h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
          Every LEGO Pokémon set we can match at {R.adjective} stores, by its set number, with the cheapest price each store shows today (checked {catalogDay(region)}).
          {open[0] ? <> {displayName(open[0])} is at the most stores: {open[0].retailerCount}, from <b>{money(open[0].bestPrice, region)}</b>.</> : null}
        </p>
      </header>

      <section className="mt-8" aria-labelledby="lp-sets">
        <h2 id="lp-sets" className={`mb-1 ${h2}`}>Every LEGO Pokémon set, cheapest store first</h2>
        <p className="mb-3 text-sm text-ink-mute">Tap a set to see every store&rsquo;s price side by side.</p>
        {open.length === 0 ? (
          <p className="text-sm text-ink-mute">No {R.adjective} store we track has a LEGO Pokémon set in stock today.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {open.map((p) => (
              <li key={p.href}>
                <Link prefetch={false} href={p.href} className="card flex items-center gap-4 p-4 transition hover:shadow-lift">
                  <div className="img-tile grid h-16 w-16 shrink-0 sm:h-24 sm:w-24 place-items-center overflow-hidden rounded-lg">
                    {p.image && <img src={sized(p.image, 220)} alt={displayName(p)} loading="lazy" className="product-img h-full w-full object-contain p-2" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-ink-mute">Set {setNumber(p)}</div>
                    <h3 className="line-clamp-2 font-display text-base font-bold leading-tight">{displayName(p)}</h3>
                    <div className="mt-1 text-xs text-ink-mute">{p.retailerCount} {p.retailerCount === 1 ? "store" : "stores"} · compare →</div>
                  </div>
                  <div className="shrink-0 text-right"><span className="block text-xs text-ink-mute">from</span><span className="price text-xl">{money(p.bestPrice, region)}</span></div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="lp-elsewhere">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 id="lp-elsewhere" className={h2}>{out.length ? "Sold out at the stores we track" : "Also check Amazon and eBay"}</h2>
          <span className="text-[11px] uppercase tracking-wide text-ink-mute">Ad · affiliate links</span>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {(out.length ? out : open).map((p) => (
            <li key={p.href} className="card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 basis-full sm:basis-0 sm:flex-1"><div className="font-semibold">{displayName(p)}</div><div className="text-xs text-ink-mute">{p.inStock ? "Amazon and eBay are not in the store comparison above" : "Not in stock at a store we track today"}</div></div>
              <PaidButtons region={region} p={p} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-ink-mute">
          {amazonLink(region, "x") ? `${AMAZON_DISCLOSURE} ` : ""}We may earn a commission on these links. It never changes our price rankings. <Link prefetch={false} href="/disclosure" className="underline">How we make money</Link>
        </p>
      </section>

      <section className="mt-10 max-w-2xl" aria-labelledby="lp-bf">
        <h2 id="lp-bf" className={`mb-2 ${h2}`}>Black Friday and Christmas</h2>
        <p className="text-sm text-ink-soft">
          Black Friday {bfYear} is {longDate(blackFriday(bfYear))} and Cyber Monday is {longDate(cyberMonday(bfYear))}. The prices above are what each store asks today, refreshed every
          morning, so a sale shows up here as soon as a store drops its price. Our <Link prefetch={false} href={withRegion("/black-friday", region)} className="underline">Black Friday page</Link> lists
          real price drops across every category, checked against what the stores asked before.
        </p>
      </section>

      <section className="mt-10 max-w-2xl" aria-labelledby="lp-faq">
        <h2 id="lp-faq" className={`mb-3 ${h2}`}>LEGO Pokémon questions</h2>
        <dl className="space-y-4">{faq.map((f) => <div key={f.q}><dt className="font-semibold">{f.q}</dt><dd className="text-sm text-ink-soft">{f.a}</dd></div>)}</dl>
        <p className="mt-6 text-xs text-ink-mute">Compare Empire is not affiliated with, endorsed by or sponsored by the LEGO Group, Nintendo, Creatures, GAME FREAK or The Pokémon Company. LEGO and Pokémon are trademarks of their owners.</p>
      </section>

      <div className="mt-10"><InlineAds /></div>
    </div>
  );
}
