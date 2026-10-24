import type { Metadata } from "next";
import { ProductView, productMetadata, productParams, type ProductParams } from "@/views/ProductView";

export const dynamicParams = false;
export const generateStaticParams = () => productParams("uk");
export const generateMetadata = ({ params }: { params: ProductParams }): Promise<Metadata> => productMetadata(params, "uk");

export default function ProductPage({ params }: { params: ProductParams }) {
  return <ProductView params={params} region="uk" />;
}
