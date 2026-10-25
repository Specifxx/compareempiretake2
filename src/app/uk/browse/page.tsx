import { BrowseIndex, browseIndexMetadata } from "@/views/BrowseView";

export const metadata = browseIndexMetadata("uk");
export default function Page() {
  return <BrowseIndex region="uk" />;
}
