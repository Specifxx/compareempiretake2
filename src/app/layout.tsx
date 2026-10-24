import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompareTray } from "@/components/CompareTray";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { activeCategories, categoryHref, getBrands, liveRegions } from "@/lib/catalog";
import type { RegionId } from "@/lib/region";
import { DEPARTMENTS, FEATURED } from "@/lib/categories";
import type { NavDepartment } from "@/components/Header";
import type { CategoryId } from "@/lib/types";
import { CONTACT_EMAIL, SITE } from "@/lib/site";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap", weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Compare Empire — Compare mobile phone prices across Australia", template: "%s · Compare Empire" },
  description:
    "Is that phone sale real? We record every phone price at 17 Australian stores every day — JB Hi-Fi, Harvey Norman, Apple, Samsung, Telstra, Optus and more — so you can see the real price history before you buy.",
  openGraph: { type: "website", siteName: "Compare Empire", locale: "en_AU", images: [{ url: "/og?t=Is+that+sale+actually+real%3F", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
  // Search Console / Bing Webmaster ownership tags (hard coded; a Vercel variable overrides it).
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "AzWwvsCoV2fKvjAspJUFFd77HqxcG_7Eb_4P7cTDOHk",
    other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ?? "04270C74F268EA0135FD19602057D497" },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b10" },
  ],
};

// Sets the theme before first paint so there is no light flash in dark mode.
const themeScript = `try{var t=localStorage.getItem('ce-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const regions = liveRegions();
  const nav = Object.fromEntries(regions.map((region) => [region, navDepartments(region)]));
  return (
    <html lang="en-AU" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
              contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: CONTACT_EMAIL, areaServed: "AU", availableLanguage: "en" },
            }),
          }}
        />
        <Header nav={nav} regions={regions} />
        <main>{children}</main>
        <Footer />
        <CompareTray />
        <FeedbackWidget />
        <SiteAnalytics />
      </body>
    </html>
  );
}
