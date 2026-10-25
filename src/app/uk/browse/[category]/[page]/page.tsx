import { BrowseCategory, browseMetadata, browsePageParams } from "@/views/BrowseView";

type Params = Promise<{ category: string; page: string }>;
export const dynamicParams = false;
export const generateStaticParams = () => browsePageParams("uk");
export const generateMetadata = ({ params }: { params: Params }) => browseMetadata(params, "uk");
export default function Page({ params }: { params: Params }) {
  return <BrowseCategory params={params} region="uk" />;
}
