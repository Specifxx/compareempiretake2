import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { PhoneBrowser } from "@/components/PhoneBrowser";
import { gridProps, gridSrc } from "@/lib/browse";
import { getBrands, getProducts, getSummaries, gridVersion, movedBrandSlug, movedBrandSlugs } from "@/lib/catalog";
import { brandIndexable } from "@/lib/indexing";
import Link from "next/link";
import { SITE } from "@/lib/site";

// A brand the focus cull (lib/focus.ts) or the stores left with no products 301s to the brand list; only that
// redirect renders on request (kept until the next deploy), every live brand is prerendered.
export const dynamicParams = true;
export function generateStaticParams() {
  // Plus each spelling that folded into another (lib/product-names.ts foldBrands): its old URL redirects.
  return [...getBrands().map((b) => b.slug), ...movedBrandSlugs()].map((brand) => ({ brand }));
}

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const slug = (await params).brand;
  const brand = getBrands().find((x) => x.slug === slug);
  if (!brand) return {};
  return {
    title: `${brand.brand} prices in Australia`,
    description: `Compare prices on ${brand.count} ${brand.brand} products across Australian retailers, from $${brand.from.toLocaleString("en-AU")}.`,
    alternates: { canonical: `/brands/${brand.slug}` },
    // A brand whose every product is sold by one store (or sold out) is a thin list: live, linked, not indexed.
    ...(brandIndexable(getProducts().filter((p) => p.brand === brand.brand)) ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const slug = (await params).brand;
  const brand = getBrands().find((b) => b.slug === slug);
  if (!brand) {
    const to = movedBrandSlug(slug);
    permanentRedirect(to ? `/brands/${to}` : "/brands");
  }
  const phones = getSummaries().filter((p) => p.brand === brand.brand);
  return (
    <div className="container-x pt-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
              { "@type": "ListItem", position: 2, name: "Brands", item: `${SITE}/brands` },
              { "@type": "ListItem", position: 3, name: brand.brand, item: `${SITE}/brands/${brand.slug}` },
            ],
          }).replace(/</g, "\\u003c"),
        }}
      />
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-ink-mute">
        <Link prefetch={false} href="/" className="hover:text-brand">Home</Link> / <Link prefetch={false} href="/brands" className="hover:text-brand">Brands</Link> / <span>{brand.brand}</span>
      </nav>
      <div className="eyebrow">Brand</div>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">{brand.brand}</h1>
      <p className="mt-2 text-ink-mute">{phones.length} {brand.brand} products across {brand.categories.length} {brand.categories.length === 1 ? "category" : "categories"}, from ${brand.from.toLocaleString("en-AU")}.</p>
      <div className="mt-8">
        {/* The first page only; the full list is a static file the browser loads (lib/browse.ts). */}
        <PhoneBrowser key={brand.slug} {...gridProps(phones, "all", { brands: false, cats: true, src: gridSrc.brand(brand.slug), version: gridVersion() })} fixedBrand={brand.brand} category="all" showCategory />
      </div>
    </div>
  );
}
