import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DealsView } from "@/components/DealsView";
import { InlineAds } from "@/components/InlineAds";
import { activeCategories } from "@/lib/catalog";
import { categoryById } from "@/lib/categories";
import { ogImage } from "@/lib/og";
import { hubLanguages } from "@/views/region-meta";
import type { CategoryId } from "@/lib/types";

type Params = Promise<{ category: string }>;
export const dynamicParams = false;
export const generateStaticParams = () => activeCategories("sg").map((c) => ({ category: c.id }));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const c = categoryById((await params).category);
  if (!c) return {};
  return {
    title: `${c.name} deals in Singapore today — real savings only`,
    description: `The best ${c.name.toLowerCase()} deals in Singapore today, checked against every store's real price and our price history. No sponsored spots.`,
    alternates: { canonical: `/sg/deals/${c.id}`, languages: hubLanguages(`/deals/${c.id}`, (r) => activeCategories(r).some((x) => x.id === c.id)) },
    openGraph: { images: [{ url: ogImage({ title: `${c.name} deals today`, category: c.name, region: "sg" }), width: 1200, height: 630 }] },
  };
}

export default async function CategoryDealsPage({ params }: { params: Params }) {
  const c = categoryById((await params).category);
  if (!c) notFound();
  return (
    <>
      <DealsView category={c.id as CategoryId} region="sg" />
      <div className="container-x pb-4">
        <InlineAds />
      </div>
    </>
  );
}
