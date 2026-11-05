// Must equal the CATEGORIES ids in src/lib/categories.ts (tests/routes.test.ts).
const CATEGORY_IDS = "phones|tablets|smartwatches|laptops|desktops|monitors|printers|routers|graphics-cards|cpus|ssds|ram|motherboards|tvs|soundbars|headphones|speakers|consoles|cameras|drones|robot-vacuums|vacuums|air-fryers|coffee-machines|fridges|washing-machines|dishwashers|lego|small-kitchen|coffee-gear|hair-care|bbqs";
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
// What the routes that render on request (product pages, /api/products and /admin, through the root layout) read at
// runtime (src/lib/catalog.ts). Never the scrape inputs, history or archive.
const RUNTIME_DATA = ["./data/**/catalog.json", "./data/**/series.json", "./data/**/store-series.json", "./data/**/ebay.json", "./data/family/family-cluster.json", "./data/amazon/*.json", "./data/amazon-live/*.json"];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Product photos are served straight from the retailers' CDNs.
  images: { unoptimized: true },
  poweredByHeader: false,
  // `npm run typecheck` is the type gate; LOCAL_SKIP_TYPECHECK=1 is for quick local builds only.
  typescript: { ignoreBuildErrors: process.env.LOCAL_SKIP_TYPECHECK === "1" },
  // Metadata always blocks, in <head>, for every user agent, so the one cached copy suits every crawler
  // (a request without one is never cached: HAS_UA).
  htmlLimitedBots: /./,
  // Keys are picomatch globs over route names (brackets escaped) that also match inside a name: the first covers
  // /[category]/[slug], /us/[category]/[slug] and /uk/[category]/[slug]; "/admin" also catches the small /api/admin routes.
  // The /api/grid lists are prerendered with the deploy and served as files, so they trace nothing.
  outputFileTracingIncludes: { "/\\[category\\]/\\[slug\\]": RUNTIME_DATA, "/api/products": RUNTIME_DATA, "/admin": RUNTIME_DATA, "/embed/price": RUNTIME_DATA },
  outputFileTracingExcludes: { "/**": ["./data/**/raw/**", "./data/**/history/**", "./data/**/archive/**"] },
  // One model, one page (Search Console, 2026-10-27): the iPad mini and Surface Go 3 pages the catalog split by
  // size, generation-vs-chip naming or a stray "with" (src/lib/match.ts parseTablet) now redirect to the merged page.
  async redirects() {
    const merged = [
      ["/tablets/apple-ipad-mini-6th-gen", "/tablets/apple-ipad-mini-a15"],
      ["/tablets/apple-ipad-mini-8-3", "/tablets/apple-ipad-mini"],
      ["/tablets/apple-ipad-mini-8-3-7th-gen", "/tablets/apple-ipad-mini-a17-pro"],
      ["/tablets/apple-ipad-mini-8-3-a17-pro", "/tablets/apple-ipad-mini-a17-pro"],
      ["/uk/tablets/apple-ipad-mini-8-3", "/uk/tablets/apple-ipad-mini"],
      ["/uk/tablets/apple-ipad-mini-8-3-6th-gen", "/uk/tablets/apple-ipad-mini-a15"],
      ["/uk/tablets/apple-ipad-mini-8-3-7th-gen", "/uk/tablets/apple-ipad-mini-a17-pro"],
      ["/uk/tablets/apple-ipad-mini-plus-8-3-7th-gen", "/uk/tablets/apple-ipad-mini-a17-pro"],
      ["/us/tablets/apple-ipad-mini-7th-gen", "/us/tablets/apple-ipad-mini-a17-pro"],
      ["/us/tablets/apple-ipad-mini-8-3-a17-pro", "/us/tablets/apple-ipad-mini-a17-pro"],
      ["/us/tablets/apple-ipad-mini-with-8-3-a17-pro", "/us/tablets/apple-ipad-mini-a17-pro"],
      ["/us/tablets/microsoft-surface-go-3-tablet-intel-core-i3-10100y-with", "/us/tablets/microsoft-surface-go-3-tablet-intel-core-i3-10100y"],
    ];
    // The root became the US home on 2026-11-01 (Australia's moved to /au), so the old US home redirects to it.
    // Brand slugs minted from an undecoded store title ("Bowers &amp; Wilkins", 2026-11-05); product URLs with the
    // same artefact redirect from the product page itself (lib/indexing.ts cleanedSlug).
    const entity = [["/brands/bowers-amp-wilkins", "/brands/bowers-wilkins"]];
    // www is a 308 to the apex (2026-11-05): www had no DNS from 26 Oct, came back serving the whole site as a
    // duplicate host, and Google still filed most pages under it. Every path moves except eBay's account-deletion
    // endpoint, registered with eBay under the www URL (its challenge is signed with that URL and is not redirected).
    const www = { source: "/:path((?!api/ebay/).*)", has: [{ type: "host", value: "www.compareempire.com" }], destination: "https://compareempire.com/:path", permanent: true };
    return [www, { source: "/us", destination: "/", permanent: true }, ...[...merged, ...entity].map(([source, destination]) => ({ source, destination, permanent: true }))];
  },
  async headers() {
    // Never a bare "/:a/:b": that would CDN-cache GET /api/reviews, /api/alerts and the other API routes.
    return [
      { source: `/:category(${CATEGORY_IDS})/:slug`, has: HAS_UA, missing: NOT_RSC, headers: PRODUCT_CDN },
      { source: `/:region(us|uk)/:category(${CATEGORY_IDS})/:slug`, has: HAS_UA, missing: NOT_RSC, headers: PRODUCT_CDN },
    ];
  },
};
export default nextConfig;
