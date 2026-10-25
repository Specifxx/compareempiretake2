import { BrowseCategory, browseCategoryParams, browseMetadata } from "@/views/BrowseView";

type Params = Promise<{ category: string }>;
export const dynamicParams = false;
export const generateStaticParams = () => browseCategoryParams("uk");
export const generateMetadata = ({ params }: { params: Params }) => browseMetadata(params, "uk");
export default function Page({ params }: { params: Params }) {
  return <BrowseCategory params={params} region="uk" />;
}
