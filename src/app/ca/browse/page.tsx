import { BrowseIndex, browseIndexMetadata } from "@/views/BrowseView";

export const metadata = browseIndexMetadata("ca");
export default function Page() {
  return <BrowseIndex region="ca" />;
}
