import { BrowseIndex, browseIndexMetadata } from "@/views/BrowseView";

export const metadata = browseIndexMetadata("au");
export default function Page() {
  return <BrowseIndex region="au" />;
}
