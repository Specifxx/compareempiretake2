"use client";
import Link from "next/link";
import { Logo } from "./Logo";
import { CONTACT_EMAIL, FAMILY_SITES } from "@/lib/site";
import { AMAZON_DISCLOSURE } from "@/lib/amazon";
import { REGIONS, type RegionId } from "@/lib/region";
import { useRegion } from "@/lib/use-region";

/** `year` is the import's year in the region (Footer.tsx), not the clock: a page cached over New Year still hydrates. */
export interface FooterData { stores: number; products: number; checked: string; year: number; shop: string[][]; categories: string[][] }

const WHO: Record<RegionId, string> = { au: "Australians", us: "shoppers in the US", uk: "shoppers in the UK" };

export function FooterBody({ data }: { data: Partial<Record<RegionId, FooterData>> }) {
  const region = useRegion();
  const d = data[region] ?? data.au!;
  const R = REGIONS[region];
  return (
    <footer className="mt-24 border-t border-line bg-bg-card">
      <div className="container-x grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-sm text-sm text-ink-soft">
            Independent price comparison for {WHO[region]}. We check {d.stores} retailers every day so you don&apos;t have to open {d.stores} tabs.
            No retailer pays to rank higher — the cheapest price is always first.
          </p>
          <p className="text-xs text-ink-mute">
            {d.products.toLocaleString()} products tracked · prices last checked {d.checked}
          </p>
        </div>
        <FooterCol title="Shop" links={d.shop} />
        <FooterCol title="Categories" links={d.categories} />
        <FooterCol
          title="Compare Empire"
          links={[["About & how it works", "/about"], ["Reviews", "/reviews"], ["Retailers we check", region === "au" ? "/about#retailers" : `${R.prefix}/stores`], ["Price alerts", "/alerts"], ["Contact us", "/contact"], ["How we make money", "/disclosure"], ["Affiliate disclosure", "/affiliate-disclosure"], ["Privacy", "/privacy"]]}
        />
      </div>
      <nav aria-label="The Compare Empire family" className="border-t border-line">
        <div className="container-x py-5 text-xs text-ink-mute">
          <div className="eyebrow mb-2">More price comparison from Compare Empire</div>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {FAMILY_SITES.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener" className="font-semibold text-ink-soft hover:text-ink">
                  {s.anchor}
                </a>{" "}
                on {s.name}
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-ink-mute sm:flex-row sm:justify-between">
          <span>© {d.year} Compare Empire. {R.taxNote}; check the retailer for the final price. eBay links are affiliate links; we may earn a commission. {AMAZON_DISCLOSURE}</span>
          <span>
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink">{CONTACT_EMAIL}</a> · Made in Australia 🇦🇺
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <div className="eyebrow mb-3">{title}</div>
      <ul className="space-y-2 text-sm">
        {links.map(([l, h]) => (
          <li key={h}>
            <Link href={h} className="text-ink-soft hover:text-ink">{l}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
