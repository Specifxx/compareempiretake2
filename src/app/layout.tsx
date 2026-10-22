import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompareTray } from "@/components/CompareTray";
import { getSearchIndex } from "@/lib/search-index";
import { activeCategories, getBrands } from "@/lib/catalog";
import { DEPARTMENTS } from "@/lib/categories";
import type { NavDepartment } from "@/components/Header";
import type { CategoryId } from "@/lib/types";
import { SITE } from "@/lib/site";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap", weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Compare Empire — Compare mobile phone prices across Australia", template: "%s · Compare Empire" },
  description:
    "Is that phone sale real? We record every phone price at 17 Australian stores every day — JB Hi-Fi, Harvey Norman, Apple, Samsung, Telstra, Optus and more — so you can see the real price history before you buy.",
  openGraph: { type: "website", siteName: "Compare Empire", locale: "en_AU" },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b10" },
  ],
};

// Sets the theme before first paint so there is no light flash in dark mode.
const themeScript = `try{var t=localStorage.getItem('ce-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const index = getSearchIndex();
  const live = activeCategories();
  const departments: NavDepartment[] = DEPARTMENTS.map((d) => ({
    name: d.name,
    categories: live
      .filter((c) => c.department === d.id)
      .map((c) => {
        const brands = getBrands(c.id as CategoryId);
        return {
          name: c.name,
          href: c.href,
          emoji: c.emoji,
          count: brands.reduce((n, b) => n + b.count, 0),
          brands: brands.slice(0, 6).map((b) => ({ name: b.brand, href: `/brands/${b.slug}?cat=${c.id}` })),
        };
      }),
  })).filter((d) => d.categories.length);
  return (
    <html lang="en-AU" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans">
        <Header index={index} departments={departments} />
        <main>{children}</main>
        <Footer />
        <CompareTray />
        <Analytics />
      </body>
    </html>
  );
}
