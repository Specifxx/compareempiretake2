import type { Metadata } from "next";
import { ProductView, productMetadata, productParams, type ProductParams } from "@/views/ProductView";

export const dynamicParams = false;
export const generateStaticParams = () => productParams("au");
export const generateMetadata = ({ params }: { params: ProductParams }): Promise<Metadata> => productMetadata(params, "au");

export default function ProductPage({ params }: { params: ProductParams }) {
  return <ProductView params={params} region="au" />;
}
