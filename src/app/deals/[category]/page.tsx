import { EbayStrip } from "@/components/EbayStrip";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DealsView } from "@/components/DealsView";
import { activeCategories } from "@/lib/catalog";
import { categoryById } from "@/lib/categories";
import { ogImage } from "@/lib/og";
import type { CategoryId } from "@/lib/types";

export const dynamicParams = false;
export const generateStaticParams = () => activeCategories().map((c) => ({ category: c.id }));

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const c = categoryById((await params).category);
  if (!c) return {};
  const title = `${c.name} deals in Australia today — real savings only`;
  return {
    title,
    description: `The best ${c.name.toLowerCase()} deals in Australia today, checked against every store's real price and our price history. No sponsored spots.`,
    alternates: { canonical: `/deals/${c.id}` },
    openGraph: { images: [{ url: ogImage({ title: `${c.name} deals today`, category: c.name }), width: 1200, height: 630 }] },
  };
}

export default async function CategoryDealsPage({ params }: { params: Promise<{ category: string }> }) {
  const c = categoryById((await params).category);
  if (!c) notFound();
  return (
    <>
      <DealsView category={c.id as CategoryId} />
      <div className="container-x pb-4">
        <EbayStrip query={c.noun} label={c.name.toLowerCase()} customid={`deals-${c.id}`} phones={c.id === "phones"} />
      </div>
    </>
  );
}
