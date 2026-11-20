import Link from "next/link";
import localFont from "next/font/local";
import { catalogDay, getSummaries, type PhoneSummary } from "@/lib/catalog";
import { amazonLink, AMAZON_DISCLOSURE, AMAZON_REL } from "@/lib/amazon";
import { ebaySearch, SPONSORED_REL } from "@/lib/ebay";
import {
  GTA6, GTA6_ACCESSORIES, GTA6_EDITIONS, GTA6_FAQ, GTA6_PRICE_SOURCE, PS6_SOURCE,
  gta6ConsoleRows, gta6Consoles, gta6Monitors, gta6Tvs,
} from "@/lib/gta6";
import { blackFriday, cyberMonday, longDate, seasonYear } from "@/lib/black-friday";
import { money, REGIONS, withRegion, type RegionId } from "@/lib/region";
import { sized } from "@/lib/image-size";
import { SITE } from "@/lib/site";
import { InlineAds } from "@/components/InlineAds";

// The GTA 6 hub (lib/gta6.ts, owner 2026-11-10 and 2026-11-20: "a full GTA 6 themed page we can index"). Everything a buyer
// needs for the game on one page per region, from the day's store prices: the consoles Rockstar names, TVs and monitors
// whose own listing states 4K at 120Hz+, then labelled Amazon and eBay searches for the extras. Facts are sourced; nothing
// about stock, a shortage or a bundle that a store's own listing doesn't show. The one ad block sits below the content.
const day = (iso: string, region: RegionId) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(REGIONS[region].locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const IN: Record<RegionId, string> = { au: "Australia", us: "the US", uk: "the UK", ca: "Canada", sg: "Singapore" };
type HubRegion = "au" | "us" | "uk";
const hub = (r: RegionId): HubRegion => (r === "us" || r === "uk" ? r : "au");
// Vice City look (owner, 2026-11-20: "very GTA themed ... palm trees and pearly fonts"), scoped to this page by `.gta` in
// globals.css. Only the banner, headings and accents change: cards, prices and buy buttons keep the site's own tokens so
// they read and click exactly as on every other page. Pacifico (OFL) loads on these pages only.
const vice = localFont({ src: "../app/fonts/pacifico-latin-400-normal.woff2", variable: "--font-vice", display: "swap", weight: "400" });
const h2 = "gta-h2 font-display text-xl font-bold tracking-tight";

function Palm({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 220 360" aria-hidden className={className}>
      <path d="M112 360 C108 280 104 200 118 120" stroke="currentColor" strokeWidth="14" fill="none" />
      <path d="M118 120 C80 90 40 100 6 130 C46 108 84 112 118 124 Z M118 120 C150 84 192 86 216 112 C180 98 148 104 120 126 Z M118 120 C104 76 70 52 30 52 C70 66 98 90 116 126 Z M118 120 C134 72 168 46 204 44 C170 62 142 88 122 126 Z M118 120 C116 80 120 40 136 8 C130 48 128 86 122 124 Z" fill="currentColor" />
    </svg>
  );
}
const btn = "rounded-xl border border-line bg-bg-card px-3 py-2 text-xs font-semibold hover:border-brand/40";
const link = "underline decoration-line underline-offset-2 hover:text-ink";

function ProductGrid({ items, region }: { items: PhoneSummary[]; region: RegionId }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {items.map((p) => (
        <li key={p.href}>
          <Link prefetch={false} href={p.href} className="card flex items-center gap-4 p-4 transition hover:shadow-lift">
            <div className="img-tile grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg">
              {p.image && <img src={sized(p.image, 220)} alt={p.name} loading="lazy" className="product-img h-full w-full object-contain p-2" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-ink-mute">{p.brand}</div>
              <h3 className="line-clamp-2 font-display text-base font-bold leading-tight">{p.name}</h3>
              <div className="mt-1 text-xs text-ink-mute">{p.subtitle ? `${p.subtitle} · ` : ""}{p.retailerCount} {p.retailerCount === 1 ? "store" : "stores"} · compare →</div>
            </div>
            <div className="shrink-0 text-right"><span className="block text-xs text-ink-mute">from</span><span className="price text-xl">{money(p.bestPrice, region)}</span></div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PaidButtons({ region, query, tag }: { region: RegionId; query: string; tag: string }) {
  const amazon = amazonLink(region, query, `gta6-${tag}`);
  return (
    <>
      {amazon && <a href={amazon} target="_blank" rel={AMAZON_REL} data-buy="amazon" data-buy-kind={`amazon-gta6-${tag}`} data-buy-product={`gta6-${tag}`} data-amazon={`gta6-${tag}`} className={btn}>Amazon ↗</a>}
      <a href={ebaySearch(query, { condition: "new", customid: `gta6-${tag}`, region })} target="_blank" rel={SPONSORED_REL} data-buy="ebay" data-buy-kind="gta6-ebay" data-buy-product={`gta6-${tag}`} className={btn}>New on eBay ↗</a>
    </>
  );
}

export function Gta6View({ region }: { region: RegionId }) {
  const R = REGIONS[region];
  const hr = hub(region);
  const ed = GTA6_EDITIONS[hr];
  const place = IN[region];
  const consoleRows = gta6ConsoleRows(getSummaries("consoles", region));
  const consoles = gta6Consoles(getSummaries("consoles", region));
  const tvs = gta6Tvs(getSummaries("tvs", region));
  const monitors = gta6Monitors(getSummaries("monitors", region));
  const faq = GTA6_FAQ(place, hr);
  const today = new Date().toISOString().slice(0, 10);
  const bfYear = seasonYear(today);
  const path = withRegion("/gta-6", region);
  const ld = [
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    {
      "@context": "https://schema.org", "@type": "ItemList", name: `Consoles that play GTA 6 in ${place}`,
      itemListElement: consoleRows.map((row, i) => ({ "@type": "ListItem", position: i + 1, name: row.model.name, ...(row.product ? { url: `${SITE}${row.product.href}` } : {}) })),
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Compare Empire", item: `${SITE}${withRegion("/", region) === "/" ? "" : withRegion("/", region)}` },
        { "@type": "ListItem", position: 2, name: "GTA 6", item: `${SITE}${path}` },
      ],
    },
  ];
  return (
    <div className={`gta ${vice.variable} container-x pb-12 pt-6 sm:pt-10`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <header className="gta-hero relative overflow-hidden rounded-3xl px-5 pb-28 pt-7 sm:px-10 sm:pb-12 sm:pt-10">
        <div className="gta-sun" aria-hidden />
        <Palm className="gta-palm gta-palm-l" />
        <Palm className="gta-palm gta-palm-r" />
        <div className="relative max-w-2xl">
          <p className="gta-script text-4xl sm:text-6xl">GTA 6</p>
          <h1 className="mt-2 text-[1.75rem] font-bold leading-[1.12] tracking-tight text-white sm:text-4xl" style={{ textWrap: "balance" }}>GTA 6 buying guide: consoles, TVs and gear in {place}</h1>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-white/90">
            Grand Theft Auto VI is out now: it launched on <b className="text-white">{day(GTA6.releaseDate, region)}</b> for {GTA6.platforms}, according to{" "}
            <a href={GTA6.source.url} rel="noopener" target="_blank" className="underline underline-offset-2">{GTA6.source.label}</a>.
            The game is the same price wherever you buy it; the console and screen under it are not. Here is what {R.adjective} stores charge today, checked {catalogDay(region)}.
          </p>
        </div>
      </header>

      <dl className="gta-facts mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4"><dt className="text-xs text-ink-mute">Out</dt><dd className="font-display text-lg font-bold">{day(GTA6.releaseDate, region)}</dd></div>
        <div className="card p-4"><dt className="text-xs text-ink-mute">Plays on</dt><dd className="font-display text-lg font-bold">PS5 and Xbox Series X|S</dd></div>
        <div className="card p-4"><dt className="text-xs text-ink-mute">Standard / Ultimate</dt><dd className="font-display text-lg font-bold">{ed.standard} / {ed.ultimate}</dd></div>
        <div className="card p-4"><dt className="text-xs text-ink-mute">PC or PS6</dt><dd className="font-display text-lg font-bold">Neither, yet</dd></div>
      </dl>
      <p className="mt-2 text-xs text-ink-mute">List prices as <a href={GTA6_PRICE_SOURCE.url} rel="noopener" target="_blank" className={link}>{GTA6_PRICE_SOURCE.label}</a> reported them.</p>

      <section className="mt-10" aria-labelledby="gta6-models">
        <h2 id="gta6-models" className={`mb-1 ${h2}`}>Every console that plays GTA 6</h2>
        <p className="mb-3 text-sm text-ink-mute">The cheapest price we found at {R.adjective} stores today. Where no store we track has one in stock, the row offers paid Amazon and eBay searches instead.</p>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-ink-mute"><tr><th className="p-3">Console</th><th className="p-3">Storage</th><th className="p-3">Cheapest today</th></tr></thead>
            <tbody>
              {consoleRows.map(({ model, product }) => (
                <tr key={model.key} className="border-t border-line align-top">
                  <td className="p-3"><div className="font-semibold">{model.name}</div><div className="text-xs text-ink-mute">{model.note}</div></td>
                  <td className="p-3 whitespace-nowrap">{model.storage}</td>
                  <td className="p-3">
                    {product ? (
                      <Link prefetch={false} href={product.href} className="font-semibold underline decoration-line underline-offset-2">{money(product.bestPrice, region)} · {product.retailerCount} {product.retailerCount === 1 ? "store" : "stores"} →</Link>
                    ) : (
                      <div className="flex flex-wrap gap-2"><span className="w-full text-xs text-ink-mute">Not in stock at a store we track</span><PaidButtons region={region} query={model.query} tag={`console-${model.key}`} /></div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="gta6-consoles">
        <h2 id="gta6-consoles" className={`mb-3 ${h2}`}>PS5 and Xbox consoles at {R.adjective} stores</h2>
        {consoles.length === 0 ? (
          <p className="text-sm text-ink-mute">No {R.adjective} store we track lists one of these consoles in stock today. <Link prefetch={false} href={withRegion("/consoles", region)} className="underline">See all consoles</Link>.</p>
        ) : (
          <ProductGrid items={consoles} region={region} />
        )}
      </section>

      <section className="mt-10 max-w-2xl" aria-labelledby="gta6-ps6">
        <h2 id="gta6-ps6" className={`mb-2 ${h2}`}>Is there a PS6? Should I wait?</h2>
        <p className="text-sm text-ink-soft">
          No PS6 is on sale, and Sony has not set a date: its chief executive has said the launch timing is still undecided (<a href={PS6_SOURCE.url} rel="noopener" target="_blank" className={link}>{PS6_SOURCE.label}</a>).
          GTA 6 is made for the PS5 and Xbox Series X|S you can buy today. If you want the most headroom, the PS5 Pro and Xbox Series X are each maker&rsquo;s most powerful model; the regular PS5 and Series S play the same game.
        </p>
      </section>

      {tvs.length >= 3 && (
        <section className="mt-10" aria-labelledby="gta6-tvs">
          <h2 id="gta6-tvs" className={`mb-1 ${h2}`}>TVs that show 4K at 120Hz or more</h2>
          <p className="mb-3 text-sm text-ink-mute">The refresh rate each store&rsquo;s own listing states, sold by two or more stores. Check the TV has an HDMI 2.1 port for 120Hz from a console.</p>
          <ProductGrid items={tvs} region={region} />
          <p className="mt-3 text-sm text-ink-mute"><Link prefetch={false} href={withRegion("/tvs", region)} className="underline">Compare every TV</Link></p>
        </section>
      )}

      {monitors.length >= 3 && (
        <section className="mt-10" aria-labelledby="gta6-monitors">
          <h2 id="gta6-monitors" className={`mb-1 ${h2}`}>Monitors for a desk setup: 4K at 120Hz or more</h2>
          <p className="mb-3 text-sm text-ink-mute">For a console at a desk. The refresh rate is the store listing&rsquo;s own; a console needs HDMI 2.1 to reach 120Hz.</p>
          <ProductGrid items={monitors} region={region} />
          <p className="mt-3 text-sm text-ink-mute"><Link prefetch={false} href={withRegion("/monitors", region)} className="underline">Compare every monitor</Link></p>
        </section>
      )}

      <section className="mt-10" aria-labelledby="gta6-extras">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 id="gta6-extras" className={h2}>Controllers, storage, collectibles and subscriptions</h2>
          <span className="text-[11px] uppercase tracking-wide text-ink-mute">Ad · affiliate links</span>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {GTA6_ACCESSORIES.map((a) => (
            <li key={a.key} className="card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1"><div className="font-semibold">{a.title}</div><div className="text-xs text-ink-mute">{a.note}</div></div>
              <PaidButtons region={region} query={a.query} tag={a.key} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-ink-mute">
          {amazonLink(region, "x") ? `${AMAZON_DISCLOSURE} ` : ""}We may earn a commission on these links. It never changes our price rankings. We never link discounted game-key resellers. <Link prefetch={false} href="/disclosure" className="underline">How we make money</Link>
        </p>
      </section>

      <section className="mt-10 max-w-2xl" aria-labelledby="gta6-bf">
        <h2 id="gta6-bf" className={`mb-2 ${h2}`}>Black Friday and Cyber Monday</h2>
        <p className="text-sm text-ink-soft">
          Black Friday {bfYear} is {longDate(blackFriday(bfYear))} and Cyber Monday is {longDate(cyberMonday(bfYear))}. Our <Link prefetch={false} href={withRegion("/black-friday", region)} className="underline">Black Friday page</Link> lists
          today&rsquo;s real price drops on consoles, TVs and headphones, checked against what the stores asked before. No made-up &ldquo;was&rdquo; prices.
        </p>
      </section>

      <section className="mt-10 max-w-2xl" aria-labelledby="gta6-faq">
        <h2 id="gta6-faq" className={`mb-3 ${h2}`}>GTA 6 questions</h2>
        <dl className="space-y-4">{faq.map((f) => <div key={f.q}><dt className="font-semibold">{f.q}</dt><dd className="text-sm text-ink-soft">{f.a}</dd></div>)}</dl>
        <p className="mt-6 text-xs text-ink-mute">Compare Empire is not affiliated with, endorsed by or sponsored by Rockstar Games, Take-Two Interactive, Sony or Microsoft. Game and console names belong to their owners.</p>
      </section>

      <div className="mt-10"><InlineAds /></div>
    </div>
  );
}
