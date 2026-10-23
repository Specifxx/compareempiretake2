import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PhoneCard } from "@/components/PhoneCard";
import { PhoneOffers } from "@/components/PhoneOffers";
import { PriceChart } from "@/components/PriceChart";
import { checkVariant, getCatalog, getProduct, getProducts, getVsPairs, similarPhones, summarise, activeCategories } from "@/lib/catalog";
import { categoryById } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";
import { storageLabel } from "@/lib/normalize";
import { RETAILERS } from "@/lib/retailers";
import { SITE } from "@/lib/site";
import { ogImage } from "@/lib/og";
import { NewsletterSignup } from "@/components/NewsletterSignup";

export const dynamicParams = false;
export function generateStaticParams() {
  return activeCategories().flatMap((c) => getProducts(c.id as CategoryId).map((p) => ({ category: c.id, slug: p.slug })));
}

type Params = Promise<{ category: string; slug: string }>;
const load = async (params: Params) => {
  const { category, slug } = await params;
  return getProduct(category as CategoryId, slug);
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await load(params);
  if (!p) return {};
  const cheapest = p.variants.flatMap((v) => v.offers).filter((o) => o.inStock && o.price === p.bestPrice)[0];
  const store = cheapest ? ` at ${RETAILERS[cheapest.retailer].name}` : "";
  const title = `${p.name} price in Australia — from $${p.bestPrice.toLocaleString("en-AU")}${store}`;
  const description = `${p.name} from $${p.bestPrice.toLocaleString("en-AU")}. Compare ${p.offerCount} live prices across ${p.retailerCount} retailers in ${p.variants.length > 1 ? `${p.variants.map((v) => v.label).join(", ")}, ` : ""}with price history.`;
  return {
    title,
    description,
    alternates: { canonical: `/${p.category}/${p.slug}` },
    openGraph: { title, description, images: [{ url: shareCard(p), width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [shareCard(p)] },
  };
}

function shareCard(p: NonNullable<Awaited<ReturnType<typeof load>>>) {
  const v = p.variants.reduce((a, b) => (a.bestPrice <= b.bestPrice ? a : b));
  const check = checkVariant(p, v).check;
  return ogImage({
    title: p.name,
    price: p.bestPrice,
    stores: p.retailerCount,
    verdict: check.verdict === "new" ? undefined : check.headline,
    image: p.image,
    category: categoryById(p.category)?.name,
  });
}

export default async function ProductPage({ params }: { params: Params }) {
  const phone = await load(params);
  if (!phone) notFound();
  const checks = Object.fromEntries(phone.variants.map((v) => [v.id, checkVariant(phone, v)]));
  const chart = Object.fromEntries(
    phone.variants.map((v) => [
      v.id,
      <div key={v.id}>
        <div className="mb-3 text-xs font-medium text-ink-mute">{checks[v.id].check.chartLabel}</div>
        <PriceChart points={checks[v.id].check.points} />
      </div>,
    ]),
  );
  const similar = similarPhones(phone).map(summarise);
  const vs = phone.category === "phones" ? getVsPairs().filter((v) => v.a.slug === phone.slug || v.b.slug === phone.slug) : [];
  const cat = categoryById(phone.category)!;
  const { updatedAt } = getCatalog();
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
      priceCurrency: "AUD",
      lowPrice: phone.bestPrice,
      highPrice: Math.max(...phone.variants.flatMap((v) => v.offers.map((o) => o.price))),
      offerCount: phone.offerCount,
      url: `${SITE}/${phone.category}/${phone.slug}`,
    },
  };

  return (
    <div className="container-x pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-6 flex items-center gap-2 text-sm text-ink-mute" aria-label="Breadcrumb">
        <Link href={cat.href} className="hover:text-ink">{cat.name}</Link>
        <span>/</span>
        <Link href={`/brands/${phone.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="hover:text-ink">{phone.brand}</Link>
        <span>/</span>
        <span className="truncate text-ink">{phone.model}</span>
      </nav>

      <Suspense>
        <PhoneOffers phone={phone} chart={chart} checks={checks} />
      </Suspense>

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
            {phone.blurb ? <p>{phone.blurb}</p> : <p>{phone.name} is sold new by {phone.retailerCount} of the Australian retailers we check.</p>}
            <p>
              We found <b className="text-ink">{phone.offerCount} listings</b> for this phone across{" "}
              <b className="text-ink">{phone.retailerCount} {phone.retailerCount === 1 ? "store" : "stores"}</b>, in {phone.variants.length}{" "}
              {phone.variants.length === 1 ? "option" : "options"}
              {phone.colours.length > 1 ? ` and ${phone.colours.length} colours` : ""}. Last checked{" "}
              {new Date(updatedAt).toLocaleDateString("en-AU", { timeZone: "Australia/Sydney", day: "numeric", month: "long" })}.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-16"><NewsletterSignup compact /></div>

      {vs.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight">Compare the {phone.model}</h2>
          <div className="flex flex-wrap gap-2">
            {vs.map((v) => {
              const other = v.a.slug === phone.slug ? v.b : v.a;
              return <Link key={v.slug} href={`/compare/${v.slug}`} className="chip">vs {other.name}</Link>;
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
