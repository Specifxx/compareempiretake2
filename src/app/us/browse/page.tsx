import { BrowseIndex, browseIndexMetadata } from "@/views/BrowseView";

export const metadata = browseIndexMetadata("us");
export default function Page() {
  return <BrowseIndex region="us" />;
}
