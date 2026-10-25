import { BrowseCategory, browseMetadata, browsePageParams } from "@/views/BrowseView";

type Params = Promise<{ category: string; page: string }>;
export const dynamicParams = false;
export const generateStaticParams = () => browsePageParams("au");
export const generateMetadata = ({ params }: { params: Params }) => browseMetadata(params, "au");
export default function Page({ params }: { params: Params }) {
  return <BrowseCategory params={params} region="au" />;
}
