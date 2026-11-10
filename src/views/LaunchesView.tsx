import Link from "next/link";
import { catalogDay, getSummaries } from "@/lib/catalog";
import { launchCalendar, storePreorders, type CalendarLaunch, type StorePreorder } from "@/lib/launches";
import { money, REGIONS, type RegionId } from "@/lib/region";

// The launch calendar (owner, 2026-11-03: a fresh pipeline of new products, the hype launches first). Every launch in
// content/launches.ts with the maker's dates, its source, and the region's cheapest store price today. Static.
const day = (iso: string, region: RegionId) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(REGIONS[region].locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function Row({ r, region }: { r: CalendarLaunch; region: RegionId }) {
  const { launch, product, status } = r;
  return (
    <li className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="img-tile grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg">
          {product?.image && <img src={product.image} alt={product.name} loading="lazy" className="product-img h-full w-full object-contain p-2" />}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-ink-mute">{launch.brand}</div>
          <h3 className="font-display text-lg font-bold leading-tight">{launch.name}</h3>
          <div className="text-sm text-ink-soft">{launch.tagline}</div>
          <div className="mt-1 text-xs text-ink-mute">
            {launch.preorderFrom && <>Pre-orders from {day(launch.preorderFrom, region)} · </>}
            <span className={`font-semibold ${status === "pre-order" ? "text-brand" : "text-save"}`}>{status === "pre-order" ? "Out" : "Released"} {day(launch.releaseDate, region)}</span>
            {" · "}
            <a href={launch.source.url} rel="noopener" target="_blank" className="underline decoration-line underline-offset-2 hover:text-ink">{launch.source.label}</a>
          </div>
        </div>
      </div>
      {product ? (
        <Link prefetch={false} href={product.href} className="flex shrink-0 items-center justify-between gap-4 rounded-lg border border-line px-4 py-3 transition hover:shadow-lift sm:flex-col sm:items-end sm:gap-0">
          <span className="text-xs text-ink-mute">from</span>
          <span className="price text-xl">{money(product.bestPrice, region)}</span>
          <span className="text-xs text-ink-mute">{product.retailerCount} {product.retailerCount === 1 ? "store" : "stores"} · compare →</span>
        </Link>
      ) : (
        <div className="shrink-0 text-sm text-ink-mute">No {REGIONS[region].adjective} store lists it yet</div>
      )}
    </li>
  );
}

function PreorderRow({ r, region }: { r: StorePreorder; region: RegionId }) {
  const { product, stores } = r;
  return (
    <li className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="img-tile grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg">
          {product.image && <img src={product.image} alt={product.name} loading="lazy" className="product-img h-full w-full object-contain p-2" />}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-ink-mute">{product.brand}</div>
          <h3 className="font-display text-lg font-bold leading-tight">{product.name}</h3>
          <div className="text-sm text-ink-soft">{product.subtitle}</div>
          <div className="mt-1 text-xs font-semibold text-brand">Pre-order open at {stores} {stores === 1 ? "store" : "stores"}</div>
        </div>
      </div>
      <Link prefetch={false} href={product.href} className="flex shrink-0 items-center justify-between gap-4 rounded-lg border border-line px-4 py-3 transition hover:shadow-lift sm:flex-col sm:items-end sm:gap-0">
        <span className="text-xs text-ink-mute">from</span>
        <span className="price text-xl">{money(product.bestPrice, region)}</span>
        <span className="text-xs text-ink-mute">{product.retailerCount} {product.retailerCount === 1 ? "store" : "stores"} · compare →</span>
      </Link>
    </li>
  );
}

export function LaunchesView({ region }: { region: RegionId }) {
  const { soon, out } = launchCalendar(region, catalogDay(region), getSummaries);
  // Whatever the stores opened pre-orders for on their own (lib/preorders.ts): found in the import, no entry needed.
  const pre = storePreorders(region, catalogDay(region), getSummaries).slice(0, 24);
  return (
    <div className="container-x pb-12 pt-10">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">New phone launches</h1>
        <p className="mt-2 text-ink-mute">
          The big launches, with the release dates from each maker&apos;s own announcement, and what {REGIONS[region].adjective} stores charge for them today. Prices are
          checked every day; we never list a price before a store does.
        </p>
      </div>
      {soon.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-xl font-bold tracking-tight">Coming soon</h2>
          <ul className="grid gap-3">{soon.map((r) => <Row key={r.launch.key} r={r} region={region} />)}</ul>
        </section>
      )}
      {pre.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-1 font-display text-xl font-bold tracking-tight">On pre-order at {REGIONS[region].adjective} stores now</h2>
          <p className="mb-3 text-sm text-ink-mute">Found in the stores&apos; own listings each morning: every product a store is taking pre-orders for, most stores first. Ship dates are on each store&apos;s page.</p>
          <ul className="grid gap-3">{pre.map((r) => <PreorderRow key={`${r.product.category}/${r.product.slug}`} r={r} region={region} />)}</ul>
        </section>
      )}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl font-bold tracking-tight">Out now</h2>
        <ul className="grid gap-3">{out.map((r) => <Row key={r.launch.key} r={r} region={region} />)}</ul>
      </section>
    </div>
  );
}
