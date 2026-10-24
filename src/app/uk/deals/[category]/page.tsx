import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DealsView } from "@/components/DealsView";
import { EbayStrip } from "@/components/EbayStrip";
import { activeCategories } from "@/lib/catalog";
import { categoryById } from "@/lib/categories";
import { ogImage } from "@/lib/og";
import type { CategoryId } from "@/lib/types";

type Params = Promise<{ category: string }>;
export const dynamicParams = false;
export const generateStaticParams = () => activeCategories("uk").map((c) => ({ category: c.id }));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const c = categoryById((await params).category);
  if (!c) return {};
  return {
    title: `${c.name} deals in the UK today — real savings only`,
    description: `The best ${c.name.toLowerCase()} deals in the UK today, checked against every store's real price and our price history. No sponsored spots.`,
    alternates: { canonical: `/uk/deals/${c.id}` },
    openGraph: { images: [{ url: ogImage({ title: `${c.name} deals today`, category: c.name, region: "uk" }), width: 1200, height: 630 }] },
  };
}

export default async function CategoryDealsPage({ params }: { params: Params }) {
  const c = categoryById((await params).category);
  if (!c) notFound();
  return (
    <>
      <DealsView category={c.id as CategoryId} region="uk" />
      <div className="container-x pb-4">
        <EbayStrip query={c.noun} label={c.name.toLowerCase()} customid={`uk-deals-${c.id}`} phones={c.id === "phones"} region="uk" />
      </div>
    </>
  );
}
