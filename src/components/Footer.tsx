import { activeCategories, categoryHref, getCatalog, liveRegions } from "@/lib/catalog";
import { REGIONS, withRegion, type RegionId } from "@/lib/region";
import { FooterBody, type FooterData } from "./FooterBody";

/** Footer copy and links for every live region; the client half picks the one being viewed. */
export function Footer() {
  const data = Object.fromEntries(
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
          shop:
            region === "au"
              ? [["All phones", "/phones"], ["Today's deals", "/deals"], ["Brands", "/brands"], ["Compare", "/compare"], ["Guides", "/guides"], ["All categories", "/categories"]]
              : [["All phones", to("/phones")], ["Today's deals", to("/deals")], ["Stores we check", to("/stores")]],
          categories: activeCategories(region).map((c) => [c.name, categoryHref(c.id, region)]),
        },
      ];
    }),
  );
  return <FooterBody data={data} />;
}
