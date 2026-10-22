import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PhoneBrowser } from "@/components/PhoneBrowser";
import { getBrands, getSummaries } from "@/lib/catalog";

export const dynamicParams = false;
export function generateStaticParams() {
  return getBrands().map((b) => ({ brand: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const slug = (await params).brand;
  const brand = getBrands().find((x) => x.slug === slug);
  if (!brand) return {};
  return {
    title: `${brand.brand} phone prices in Australia`,
    description: `Compare prices on ${brand.count} ${brand.brand} phones across Australian retailers, from $${brand.from.toLocaleString("en-AU")}.`,
    alternates: { canonical: `/brands/${brand.slug}` },
  };
}

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const slug = (await params).brand;
  const brand = getBrands().find((b) => b.slug === slug);
  if (!brand) notFound();
  const phones = getSummaries().filter((p) => p.brand === brand.brand);
  return (
    <div className="container-x pt-10">
      <div className="eyebrow">Brand</div>
      <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{brand.brand} phones</h1>
      <p className="mt-2 text-ink-mute">{phones.length} {brand.brand} phones, from ${brand.from.toLocaleString("en-AU")}.</p>
      <div className="mt-8">
        <Suspense>
          <PhoneBrowser phones={phones} fixedBrand={brand.brand} />
        </Suspense>
      </div>
    </div>
  );
}
