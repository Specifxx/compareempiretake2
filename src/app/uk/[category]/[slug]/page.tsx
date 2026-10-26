import type { Metadata } from "next";
import { ProductView, productMetadata, type ProductParams } from "@/views/ProductView";

export const dynamic = "force-dynamic"; // rendered on request, held by Vercel's CDN (next.config.mjs). Never ISR: see DECISIONS 2026-10-26.
export const generateMetadata = ({ params }: { params: ProductParams }): Promise<Metadata> => productMetadata(params, "uk");

export default function ProductPage({ params }: { params: ProductParams }) {
  return <ProductView params={params} region="uk" />;
}
