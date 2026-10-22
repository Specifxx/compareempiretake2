import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PhoneCard } from "@/components/PhoneCard";
import { PhoneOffers } from "@/components/PhoneOffers";
import { PriceChart } from "@/components/PriceChart";
import { checkVariant, getCatalog, getPhone, getPhones, getVsPairs, similarPhones, summarise } from "@/lib/catalog";
import { storageLabel } from "@/lib/normalize";
import { RETAILERS } from "@/lib/retailers";
import { SITE } from "@/lib/site";

export const dynamicParams = false;
export function generateStaticParams() {
  return getPhones().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getPhone((await params).slug);
  if (!p) return {};
  const cheapest = p.variants.flatMap((v) => v.offers).filter((o) => o.inStock && o.price === p.bestPrice)[0];
  const store = cheapest ? ` at ${RETAILERS[cheapest.retailer].name}` : "";
  const title = `${p.name} price in Australia — from $${p.bestPrice.toLocaleString("en-AU")}${store}`;
  const description = `${p.name} from $${p.bestPrice.toLocaleString("en-AU")}. Compare ${p.offerCount} live prices across ${p.retailerCount} retailers in ${p.variants.map((v) => storageLabel(v.storageGb)).join(", ")}, with price history.`;
  return {
    title,
    description,
    alternates: { canonical: `/phones/${p.slug}` },
    openGraph: { title, description, images: p.image ? [{ url: p.image }] : undefined },
  };
}

export default async function PhonePage({ params }: { params: Promise<{ slug: string }> }) {
  const phone = getPhone((await params).slug);
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
  const vs = getVsPairs().filter((v) => v.a.slug === phone.slug || v.b.slug === phone.slug);
  const { updatedAt } = getCatalog();
  const s = phone.specs;
  const specs: [string, string | undefined][] = [
    ["Brand", phone.brand],
    ["Storage options", phone.variants.map((v) => storageLabel(v.storageGb)).join(" · ")],
    ["Screen", s.screenInches ? `${s.screenInches}"` : undefined],
    ["Chip", s.chip],
    ["Main camera", s.mainCameraMp ? `${s.mainCameraMp}MP` : undefined],
    ["Battery", s.batteryMah ? `${s.batteryMah.toLocaleString()} mAh` : undefined],
    ["Network", s.network],
    ["Form factor", s.foldable ? "Foldable / flip" : "Bar"],
    ["SIM", s.esimOnly ? "eSIM only" : undefined],
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
      url: `${SITE}/phones/${phone.slug}`,
    },
  };

  return (
    <div className="container-x pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-6 flex items-center gap-2 text-sm text-ink-mute" aria-label="Breadcrumb">
        <Link href="/phones" className="hover:text-ink">Phones</Link>
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
            {phone.blurb ? <p>{phone.blurb}</p> : <p>{phone.name} is sold new and unlocked by {phone.retailerCount} of the Australian retailers we check.</p>}
            <p>
              We found <b className="text-ink">{phone.offerCount} listings</b> for this phone across{" "}
              <b className="text-ink">{phone.retailerCount} {phone.retailerCount === 1 ? "store" : "stores"}</b>, in {phone.variants.length}{" "}
              {phone.variants.length === 1 ? "storage size" : "storage sizes"} and {phone.colours.length || 1} {phone.colours.length === 1 ? "colour" : "colours"}. Last checked{" "}
              {new Date(updatedAt).toLocaleDateString("en-AU", { timeZone: "Australia/Sydney", day: "numeric", month: "long" })}.
            </p>
          </div>
        </div>
      </section>

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
            {similar.map((p) => <PhoneCard key={p.slug} p={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
