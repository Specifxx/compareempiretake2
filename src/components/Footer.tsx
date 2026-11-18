import { activeCategories, categoryHref, getCatalog, liveRegions } from "@/lib/catalog";
import { REGIONS, withRegion, type RegionId } from "@/lib/region";
import { FooterBody, type FooterData } from "./FooterBody";

// Computed once per server process: the data only changes with a deploy.
let cached: Partial<Record<RegionId, FooterData>> | undefined;

/** Footer copy and links for every live region; the client half picks the one being viewed. */
export function Footer() {
  const data = (cached ??= Object.fromEntries(
    liveRegions().map((region): [RegionId, FooterData] => {
      const { retailers, updatedAt, phones } = getCatalog(undefined, region);
      const R = REGIONS[region];
      const to = (h: string) => withRegion(h, region);
      return [
        region,
        {
          stores: retailers.length,
          products: phones.length,
          checked: `${new Date(updatedAt).toLocaleString(R.locale, { timeZone: R.timeZone, day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" })}`,
          year: Number(new Date(updatedAt).toLocaleDateString("en-CA", { timeZone: R.timeZone }).slice(0, 4)),
          // Fewer links on every page (2026-11-19, core-update quality pass): the header and the category pages reach the rest.
          shop: [["Today's deals", to("/deals")], ["Brands", "/brands"], ["Buying guides", "/guides"], ["All categories", "/categories"]],
          categories: activeCategories(region).slice(0, 8).map((c) => [c.name, categoryHref(c.id, region)]),
        },
      ];
    }),
  ));
  return <FooterBody data={data} />;
}
