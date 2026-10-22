import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PhoneBrowser } from "@/components/PhoneBrowser";
import { activeCategories, activeRetailers, getSummaries } from "@/lib/catalog";
import { categoryById, CATEGORIES, DEPARTMENTS } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";

export const dynamicParams = false;
export const generateStaticParams = () => activeCategories().map((c) => ({ category: c.id }));

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const c = categoryById((await params).category);
  if (!c) return {};
  const stores = activeRetailers(c.id as CategoryId);
  return {
    title: `${c.name} — compare prices in Australia`,
    description: `Compare ${c.noun} prices across ${stores.length} Australian stores including ${stores.slice(0, 4).map((r) => r.name).join(", ")}. ${c.blurb} Price history on every product.`,
    alternates: { canonical: `/${c.id}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const c = categoryById((await params).category);
  if (!c) notFound();
  const id = c.id as CategoryId;
  const products = getSummaries(id);
  const stores = activeRetailers(id);
  const dept = DEPARTMENTS.find((d) => d.id === c.department)!;
  const siblings = CATEGORIES.filter((x) => x.department === c.department && x.live && x.id !== c.id);
  return (
    <div className="container-x pt-8">
      <nav className="mb-4 text-sm text-ink-mute" aria-label="Breadcrumb">
        <Link href="/categories" className="hover:text-ink">All categories</Link> / <span>{dept.name}</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span className="mr-2">{c.emoji}</span>
            {c.name}
          </h1>
          <p className="mt-2 max-w-2xl text-ink-mute">
            {products.length.toLocaleString()} products across {stores.length} Australian stores. {c.blurb}
          </p>
        </div>
        {siblings.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {siblings.map((s) => (
              <Link key={s.id} href={s.href} className="chip text-xs">{s.emoji} {s.name}</Link>
            ))}
          </div>
        )}
      </div>
      <div className="mt-8">
        <Suspense>
          <PhoneBrowser phones={products} category={id} />
        </Suspense>
      </div>
    </div>
  );
}
