import { BrowseCategory, browseMetadata, browsePageParams } from "@/views/BrowseView";

type Params = Promise<{ category: string; page: string }>;
export const dynamicParams = false;
export const generateStaticParams = () => browsePageParams("ca");
export const generateMetadata = ({ params }: { params: Params }) => browseMetadata(params, "ca");
export default function Page({ params }: { params: Params }) {
  return <BrowseCategory params={params} region="ca" />;
}
