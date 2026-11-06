import { BrowseCategory, browseCategoryParams, browseMetadata } from "@/views/BrowseView";

type Params = Promise<{ category: string }>;
export const dynamicParams = false;
export const generateStaticParams = () => browseCategoryParams("sg");
export const generateMetadata = ({ params }: { params: Params }) => browseMetadata(params, "sg");
export default function Page({ params }: { params: Params }) {
  return <BrowseCategory params={params} region="sg" />;
}
