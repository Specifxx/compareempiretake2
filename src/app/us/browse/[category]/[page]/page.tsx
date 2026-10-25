import { BrowseCategory, browseMetadata, browsePageParams } from "@/views/BrowseView";

type Params = Promise<{ category: string; page: string }>;
export const dynamicParams = false;
export const generateStaticParams = () => browsePageParams("us");
export const generateMetadata = ({ params }: { params: Params }) => browseMetadata(params, "us");
export default function Page({ params }: { params: Params }) {
  return <BrowseCategory params={params} region="us" />;
}
