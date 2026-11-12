import Link from "next/link";
import { CHRISTMAS_FESTIVE_LAYER } from "@/lib/season";

// Christmas (1 November to Boxing Day): one line above the home page's headline (owner, 2026-11-12, tasteful accents only), a
// link to the region's deals page, the site's holiday page that lasts the season. Server HTML, never a heading; in the HTML only
// while CHRISTMAS_FESTIVE_LAYER is on, shown only while <html> carries data-season="christmas" (globals.css .xmas-banner).
// This site has no gift guide of its own, so it links /deals (DECISIONS.md, 2026-11-12).
export function ChristmasBanner({ href }: { href: string }) {
  if (!CHRISTMAS_FESTIVE_LAYER) return null;
  return (
    <div className="mb-4 sm:mb-5">
      <Link prefetch={false} href={href} className="xmas-banner">
        <svg className="xmas-banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M5 12v8h14v-8M12 8v12M12 8c-1.5-3.5-5-3.5-5-1.5S10.5 8 12 8c1.5 0 5 .5 5-1.5S13.5 4.5 12 8Z" />
        </svg>
        <span className="xmas-banner-text">
          <b>Christmas tech gifts</b>
          <span className="xmas-banner-more hidden sm:inline"> · today&apos;s real price drops on tech gifts →</span>
        </span>
      </Link>
    </div>
  );
}
