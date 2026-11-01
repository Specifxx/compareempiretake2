import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompareTray } from "@/components/CompareTray";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { QuickView } from "@/components/QuickView";
import { RegionNotice } from "@/components/RegionNotice";
import { activeCategories, categoryHref, getBrands, liveRegions } from "@/lib/catalog";
import { REGION_BOOT_SCRIPT, type RegionId } from "@/lib/region";
import { DEPARTMENTS, FEATURED } from "@/lib/categories";
import type { NavDepartment } from "@/components/Header";
import type { CategoryId } from "@/lib/types";
import { CONTACT_EMAIL, SITE } from "@/lib/site";
import "./globals.css";
import { SEASON_BOOT_SCRIPT } from "@/lib/season";

// Self-hosted (OFL, from Fontsource) so builds never depend on fetching Google Fonts.
const sans = localFont({ src: "./fonts/inter-latin-wght-normal.woff2", variable: "--font-sans", display: "swap", weight: "100 900" });
const display = localFont({ src: "./fonts/bricolage-grotesque-latin-wght-normal.woff2", variable: "--font-display", display: "swap", weight: "200 800" });

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
      // Commission Factory site ownership (affiliate network).
      "commission-factory-verification": "7d3167b7f3264490902052134cfafc08",
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b10" },
  ],
};

// Sets the theme before first paint so there is no light flash in dark mode. Then marks a URL that
// filters or sorts a product grid (PhoneBrowser's query keys, "?sort=popular" being the default), so
// the grid's prerendered, unfiltered first page shows as a skeleton until the browser filters it
// (globals.css, [data-grid-fallback]). Crawlers and visitors without JavaScript never get the class.
const themeScript =
  `try{var t=localStorage.getItem('ce-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}` +
  `try{if(/[?&](?:q|brand|min|max|storage|fold|5g|stock|multi|cat|f\\.[a-z0-9-]+)=[^&]|[?&]sort=(?!popular(?:&|$))[^&]/.test(location.search))document.documentElement.classList.add('gq')}catch(e){}`;

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
    <html lang="en" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
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
              "@type": "Organization",
              name: "Compare Empire",
              url: SITE,
              email: CONTACT_EMAIL,
              contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: CONTACT_EMAIL, areaServed: ["US", "AU", "GB"], availableLanguage: "en" },
            }),
          }}
        />
        <Header nav={nav} regions={regions} />
        <RegionNotice />
        <main>{children}</main>
        <Footer />
        <CompareTray />
        <QuickView />
        <FeedbackWidget />
        <SiteAnalytics />
      </body>
    </html>
  );
}
