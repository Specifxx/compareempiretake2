"use client";
import Link from "next/link";
import { Logo } from "./Logo";
import { CONTACT_EMAIL } from "@/lib/site";
import { AMAZON_DISCLOSURE, AMAZON_TRADEMARK } from "@/lib/amazon";
import { REGIONS, type RegionId } from "@/lib/region";
import { useRegion } from "@/lib/use-region";

/** `year` is the import's year in the region (Footer.tsx), not the clock: a page cached over New Year still hydrates. */
export interface FooterData { stores: number; products: number; checked: string; year: number; shop: string[][]; categories: string[][] }

const WHO: Record<RegionId, string> = { au: "Australians", us: "shoppers in the US", uk: "shoppers in the UK", ca: "Canadians", sg: "shoppers in Singapore" };

export function FooterBody({ data }: { data: Partial<Record<RegionId, FooterData>> }) {
  const region = useRegion();
  const d = data[region] ?? data.au!;
  const R = REGIONS[region];
  return (
    <footer className="mt-16 border-t border-line bg-bg-card sm:mt-24">
      <div className="container-x grid grid-cols-2 gap-x-6 gap-y-8 py-10 sm:py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-10">
        <div className="col-span-2 space-y-4 md:col-span-1">
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
          links={[["About & how it works", "/about"], ["Reviews", "/reviews"], ["Community forum (beta)", "/forum"], ["Creators", "/creators"], ["Retailers we check", `${R.prefix}/stores`], ["Price alerts", "/alerts"], ["Contact us", "/contact"], ["List your store", "/list-your-store"], ["How we pick stores", "/how-we-pick-stores"], ["How we make money", "/disclosure"], ["Affiliate disclosure", "/affiliate-disclosure"], ["Privacy", "/privacy"]]}
        />
      </div>
      {/* One short line (owner, 2026-11-02: the old list was "convoluted"): our tech sister, then the page that lists every site
          (DECISIONS.md "Sites that grow each other"). */}
      <nav aria-label="Compare Empire sites" className="border-t border-line">
        <div className="container-x py-4 text-xs text-ink-mute">
          {/* No sister-site list (owner, 2026-11-03: sitewide links between our own sites read as a link network):
              /network lists every site once (lib/family-network.ts). */}
          <Link prefetch={false} href="/network" className="font-semibold text-ink-soft hover:text-ink">All Compare Empire sites →</Link>
        </div>
      </nav>
      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-ink-mute sm:flex-row sm:justify-between">
          <span>© {d.year} Compare Empire. {R.taxNote}; check the retailer for the final price. eBay links are affiliate links; we may earn a commission. {AMAZON_DISCLOSURE} {AMAZON_TRADEMARK}</span>
          <span>
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink">{CONTACT_EMAIL}</a>{region === "au" && " · Made in Australia 🇦🇺"}
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
      <ul className="text-sm md:space-y-2">
        {links.map(([l, h]) => (
          <li key={h}>
            {/* 40px tall on a phone, so a thumb finds each link (2026-11-14). */}
            <Link prefetch={false} href={h} className="inline-flex min-h-[2.5rem] items-center text-ink-soft hover:text-ink md:min-h-0">{l}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
