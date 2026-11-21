import Link from "next/link";
import { catalogDay, getSummaries } from "@/lib/catalog";
import { amazonLink, AMAZON_DISCLOSURE, AMAZON_REL } from "@/lib/amazon";
import { ebaySearch, SPONSORED_REL } from "@/lib/ebay";
import { anyLegoName, setNumber } from "@/lib/lego-pokemon";
import { HOT_LEGO_THEMES, hotLego, hotToysFaq, LIST_TOYS, SOURCES } from "@/lib/hot-toys";
import { blackFriday, cyberMonday, longDate, seasonYear } from "@/lib/black-friday";
import { money, REGIONS, withRegion, type RegionId } from "@/lib/region";
import { sized } from "@/lib/image-size";
import { SITE } from "@/lib/site";
import { InlineAds } from "@/components/InlineAds";

// The hot toys page (lib/hot-toys.ts, hype run 2026-11-20). The hyped LEGO themes compared at two or more stores, then the
// list toys our stores barely carry, as labelled Amazon and eBay searches with the lists that named them. Buy clicks carry
// data-buy-product "hot-toys-<key>" so the page's own click-through can be read. The one ad block sits below the content.
const IN: Record<RegionId, string> = { au: "Australia", us: "the US", uk: "the UK", ca: "Canada", sg: "Singapore" };
const h2 = "font-display text-xl font-bold tracking-tight";
const btn = "rounded-xl border border-line bg-bg-card px-3 py-2 text-xs font-semibold hover:border-brand/40";

