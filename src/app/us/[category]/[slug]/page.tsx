import type { Metadata } from "next";
import { ProductView, productMetadata, productParams, type ProductParams } from "@/views/ProductView";

export const dynamicParams = false;
export const generateStaticParams = () => productParams("us");
export const generateMetadata = ({ params }: { params: ProductParams }): Promise<Metadata> => productMetadata(params, "us");

export default function ProductPage({ params }: { params: ProductParams }) {
  return <ProductView params={params} region="us" />;
}
