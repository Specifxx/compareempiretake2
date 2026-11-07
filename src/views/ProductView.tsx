import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { PhoneCard } from "@/components/PhoneCard";
import { PhoneOffers } from "@/components/PhoneOffers";
import { ReportPrice } from "@/components/ReportForms";
import { PriceChart } from "@/components/PriceChart";
import { checkVariant, getProduct, storeCheckedAt, getProducts, getSeries, getVsPairs, regionUpdatedAt, similarPhones, summarise, productHref, categoryHref } from "@/lib/catalog";
import { HOME_PATH, money, withXDefault, REGION_IDS, REGIONS, withRegion, type RegionId } from "@/lib/region";
import { categoryById } from "@/lib/categories";
import type { CategoryId, Phone } from "@/lib/types";
import { slugify, storageLabel } from "@/lib/normalize";
import { RETAILERS } from "@/lib/retailers";
import { SITE } from "@/lib/site";
import { ogImage } from "@/lib/og";
import { shareRows } from "@/lib/share-rows";
import { CATEGORY_GUIDES } from "@/lib/category-guides";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { camCompareFor } from "@/lib/family";
import { amazonFor } from "@/lib/amazon-live";
import { cleanedSlug, productIndexable, productTitle } from "@/lib/indexing";
import { guidesForCategory } from "@/lib/guides";
import { categoryPosition, priceMove } from "@/lib/product-facts";

export type ProductParams = Promise<{ category: string; slug: string }>;
const load = async (params: ProductParams, region: RegionId) => {
  const { category, slug } = await params;
  const p = getProduct(category as CategoryId, slug, region);
  if (p) return p;
  // A URL from before the catalogue decoded store titles ("bowers-amp-wilkins-…") moves to the clean slug for good
  // (lib/indexing.ts); any other unknown slug is a 404 as before.
  const clean = cleanedSlug(slug);
  if (clean && getProduct(category as CategoryId, clean, region)) permanentRedirect(withRegion(`/${category}/${clean}`, region));
  // Any other product the region no longer lists (the focus cull, lib/focus.ts, or a product the stores stopped
  // selling) moves to its category page for good, so its links and search history land on the nearest page. Only
  // when the category has products here: with none, the data files were not read (the 500 in ProductView below).
  if (getProducts(category as CategoryId, region).length) permanentRedirect(withRegion(`/${category}`, region));
  return undefined;
};
/** The product page's copy of the product, with its Amazon links and live prices (every region with a tag). */
const withAmazon = (p: Phone, region: RegionId): Phone => ({ ...p, amazon: amazonFor(p, region) });

/** hreflang links to the same product in the other regions we have it in. */
function alternates(p: Phone) {
  const langs = Object.fromEntries(
    REGION_IDS.filter((r) => getProduct(p.category, p.slug, r)).map((r) => [REGIONS[r].hreflang, withRegion(`/${p.category}/${p.slug}`, r)]),
  );
  return { canonical: productHref(p), ...(Object.keys(langs).length > 1 ? { languages: withXDefault(langs) } : {}) };
}

/** Product names that occur more than once in a region (same model, different codes): their titles get the code. */
const dupNames = new Map<RegionId, Set<string>>();
function nameFor(p: Phone, region: RegionId): string {
  if (!dupNames.has(region)) {
    const seen = new Set<string>(), dup = new Set<string>();
    for (const q of getProducts(undefined, region)) (seen.has(q.name.toLowerCase()) ? dup : seen).add(q.name.toLowerCase());
    dupNames.set(region, dup);
  }
  if (!dupNames.get(region)!.has(p.name.toLowerCase())) return p.name;
  const base = slugify(p.name);
  const extra = p.slug.startsWith(base) ? p.slug.slice(base.length).replace(/^-/, "") : "";
  const tag = extra ? extra.toUpperCase() : [p.variants[0]?.label, p.specs.extra?.[0]?.[1]].filter(Boolean).join(" ");
  return tag ? `${p.name} (${tag})` : p.name;
}

