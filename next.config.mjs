// Must equal the CATEGORIES ids in src/lib/categories.ts (tests/routes.test.ts).
const CATEGORY_IDS = "phones|tablets|smartwatches|laptops|desktops|monitors|printers|routers|graphics-cards|cpus|ssds|ram|motherboards|tvs|soundbars|headphones|speakers|consoles|cameras|drones|robot-vacuums";
// Product pages are functions. Vercel's CDN keeps each copy for a day and every deploy starts a fresh cache,
// so a copy never outlives the data it was rendered from. The header is never forwarded to browsers, and no ISR entry is written.
const PRODUCT_CDN = [{ key: "Vercel-CDN-Cache-Control", value: "public, s-maxage=86400, stale-while-revalidate=86400" }];
// Only a request with a user agent may fill that cache: with none, Next streams the metadata into <body> whatever
// htmlLimitedBots says, and that copy would then be served to every crawler for a day.
const HAS_UA = [{ type: "header", key: "user-agent", value: ".+" }];
// Only the HTML document is cached, never an RSC payload (client navigations and prefetches send `RSC: 1`):
// if a CDN ever keyed one under the page's URL, every visitor would get raw flight data instead of the page.
// Those requests mostly miss anyway, because their `_rsc` key changes with the page they start from.
const NOT_RSC = [{ type: "header", key: "rsc" }];
// What the routes that render on request (product pages and /admin, through the root layout) read at runtime
// (src/lib/catalog.ts). Never the scrape inputs, history or archive.
const RUNTIME_DATA = ["./data/**/catalog.json", "./data/**/series.json", "./data/**/store-series.json", "./data/**/ebay.json"];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Product photos are served straight from the retailers' CDNs.
  images: { unoptimized: true },
  poweredByHeader: false,
  // Inlined so client components build the same Amazon Associates links (lib/amazon.ts).
  env: { AMAZON_AU_TAG: process.env.AMAZON_AU_TAG || "compareempire-22" },
  // `npm run typecheck` is the type gate; LOCAL_SKIP_TYPECHECK=1 is for quick local builds only.
  typescript: { ignoreBuildErrors: process.env.LOCAL_SKIP_TYPECHECK === "1" },
  // Metadata always blocks, in <head>, for every user agent, so the one cached copy suits every crawler
  // (a request without one is never cached: HAS_UA).
  htmlLimitedBots: /./,
  // Keys are picomatch globs over route names (brackets escaped) that also match inside a name: the first covers
  // /[category]/[slug], /us/[category]/[slug] and /uk/[category]/[slug]; "/admin" also catches the small /api/admin routes.
  outputFileTracingIncludes: { "/\\[category\\]/\\[slug\\]": RUNTIME_DATA, "/admin": RUNTIME_DATA },
  outputFileTracingExcludes: { "/**": ["./data/**/raw/**", "./data/**/history/**", "./data/**/archive/**"] },
  async headers() {
    // Never a bare "/:a/:b": that would CDN-cache GET /api/reviews, /api/alerts and the other API routes.
    return [
      { source: `/:category(${CATEGORY_IDS})/:slug`, has: HAS_UA, missing: NOT_RSC, headers: PRODUCT_CDN },
      { source: `/:region(us|uk)/:category(${CATEGORY_IDS})/:slug`, has: HAS_UA, missing: NOT_RSC, headers: PRODUCT_CDN },
    ];
  },
};
export default nextConfig;
