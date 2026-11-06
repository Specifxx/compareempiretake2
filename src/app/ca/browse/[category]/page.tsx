import { BrowseCategory, browseCategoryParams, browseMetadata } from "@/views/BrowseView";

type Params = Promise<{ category: string }>;
export const dynamicParams = false;
export const generateStaticParams = () => browseCategoryParams("ca");
export const generateMetadata = ({ params }: { params: Params }) => browseMetadata(params, "ca");
export default function Page({ params }: { params: Params }) {
  return <BrowseCategory params={params} region="ca" />;
}
