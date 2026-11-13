import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { ShareArrival } from "@/components/ShareArrival";
import { Header } from "@/components/Header";
import { HolidayStrip } from "@/components/HolidayStrip";
import { saleStrip } from "@/lib/black-friday";
import { Footer } from "@/components/Footer";
import { CompareTray } from "@/components/CompareTray";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { RateCard } from "@/components/site-reviews/RateCard";
import { PhoneDock } from "@/components/PhoneDock";
import { RegionNotice } from "@/components/RegionNotice";
import { activeCategories, categoryHref, getBrands, liveRegions } from "@/lib/catalog";
import { REGION_BOOT_SCRIPT, type RegionId } from "@/lib/region";
import { DEPARTMENTS, FEATURED } from "@/lib/categories";
import type { NavDepartment } from "@/components/Header";
import type { CategoryId } from "@/lib/types";
import { CONTACT_EMAIL, SITE } from "@/lib/site";
import "./globals.css";
// The cart list's styles (components/cart): imported here, never from a component, so node tests can load them.
import "@/components/cart/cart.css";
import "@/components/site-reviews/site-reviews.css";
import { CHRISTMAS_FESTIVE_LAYER, SEASON_BOOT_SCRIPT } from "@/lib/season";

// Self-hosted (OFL, from Fontsource) so builds never depend on fetching Google Fonts.
const sans = localFont({ src: "./fonts/inter-latin-wght-normal.woff2", variable: "--font-sans", display: "swap", weight: "100 900" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  // No country in the defaults (owner, 2026-11-01): the root is the US home, and a page that names a country sets its own.
  title: { default: "Compare Empire — tech price comparison, checked every day", template: "%s · Compare Empire" },
  description:
    "Is that sale real? We check prices on phones, TVs, laptops, headphones and more at stores in the US, Australia and the UK every day, and keep the price history so you can see a real deal.",
  openGraph: { type: "website", siteName: "Compare Empire", images: [{ url: "/og?t=Is+that+sale+actually+real%3F", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
  // Large image previews and full snippets in Google (Search, Discover, Images), as RiftCompare does.
  // A page that sets its own `robots` (noindex) replaces this whole object.
  robots: { googleBot: { "max-image-preview": "large", "max-snippet": -1 } },
  // Search Console / Bing Webmaster ownership tags (hard coded; a Vercel variable overrides it).
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "AzWwvsCoV2fKvjAspJUFFd77HqxcG_7Eb_4P7cTDOHk",
    other: {
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ?? "04270C74F268EA0135FD19602057D497",
      // Commission Factory site ownership (affiliate network). Only ONE code: their checker read the
      // first of two tags and refused the new code (2026-11-03), so the old #18 code is gone.
      "commission-factory-verification": "b10c49c2a5ca4100ba4cb4e3002f3e8b",
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1d22" },
  ],
};

// Sets the theme before first paint so there is no light flash in dark mode. Then marks a URL that
// filters or sorts a product grid (PhoneBrowser's query keys, "?sort=popular" being the default), so
// the grid's prerendered, unfiltered first page shows as a skeleton until the browser filters it
// (globals.css, [data-grid-fallback]). Crawlers and visitors without JavaScript never get the class.
const themeScript =
  `try{var t=localStorage.getItem('ce-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}` +
  `try{if(/[?&](?:q|brand|min|max|storage|fold|5g|stock|multi|cat|f\\.[a-z0-9-]+)=[^&]|[?&]sort=(?!popular(?:&|$))[^&]/.test(location.search))document.documentElement.classList.add('gq')}catch(e){}` +
  // A store photo that fails to load (hotlink-blocked, moved) is hidden and its tile says "No photo", instead of a broken
  // image icon (US shopper review, 2026-11-06). Capture phase: image errors don't bubble.
  `document.addEventListener('error',function(e){var t=e.target;if(t&&t.tagName==='IMG'&&!t.hasAttribute('data-broken')){t.setAttribute('data-broken','');var p=t.closest('.img-tile');if(p)p.classList.add('img-missing')}},true);`;

function navDepartments(region: RegionId): NavDepartment[] {
  const live = activeCategories(region);
  return DEPARTMENTS.map((d) => ({
    name: d.name,
    categories: live
      .filter((c) => c.department === d.id)
      .map((c) => {
        const brands = getBrands(c.id as CategoryId, region);
        return {
          name: c.name,
          href: categoryHref(c.id, region),
          emoji: c.emoji,
          featured: FEATURED.includes(c.id),
          count: brands.reduce((n, b) => n + b.count, 0),
          // Brand pages exist for Australia only so far.
          brands: region === "au" ? brands.slice(0, 6).map((b) => ({ name: b.brand, href: `/brands/${b.slug}?cat=${c.id}` })) : [],
        };
      }),
  })).filter((d) => d.categories.length);
}

// Computed once per server process: the data only changes with a deploy. Every page, including
// the product pages rendered on request, would otherwise rebuild the nav for every region.
let chrome: { regions: RegionId[]; nav: Record<string, NavDepartment[]> } | undefined;
const getChrome = () =>
  (chrome ??= (() => {
    const regions = liveRegions();
    return { regions, nav: Object.fromEntries(regions.map((region) => [region, navDepartments(region)])) };
  })());

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { regions, nav } = getChrome();
  return (
    <html lang="en" className={sans.variable} data-regions={regions.join(" ")} data-festive={CHRISTMAS_FESTIVE_LAYER ? "" : undefined} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Christmas (1 November to Boxing Day): data-season on <html> from the visitor's own date. lib/season.ts. */}
        <script dangerouslySetInnerHTML={{ __html: SEASON_BOOT_SCRIPT }} />
        {/* The visitor's own region (owner, 2026-11-01): moves a person, never a crawler, to their region's copy of the page. lib/region.ts. */}
        <script dangerouslySetInnerHTML={{ __html: REGION_BOOT_SCRIPT }} />
        <link rel="alternate" type="application/rss+xml" title="Compare Empire guides" href="/feed.xml" />
      </head>
      <body className="min-h-screen font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${SITE}/#org`,
                  name: "Compare Empire",
                  url: SITE,
                  logo: `${SITE}/icon.svg`,
                  email: CONTACT_EMAIL,
                  contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: CONTACT_EMAIL, areaServed: ["US", "AU", "GB"], availableLanguage: "en" },
                },
                // SEO audit, 2026-11-03: the site had no WebSite entity.
                { "@type": "WebSite", "@id": `${SITE}/#website`, name: "Compare Empire", url: SITE, publisher: { "@id": `${SITE}/#org` }, inLanguage: "en" },
              ],
            }),
          }}
        />
        <Header nav={nav} regions={regions} sale={saleStrip(new Date().toISOString().slice(0, 10))} />
        <HolidayStrip sale={saleStrip(new Date().toISOString().slice(0, 10))} />
        <RegionNotice />
        <main>{children}</main>
        <Footer />
        <CompareTray />
        {/* No quick view since the 2026-11-10 redesign: a product card opens the product page, as on the big comparison
            sites (fewer /api/products calls, one place to compare). components/QuickView.tsx stays for a while. */}
        <FeedbackWidget />
        {/* Rate us (owner, 2026-11-03): the corner card, asking only after real use; RiftCompare keeps the ratings. */}
        <RateCard />
        {/* The eBay tiles in the phone dock below 1280px: browser only (components/PhoneDock.tsx). */}
        <PhoneDock />
        <SiteAnalytics />
        <ShareArrival />
      </body>
    </html>
  );
}