export async function productMetadata(params: ProductParams, region: RegionId): Promise<Metadata> {
  const p = await load(params, region);
  if (!p) return {};
  const R = REGIONS[region];
  const $ = (n: number) => money(n, region);
  const cheapest = p.variants.flatMap((v) => v.offers).filter((o) => o.inStock && o.price === p.bestPrice)[0];
  const store = cheapest ? RETAILERS[cheapest.retailer].name : "";
  const title = productTitle({ name: nameFor(p, region), place: ({ au: "Australia", us: "the US", uk: "the UK", ca: "Canada", sg: "Singapore" } as const)[region], price: $(p.bestPrice), store, stores: p.retailerCount });
  const description = `${nameFor(p, region)} from ${$(p.bestPrice)}${store ? ` at ${store}` : ""}. Compare ${p.offerCount} live prices across ${p.retailerCount} ${R.adjective} ${p.retailerCount === 1 ? "store" : "stores"}${p.variants.length > 1 ? ` in ${p.variants.map((v) => v.label).join(", ")}` : ""}, with price history and whether today's price is a good one.`;
  return {
    title,
    description,
    // One-store and sold-out pages stay live and linked but out of the index (lib/indexing.ts).
    ...(productIndexable(p) ? {} : { robots: { index: false, follow: true } }),
    alternates: alternates(p),
    openGraph: { title, description, url: productHref(p), images: [{ url: shareCard(p), width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [shareCard(p)] },
  };
}

function shareCard(p: Phone) {
  const v = p.variants.reduce((a, b) => (a.bestPrice <= b.bestPrice ? a : b));
  const check = checkVariant(p, v).check;
  const share = shareRows(p);
  return ogImage({
    kind: "product",
    title: nameFor(p, p.region ?? "au"),
    price: p.bestPrice,
    stores: p.retailerCount,
    verdict: check.verdict === "new" ? undefined : check.headline,
    region: p.region,
    image: p.image,
    category: categoryById(p.category)?.name,
    product: share && p.variants.length > 1 ? `${p.model} · ${share.variant.label}` : p.model,
    rows: share?.rows,
  });
}

export async function ProductView({ params, region }: { params: ProductParams; region: RegionId }) {
  const phone = await load(params, region);
  if (!phone) {
    // No products at all in the region means this function could not read its data files (tracing in
    // next.config.mjs, or the working directory), not an unknown slug. Fail with a 500, which the CDN
    // doesn't keep, rather than a 404 it would keep for a day on all ~28,000 product URLs.
    if (!getProducts(undefined, region).length) throw new Error(`No ${region} catalogue at runtime: data/ was not read`);
    notFound();
  }
  const checks = Object.fromEntries(phone.variants.map((v) => [v.id, checkVariant(phone, v)]));
  const chart = Object.fromEntries(
    phone.variants.map((v) => [
      v.id,
      <div key={v.id}>
        <div className="mb-3 text-xs font-medium text-ink-mute">{checks[v.id].check.chartLabel}</div>
        <PriceChart points={checks[v.id].check.points} region={region} />
      </div>,
    ]),
  );
  const similar = similarPhones(phone).map(summarise);
  const vs = phone.category === "phones" && region === "au" ? getVsPairs().filter((v) => v.a.slug === phone.slug || v.b.slug === phone.slug) : [];
  const cat = categoryById(phone.category)!;
  const updatedAt = regionUpdatedAt(region);
  const cam = phone.category === "cameras" ? camCompareFor(phone.name) : null;
  const R = REGIONS[region];
  const s = phone.specs;
  const specs: [string, string | undefined][] =
    phone.category === "phones"
      ? [
          ["Brand", phone.brand],
          ["Storage options", phone.variants.map((v) => v.label).join(" · ")],
          ["Screen", s.screenInches ? `${s.screenInches}"` : undefined],
          ["Chip", s.chip],
          ["Main camera", s.mainCameraMp ? `${s.mainCameraMp}MP` : undefined],
          ["Battery", s.batteryMah ? `${s.batteryMah.toLocaleString()} mAh` : undefined],
          ["Network", s.network],
          ["Form factor", s.foldable ? "Foldable / flip" : "Bar"],
          ["SIM", s.esimOnly ? "eSIM only" : undefined],
          ["Colours", phone.colours.join(", ") || undefined],
        ]
      : [
          ["Brand", phone.brand],
          ...(phone.variants.length > 1 ? ([["Options", phone.variants.map((v) => v.label).join(" · ")]] as [string, string][]) : []),
          ...(s.extra ?? []),
          ["Colours", phone.colours.join(", ") || undefined],
        ];


  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: phone.name,
    brand: { "@type": "Brand", name: phone.brand },
    image: phone.images.slice(0, 3),
    description: phone.blurb,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: R.currency,
      lowPrice: phone.bestPrice,
      highPrice: Math.max(...phone.variants.flatMap((v) => v.offers.map((o) => o.price))),
      offerCount: phone.offerCount,
      // Prices refresh on the daily import: good until tomorrow (schema.org priceValidUntil).
      priceValidUntil: new Date(Date.now() + 86400e3).toISOString().slice(0, 10),
      url: `${SITE}${productHref(phone)}`,
    },
  };

  // Facts for the price summary and FAQ, all from today's prices and our history.
  const $ = (n: number) => money(n, region);
  const outright = phone.variants.flatMap((v) => v.offers.filter((o) => o.kind !== "plan").map((o) => ({ ...o, v })));
  const inStock = outright.filter((o) => o.inStock);
  const pool = inStock.length ? inStock : outright;
  const cheapest = pool.reduce((a, b) => (b.price < a.price ? b : a), pool[0]);
  const dearest = pool.reduce((a, b) => (b.price > a.price ? b : a), pool[0]);
  const lowestEver = Math.min(...phone.variants.map((v) => v.lowestEver ?? v.bestPrice));
  // The RRP of the variant the summary leads with (the cheapest one's), when the stores state one.
  const rrpOf = (cheapest && phone.variants.find((v) => v.id === cheapest.v.id)?.rrp) || undefined;
  const stores = [...new Set(outright.map((o) => RETAILERS[o.retailer].name))];
  const mainCheck = checks[cheapest?.v.id ?? phone.variants[0].id]?.check;
  const guide = CATEGORY_GUIDES[phone.category];
  const faq: [string, string][] = cheapest
    ? [
        [
          `What is the cheapest price for the ${phone.name}?`,
          `${$(cheapest.price)} at ${RETAILERS[cheapest.retailer].name}${cheapest.v.label && phone.variants.length > 1 ? ` (${cheapest.v.label})` : ""}, the lowest ${cheapest.inStock ? "in-stock " : ""}price across the ${phone.retailerCount} ${R.adjective} ${phone.retailerCount === 1 ? "store" : "stores"} we checked on ${new Date(updatedAt).toLocaleDateString(R.locale, { timeZone: R.timeZone, day: "numeric", month: "long", year: "numeric" })}.`,
        ],
        [`Which stores sell the ${phone.name}?`, `${stores.slice(0, 8).join(", ")}${stores.length > 8 ? ` and ${stores.length - 8} more` : ""}.`],
        ...(mainCheck && mainCheck.verdict !== "new" ? ([[`Is now a good time to buy the ${phone.name}?`, `${mainCheck.headline}. ${mainCheck.detail}`]] as [string, string][]) : []),
        ...(lowestEver < cheapest.price ? ([[`What is the lowest price the ${phone.name} has been?`, `The lowest price we've recorded is ${$(lowestEver)}.`]] as [string, string][]) : []),
      ]
    : [];
  // Store by store, cheapest first: the one paragraph no two product pages share (Search Console, 2026-11-05).
  const byStore = [...new Map(inStock.sort((a, b) => a.price - b.price).map((o) => [o.retailer, o])).values()];
  const storeLine =
    byStore.length >= 2
      ? `Cheapest in stock today is ${RETAILERS[byStore[0].retailer].name} at ${$(byStore[0].price)}, then ${byStore
          .slice(1, 5)
          .map((o) => `${RETAILERS[o.retailer].name} (${$(o.price)})`)
          .join(", ")}${byStore.length > 5 ? ` and ${byStore.length - 5} more` : ""}${dearest && dearest.price > byStore[0].price ? `: a ${$(dearest.price - byStore[0].price)} gap between the cheapest and dearest store` : ""}.`
      : null;
  // Where this price sits in the category, and how it moved in our history: facts no other page carries.
  const peers = getProducts(phone.category, region).filter((q) => q.variants.some((v) => v.offers.some((o) => o.inStock && o.kind !== "plan")));
  const pos = inStock.length ? categoryPosition(phone, peers) : undefined;
  const IN = ({ au: "in Australia", us: "in the US", uk: "in the UK", ca: "in Canada", sg: "in Singapore" } as const)[region];
  const positionLine = pos
    ? pos.rank === 1
      ? `At ${$(phone.bestPrice)} it is the cheapest of the ${pos.peers} in-stock products in our ${cat.name} category ${IN}; the middle price is ${$(pos.median)}.`
      : `At ${$(phone.bestPrice)} it costs less than ${pos.cheaperThanPct}% of the ${pos.peers} in-stock products in our ${cat.name} category ${IN} (number ${pos.rank} from the cheapest); the middle price is ${$(pos.median)}.`
    : null;
  const move = priceMove(getSeries(phone));
  const moveLine = move
    ? Math.abs(move.to - move.from) < move.from * 0.005
      ? `Its best price has barely moved over the last ${move.days} days (${$(move.from)} then, ${$(move.to)} today).`
      : `Its best price has ${move.to < move.from ? "dropped" : "risen"} from ${$(move.from)} to ${$(move.to)} over the last ${move.days} days (${move.to < move.from ? "−" : "+"}${Math.abs(Math.round(((move.to - move.from) / move.from) * 100))}%).`
    : null;
  // Guides serve every region since 2026-11-06 (one post, each region's prices), so every product page links them.
  const guides = guidesForCategory(phone.category, 4);
  const crumbs = [
    { name: "Home", url: `${SITE}${HOME_PATH[region] === "/" ? "" : HOME_PATH[region]}` || SITE },
    { name: cat.name, url: `${SITE}${categoryHref(cat.id, region)}` },
    { name: phone.name, url: `${SITE}${productHref(phone)}` },
  ];
  const ld = [
    jsonLd,
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })) },
    ...(faq.length ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }] : []),
  ];

  return (
    <div className="container-x pt-6" data-no-dock>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <nav className="mb-6 flex items-center gap-2 text-sm text-ink-mute" aria-label="Breadcrumb">
        <Link prefetch={false} href={HOME_PATH[region]} className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link prefetch={false} href={categoryHref(cat.id, region)} className="hover:text-ink">{cat.name}</Link>
        <span>/</span>
        {region === "au" ? (
          <Link prefetch={false} href={`/brands/${phone.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="hover:text-ink">{phone.brand}</Link>
        ) : (
          <span>{phone.brand}</span>
        )}
        <span>/</span>
        <span className="truncate text-ink">{phone.model}</span>
      </nav>

      <Suspense>
        <PhoneOffers phone={withAmazon(phone, region)} chart={chart} checks={checks} checkedAt={storeCheckedAt(phone.category, region)} />
      </Suspense>
      <ReportPrice
        product={`${phone.brand} ${phone.model}`}
        region={region.toUpperCase()}
        buttonClassName="btn-ghost"
        stores={outright.map((o) => ({ name: `${RETAILERS[o.retailer].name}${o.v.label && phone.variants.length > 1 ? ` · ${o.v.label}` : ""}`, price: $(o.price) }))}
      />

      <section className="mt-16 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight">Key specs</h2>
          <dl className="card divide-y divide-line">
            {specs.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex gap-4 px-5 py-3.5 text-sm">
                <dt className="w-36 shrink-0 text-ink-mute">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight">About the {phone.model}</h2>
          <div className="card space-y-3 p-5 text-sm leading-relaxed text-ink-soft">
            {phone.blurb ? <p>{phone.blurb}</p> : <p>{phone.name} is sold new by {phone.retailerCount} of the {R.adjective} retailers we check.</p>}
            {cam && (
              // Hand-off to the camera specialist (DECISIONS.md "Sites that grow each other"): the same model only (lib/family-network.ts sameProduct).
              <p>
                Comparing cameras? <a href={cam.url} rel="noopener" className="font-semibold text-ink hover:underline">The {phone.model} on CamCompare</a> has its full specs, used and refurbished prices, and the cameras buyers compare it with.
              </p>
            )}
            {storeLine && <p>{storeLine}</p>}
            {positionLine && <p>{positionLine}</p>}
            {moveLine && <p>{moveLine}</p>}
            <p>
              We found <b className="text-ink">{phone.offerCount} {phone.offerCount === 1 ? "listing" : "listings"}</b> for the {phone.model} across{" "}
              <b className="text-ink">{phone.retailerCount} {phone.retailerCount === 1 ? "store" : "stores"}</b>, in {phone.variants.length}{" "}
              {phone.variants.length === 1 ? "option" : "options"}
              {phone.colours.length > 1 ? ` and ${phone.colours.length} colours` : ""}. Last checked{" "}
              {new Date(updatedAt).toLocaleDateString(R.locale, { timeZone: R.timeZone, day: "numeric", month: "long" })}.
            </p>
          </div>
        </div>
      </section>

      {cheapest && (
        <section className="mt-16 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight">{phone.model} price summary</h2>
            <dl className="card divide-y divide-line">
              {([
                ["Cheapest today", `${$(cheapest.price)} at ${RETAILERS[cheapest.retailer].name}`],
                ...(dearest && dearest.price > cheapest.price ? ([["Price range across stores", `${$(cheapest.price)} to ${$(dearest.price)}`]] as [string, string][]) : []),
                ...(phone.variants.length > 1 ? ([["Options", phone.variants.map((v) => `${v.label} from ${$(v.bestPrice)}`).join(" · ")]] as [string, string][]) : []),
                ...(rrpOf ? ([["RRP", `${$(rrpOf.price)}, as ${rrpOf.stores} stores list it`]] as [string, string][]) : []),
                ["Lowest we've recorded", $(lowestEver)],
                ["Stores with it in stock", `${new Set(inStock.map((o) => o.retailer)).size} of ${phone.retailerCount}`],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex gap-4 px-5 py-3.5 text-sm">
                  <dt className="w-44 shrink-0 text-ink-mute">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          {guide && (
            <div>
              <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight">Before you buy</h2>
              <ul className="card space-y-3 p-5 text-sm leading-relaxed text-ink-soft">
                {guide.tips.map((t) => <li key={t} className="flex gap-2"><span className="text-brand">✓</span><span>{t}</span></li>)}
              </ul>
            </div>
          )}
        </section>
      )}

      {faq.length > 0 && (
        <section className="mt-16 max-w-3xl">
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight">{phone.model} FAQ</h2>
          <div className="card divide-y divide-line">
            {faq.map(([q, a]) => (
              <details key={q} className="group px-5 py-4" open>
                <summary className="cursor-pointer list-none font-semibold">{q}</summary>
                <p className="mt-2 text-sm text-ink-soft">{a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {guides.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight">{cat.name} guides</h2>
          <div className="flex flex-wrap gap-2">
            {guides.map((g) => <Link prefetch={false} key={g.slug} href={`/guides/${g.slug}`} className="chip">{g.title}</Link>)}
            {region === "au" && <Link prefetch={false} href={`/brands/${phone.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="chip">All {phone.brand} prices</Link>}
          </div>
        </section>
      )}

      <div className="mt-16"><NewsletterSignup compact /></div>

      {vs.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight">Compare the {phone.model}</h2>
          <div className="flex flex-wrap gap-2">
            {vs.map((v) => {
              const other = v.a.slug === phone.slug ? v.b : v.a;
              return <Link prefetch={false} key={v.slug} href={`/compare/${v.slug}`} className="chip">vs {other.name}</Link>;
            })}
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight">Similar price range</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {similar.map((p) => <PhoneCard key={p.href} p={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
