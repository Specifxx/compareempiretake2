import type { Metadata } from "next";
import { CategoryView, categoryMetadata, categoryParams, type CategoryParams } from "@/views/CategoryView";

export const dynamicParams = false;
export const generateStaticParams = () => categoryParams("us");
export const generateMetadata = ({ params }: { params: CategoryParams }): Promise<Metadata> => categoryMetadata(params, "us");

export default function CategoryPage({ params }: { params: CategoryParams }) {
  return <CategoryView params={params} region="us" />;
}