export function HotToysView({ region }: { region: RegionId }) {
  const R = REGIONS[region];
  const place = IN[region];
  const lego = getSummaries("lego", region);
  const themes = HOT_LEGO_THEMES.map((t) => ({ t, sets: hotLego(lego, t) }));
  const top = themes.flatMap((x) => x.sets).sort((a, b) => b.retailerCount - a.retailerCount || a.bestPrice - b.bestPrice)[0];
  const faq = hotToysFaq(place, top && { ...top, name: anyLegoName(top) }, (n) => money(n, region));
  const bfYear = seasonYear(new Date().toISOString().slice(0, 10));
  const year = new Date().getUTCFullYear();
  const path = withRegion("/hot-toys", region);
  const ld = [
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Compare Empire", item: `${SITE}${withRegion("/", region) === "/" ? "" : withRegion("/", region)}` },
        { "@type": "ListItem", position: 2, name: "Hot toys", item: `${SITE}${path}` },
      ],
    },
  ];
  return (
    <div className="container-x pb-12 pt-6 sm:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <header className="max-w-2xl">
        <h1 className="font-display text-[1.75rem] font-bold leading-[1.12] tracking-tight sm:text-4xl" style={{ textWrap: "balance" }}>Hot toys for Christmas {year}: prices in {place}</h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
          The toys the big {year} lists picked, and the LEGO sets from the same crazes that {R.adjective} stores have in stock, compared store by store (checked {catalogDay(region)}).
          {top ? <> {anyLegoName(top)} is at the most stores: {top.retailerCount}, from <b>{money(top.bestPrice, region)}</b>.</> : null}
        </p>
      </header>

      {themes.map(({ t, sets }) => (
        <section key={t.key} className="mt-8" aria-labelledby={`ht-${t.key}`}>
          <h2 id={`ht-${t.key}`} className={`mb-1 ${h2}`}>{t.name}: cheapest store first</h2>
          {sets.length === 0 ? (
            <p className="text-sm text-ink-mute">No {t.name} set is in stock at two {R.adjective} stores we track today.</p>
          ) : (
            <ul className="mt-3 grid gap-3 md:grid-cols-2">
              {sets.map((p) => (
                <li key={p.href}>
                  <Link prefetch={false} href={p.href} className="card flex items-center gap-4 p-4 transition hover:shadow-lift">
                    <div className="img-tile grid h-16 w-16 shrink-0 sm:h-24 sm:w-24 place-items-center overflow-hidden rounded-lg">
                      {p.image && <img src={sized(p.image, 220)} alt={anyLegoName(p)} loading="lazy" className="product-img h-full w-full object-contain p-2" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      {setNumber(p) && <div className="text-xs font-medium text-ink-mute">Set {setNumber(p)}</div>}
                      <h3 className="line-clamp-2 font-display text-base font-bold leading-tight">{anyLegoName(p)}</h3>
                      <div className="mt-1 text-xs text-ink-mute">{p.retailerCount} stores · compare →</div>
                    </div>
                    <div className="shrink-0 text-right"><span className="block text-xs text-ink-mute">from</span><span className="price text-xl">{money(p.bestPrice, region)}</span></div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {t.key === "pokemon" && (
            <p className="mt-2 text-sm"><Link prefetch={false} href={withRegion("/lego-pokemon", region)} className="underline">Every LEGO Pokémon set →</Link></p>
          )}
        </section>
      ))}

      <section className="mt-10" aria-labelledby="ht-lists">
        <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
          <h2 id="ht-lists" className={h2}>On the {year} hot-toy lists</h2>
          <span className="text-[11px] uppercase tracking-wide text-ink-mute">Ad · affiliate links</span>
        </div>
        <p className="mb-3 text-sm text-ink-mute">Each of these is at one store we track or none, so there is no comparison yet: search Amazon and eBay instead.</p>
        <ul className="grid gap-3 md:grid-cols-2">
          {LIST_TOYS.map((toy) => {
            const tag = `hot-toys-${toy.key}`;
            const amazon = amazonLink(region, toy.query, tag);
            return (
              <li key={toy.key} className="card flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
                  <div className="font-semibold">{toy.name}</div>
                  <div className="text-xs text-ink-mute">On {toy.lists.map((k) => SOURCES[k].label.split(",")[0]).join(", ")}</div>
                </div>
                {amazon && <a href={amazon} target="_blank" rel={AMAZON_REL} data-buy="amazon" data-buy-kind="amazon-hot-toys" data-buy-product={tag} data-amazon={tag} className={btn}>Amazon ↗</a>}
                <a href={ebaySearch(toy.query, { condition: "new", customid: tag, region })} target="_blank" rel={SPONSORED_REL} data-buy="ebay" data-buy-kind="hot-toys-ebay" data-buy-product={tag} className={btn}>New on eBay ↗</a>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[11px] text-ink-mute">
          Lists: {Object.values(SOURCES).map((s, i) => (
            <span key={s.url}>{i ? "; " : ""}<a href={s.url} target="_blank" rel="noopener nofollow" className="underline">{s.label}</a> ({s.date})</span>
          ))}. {amazonLink(region, "x") ? `${AMAZON_DISCLOSURE} ` : ""}We may earn a commission on these links. It never changes our price rankings. <Link prefetch={false} href="/disclosure" className="underline">How we make money</Link>
        </p>
      </section>

      <section className="mt-10 max-w-2xl" aria-labelledby="ht-bf">
        <h2 id="ht-bf" className={`mb-2 ${h2}`}>Black Friday and Christmas</h2>
        <p className="text-sm text-ink-soft">
          Black Friday {bfYear} is {longDate(blackFriday(bfYear))} and Cyber Monday is {longDate(cyberMonday(bfYear))}. The store prices above are refreshed every morning, so a sale
          shows here as soon as a store drops its price. Our <Link prefetch={false} href={withRegion("/black-friday", region)} className="underline">Black Friday page</Link> lists real price drops in every category.
        </p>
      </section>

      <section className="mt-10 max-w-2xl" aria-labelledby="ht-faq">
        <h2 id="ht-faq" className={`mb-3 ${h2}`}>Hot toy questions</h2>
        <dl className="space-y-4">{faq.map((f) => <div key={f.q}><dt className="font-semibold">{f.q}</dt><dd className="text-sm text-ink-soft">{f.a}</dd></div>)}</dl>
        <p className="mt-6 text-xs text-ink-mute">Compare Empire is not affiliated with the LEGO Group, Mattel, Netflix, Sony, Hasbro, Spin Master, BBC Studios, Ludo Studio or The Pokémon Company. Names are trademarks of their owners.</p>
      </section>

      <div className="mt-10"><InlineAds /></div>
    </div>
  );
}
