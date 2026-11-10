import Link from "next/link";
import { catalogDay, getSummaries } from "@/lib/catalog";
import { amazonLink, AMAZON_DISCLOSURE, AMAZON_REL } from "@/lib/amazon";
import { ebaySearch, SPONSORED_REL } from "@/lib/ebay";
import { GTA6, GTA6_ACCESSORIES, GTA6_FAQ, gta6Consoles } from "@/lib/gta6";
import { money, REGIONS, withRegion, type RegionId } from "@/lib/region";

// The GTA 6 shopping hub (lib/gta6.ts). Consoles come from the day's store prices; accessories are labelled paid searches.
const day = (iso: string, region: RegionId) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(REGIONS[region].locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const IN: Record<RegionId, string> = { au: "Australia", us: "the US", uk: "the UK", ca: "Canada", sg: "Singapore" };

export function Gta6View({ region }: { region: RegionId }) {
  const consoles = gta6Consoles(getSummaries("consoles", region));
  const R = REGIONS[region];
  const faq = GTA6_FAQ(IN[region]);
  return (
    <div className="container-x pb-12 pt-10">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">GTA 6 consoles: PS5 and Xbox prices in {IN[region]}</h1>
        <p className="mt-2 text-ink-mute">
          Grand Theft Auto VI launches on <b className="text-ink">{day(GTA6.releaseDate, region)}</b> for {GTA6.platforms}, according to{" "}
          <a href={GTA6.source.url} rel="noopener" target="_blank" className="underline decoration-line underline-offset-2 hover:text-ink">{GTA6.source.label}</a>.
          The game is the same price wherever you buy it; the console under it is not. Here is what {R.adjective} stores charge for each one today, checked {catalogDay(region)}.
        </p>
      </div>

      <section className="mt-8" aria-labelledby="gta6-consoles">
        <h2 id="gta6-consoles" className="mb-3 font-display text-xl font-bold tracking-tight">PS5 and Xbox consoles</h2>
        {consoles.length === 0 ? (
          <p className="text-sm text-ink-mute">No {R.adjective} store lists one of these consoles in stock today. <Link prefetch={false} href={withRegion("/consoles", region)} className="underline">See all consoles</Link>.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {consoles.map((p) => (
              <li key={p.href}>
                <Link prefetch={false} href={p.href} className="card flex items-center gap-4 p-4 transition hover:shadow-lift">
                  <div className="img-tile grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg">
                    {p.image && <img src={p.image} alt={p.name} loading="lazy" className="product-img h-full w-full object-contain p-2" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-ink-mute">{p.brand}</div>
                    <h3 className="line-clamp-2 font-display text-base font-bold leading-tight">{p.name}</h3>
                    <div className="mt-1 text-xs text-ink-mute">{p.retailerCount} {p.retailerCount === 1 ? "store" : "stores"} · compare →</div>
                  </div>
                  <div className="shrink-0 text-right"><span className="block text-xs text-ink-mute">from</span><span className="price text-xl">{money(p.bestPrice, region)}</span></div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm text-ink-mute">Also compare <Link prefetch={false} href={withRegion("/tvs", region)} className="underline">TVs</Link>, <Link prefetch={false} href={withRegion("/monitors", region)} className="underline">monitors</Link> and <Link prefetch={false} href={withRegion("/headphones", region)} className="underline">headphones</Link>.</p>
      </section>

      <section className="mt-10" aria-labelledby="gta6-extras">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 id="gta6-extras" className="font-display text-xl font-bold tracking-tight">Controllers, storage and more</h2>
          <span className="text-[11px] uppercase tracking-wide text-ink-mute">Ad · affiliate links</span>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {GTA6_ACCESSORIES.map((a) => {
            const amazon = amazonLink(region, a.query, `gta6-${a.key}`);
            return (
              <li key={a.key} className="card flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1"><div className="font-semibold">{a.title}</div><div className="text-xs text-ink-mute">{a.note}</div></div>
                {amazon && <a href={amazon} target="_blank" rel={AMAZON_REL} data-buy="amazon" data-buy-kind={`amazon-gta6-${a.key}`} data-buy-product={`gta6-${a.key}`} data-amazon={`gta6-${a.key}`} className="rounded-xl border border-line bg-bg-card px-3 py-2 text-xs font-semibold hover:border-brand/40">Amazon ↗</a>}
                <a href={ebaySearch(a.query, { condition: "new", customid: `gta6-${a.key}`, region })} target="_blank" rel={SPONSORED_REL} data-buy="ebay" data-buy-kind="gta6-ebay" data-buy-product={`gta6-${a.key}`} className="rounded-xl border border-line bg-bg-card px-3 py-2 text-xs font-semibold hover:border-brand/40">New on eBay ↗</a>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[11px] text-ink-mute">
          {amazonLink(region, "x") ? `${AMAZON_DISCLOSURE} ` : ""}We may earn a commission on these links. It never changes our price rankings. <Link prefetch={false} href="/disclosure" className="underline">How we make money</Link>
        </p>
      </section>

      <section className="mt-10 max-w-2xl" aria-labelledby="gta6-faq">
        <h2 id="gta6-faq" className="mb-3 font-display text-xl font-bold tracking-tight">Questions</h2>
        <dl className="space-y-4">{faq.map((f) => <div key={f.q}><dt className="font-semibold">{f.q}</dt><dd className="text-sm text-ink-soft">{f.a}</dd></div>)}</dl>
        <p className="mt-6 text-xs text-ink-mute">Compare Empire is not affiliated with, endorsed by or sponsored by Rockstar Games or Take-Two Interactive. Game and console names belong to their owners.</p>
      </section>
    </div>
  );
}
