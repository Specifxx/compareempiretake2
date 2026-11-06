import { BrowseIndex, browseIndexMetadata } from "@/views/BrowseView";

export const metadata = browseIndexMetadata("sg");
export default function Page() {
  return <BrowseIndex region="sg" />;
}
