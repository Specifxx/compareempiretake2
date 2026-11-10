import { readFileSync } from "node:fs";
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
const RUNTIME_DATA = ["./data/**/catalog.json", "./data/**/series.json", "./data/**/store-series.json", "./data/**/ebay.json", "./data/family/family-cluster.json", "./data/focus/demand.json", "./data/amazon/*.json", "./data/amazon-live/*.json"];

// Search everything and the MCP server (DECISIONS.md 2026-11-10): the catalogues plus the family search index.
const SEARCH_DATA = [...RUNTIME_DATA, "./data/family/family-search.json"];

// The focus cull (owner, 2026-11-07; src/lib/focus.ts RETIRED_CATEGORIES, which tests/focus.test.ts pins this to): a
// retired category's pages, products, browse and deals pages 301 to the nearest kept category, else the region's home.
const RETIRED = {
  "coffee-gear": "coffee-machines",
  "small-kitchen": "coffee-machines",
  "air-fryers": null,
  "hair-care": null,
  bbqs: null,
  fridges: null,
  "washing-machines": null,
  dishwashers: null,
  printers: "laptops",
  ram: "graphics-cards",
  ssds: "graphics-cards",
  motherboards: "graphics-cards",
};
const REGION_PREFIXES = ["", "/us", "/uk", "/ca", "/sg"];
const retiredRedirects = () =>
  REGION_PREFIXES.flatMap((r) =>
    Object.entries(RETIRED).flatMap(([cat, to]) => {
      const dest = to ? `${r}/${to}` : r === "" ? "/au" : r === "/us" ? "/" : r;
      return [`${r}/${cat}`, `${r}/${cat}/:slug`, `${r}/browse/${cat}`, `${r}/browse/${cat}/:page`, `${r}/deals/${cat}`].map((source) => ({ source, destination: dest, permanent: true }));
    }),
  );

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
  outputFileTracingIncludes: { "/\\[category\\]/\\[slug\\]": RUNTIME_DATA, "/api/products": RUNTIME_DATA, "/admin": RUNTIME_DATA, "/embed/price": RUNTIME_DATA, "/api/search": SEARCH_DATA, "/api/mcp": SEARCH_DATA },
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
      // 2026-11-06 (storage, bundle and edition merges): the pages the stricter matcher moved. The Galaxy A16 page held
      // the 4G and 5G phones; the Bose page held both SoundLink Flex generations (the 2nd Gen kept most stores); the
      // HyperX and Tefal pages gained a store and took the shorter name.
      ["/phones/samsung-galaxy-a16", "/phones/samsung-galaxy-a16-4g"],
      ["/uk/phones/samsung-galaxy-a16", "/uk/phones/samsung-galaxy-a16-4g"],
      ["/us/speakers/bose-soundlink-flex-portable-speaker", "/us/speakers/bose-soundlink-flex-portable-speaker-2nd-gen"],
      ["/headphones/hyperx-cloud-iii-gaming-headset", "/headphones/hyperx-cloud-iii"],
      ["/uk/headphones/hyperx-cloud-iii-gaming-headset", "/uk/headphones/hyperx-cloud-iii"],
      ["/air-fryers/tefal-easy-fry-grill-and-steam-xxl-3-in-1-air-fryer-fw2018", "/air-fryers/tefal-easy-fry-grill-steam-xxl-air-fryer"],
      // 2026-11-06, later: pages every store names by one model code are one page (sharedCodeMerges): the duplicate
      // with fewer stores, or the longer name, redirects to the page that kept the name.
      ["/us/coffee-gear/mazzer-super-jolly-v-up-electronic-silver", "/us/coffee-gear/mazzer-super-jolly-v-up-electronic-black"],
      ["/us/bbqs/delta-heat-standard-g-model-38-liquid-propane-gas-grill", "/us/bbqs/delta-heat-38-inch-3-burner-freestanding-gas-grill-lp"],
      ["/uk/washing-machines/samsung-11kg-series-6-ai-energy-washing-machine-1400rpm-ww11dg6b25lbu1", "/uk/washing-machines/samsung-ww11dg6b25lbu1-series-6-black-11kg-1400rpm-washing-machine"],
      ["/uk/tvs/hisense-32a4stuk-32-led-full-hd-black-smart-freely-tv", "/uk/tvs/hisense-a4s-32-hd-720-dled-smart-tv"],
      ["/uk/tvs/samsung-qe65qn80hauxxu-65-4k-neo-qled-vision-ai-smart-tv-titan-black", "/uk/tvs/samsung-qn80h-65-4k-ultra-hd-neo-qled-smart-tv"],
      ["/uk/tvs/lg-c66lb-55-4k-ultra-hd-oled-hdr-evo-ai-smart-tv", "/uk/tvs/lg-oled55c66lb-55-oled-smart-4k-tv-2026"],
      ["/uk/tvs/samsung-qe75qn80hauxxu-75-4k-neo-qled-vision-ai-smart-tv-titan-black", "/uk/tvs/samsung-qn80h-75-4k-ultra-hd-neo-qled-smart-tv"],
      ["/uk/tvs/sony-bravia-8-77-xr-oled-4k-hdr-smart-tv", "/uk/tvs/sony-bravia-8-xr80u-77-4k-oled-smart-tv"],
      ["/uk/tvs/sony-bravia-7-ii-xr75m2pb-75-4k-ultra-hd-rgb-led-hdr-smart-tv", "/uk/tvs/sony-bravia-7-ii-k75xr75m2pb-75-xr-rgb-led-tv"],
      ["/uk/tvs/sony-bravia-7-ii-xr75m2pb-85-4k-ultra-hd-rgb-led-hdr-smart-tv", "/uk/tvs/sony-bravia-7-ii-k85xr75m2pb-85-xr-rgb-led-tv"],
      ["/uk/tvs/sony-bravia-9-ii-xr95m2pb-65-4k-ultra-hd-rgb-led-hdr-smart-tv", "/uk/tvs/sony-bravia-9-ii-k65xr95m2pb-65-xr-rgb-led-tv"],
      ["/uk/tvs/sony-bravia-9-ii-xr95m2pb-75-4k-ultra-hd-rgb-led-hdr-smart-tv", "/uk/tvs/sony-bravia-9-ii-k75xr95m2pb-75-xr-rgb-led-tv"],
      ["/uk/tvs/sony-bravia-9-ii-xr95m2pb-85-4k-ultra-hd-rgb-led-hdr-smart-tv", "/uk/tvs/sony-bravia-9-ii-k85xr95m2pb-85-xr-rgb-led-tv"],
      ["/uk/monitors/philips-evnia-34m2c6500-00-86-4-cm-34-3440-x-1440-pixels-wide-quad-hd-qdoled-monitor", "/uk/monitors/philips-evnia-6000-34m2c6500-34-qd-oled-wqhd-175hz-0-03ms-ultrawide-curved-gaming-monitor"],
      ["/uk/monitors/aoc-agon-pro-ag326uzd2-computer-monitor-80-cm-31-5-3840-x-2160-pixels-4k-ultra-hd-oled-black", "/uk/monitors/aoc-agon-pro-ag326uzd2-31-5-oled-4k-uhd-240hz-0-03ms-gaming-monitor"],
      ["/uk/fridges/samsung-brd27600eww-built-in-tall-fridge-with-spacemax-technology", "/uk/fridges/samsung-brd27600eww-eu-brr6000b-built-in-one-door-fridge"],
      ["/uk/dishwashers/samsung-dw60cg550b00eu-integrated-dishwasher-14-place-settings-dw60cg550b00eu", "/uk/dishwashers/samsung-dw60cg550b00eu-integrated-dishwasher-14-place-settings"],
      ["/speakers/insta360-wave-professional-conference-speakerphone-black", "/speakers/insta360-wave-professional-conference-speakerphone-white"],
      ["/speakers/acoustic-energy-ae307-lcr-speaker-matte-black", "/speakers/acoustic-energy-ae307-lcr-speaker-walnut"],
      ["/monitors/asus-va259hga-25-1080p-120hz-ips-monitor", "/monitors/asus-24-5in-fhd-ips-120hz-adaptive-sync-eye-care-gaming-monitor"],
      ["/monitors/gigabyte-gs25f2a-25-1080p-240hz-ips-gaming-monitor", "/monitors/gigabyte-24-5in-fhd-240hz-ss-ips-edge-gaming-monitor"],
      ["/monitors/asus-eye-care-vp327q-32-2160p-60hz-4ms-va-monitor", "/monitors/asus-31-5in-4k-uhd-va-60hz-adaptive-sync-eye-care-monitor"],
      ["/monitors/aoc-cu34g4z-34-curved-1440p-240hz-0-3ms-fast-va-monitor", "/monitors/aoc-cu34g4z-34-wqhd-240hz-curved-gaming-monitor"],
      ["/monitors/msi-mag-272qpw-qd-oled-x28-26-5-qhd-280hz-gaming-monitor", "/monitors/msi-mag-x28-26-5in-qd-oled-280hz-gaming-monitor"],
      ["/monitors/asus-proart-pa279crv-27-4k-uhd-professional-ips-monitor", "/monitors/asus-proart-display-27inch-4k-uhd-ips-professional-monitor"],
      ["/monitors/msi-mag-271kpd7-27-5k-2880p-75hz-1440p-300hz-0-5ms-rapid-ips-gaming-monitor", "/monitors/msi-mag-271kpd7-27in-5k-75hz-wqhd-300hz-rapid-ips-dual-mode-gaming-monitor"],
      ["/monitors/lg-ultragear-oled-39gx90sa-w-39-curved-1440p-ultrawide-240hz-0-03ms-gaming-monitor-white", "/monitors/lg-ultragear-39in-wqhd-oled-240hz-freesync-curved-smart-gaming-monitor"],
      ["/headphones/beyerdynamic-dt-770-pro-closed-reference-studio-headphones-80-ohm", "/headphones/beyerdynamic-dt770-pro-closed-reference-studio-headphones-80"],
      ["/headphones/beyerdynamic-dt-770-pro-closed-reference-studio-headphones-32-ohm", "/headphones/beyerdynamic-dt770-pro-closed-reference-studio-headphones-32"],
      ["/headphones/yamaha-yh-e700b-wireless-headphones-beige", "/headphones/yamaha-yh-e700b"],
      ["/headphones/beyerdynamic-dt-770-pro-closed-reference-studio-headphones-250-ohm", "/headphones/beyerdynamic-dt770-pro-closed-reference-studio-headphones"],
      ["/headphones/beyerdynamic-dt-990-pro-open-reference-studio-headphones-250-ohm", "/headphones/beyerdynamic-dt990-pro-open-studio-headphones"],
      ["/headphones/sony-wf-1000xm5-noise-cancelling-earbuds", "/headphones/sony-wf-1000xm5-true-wireless-noise-cancelling-earbuds"],
      ["/headphones/sony-wh-1000xm5-premium-noise-cancelling-wireless-over-ear-headphones", "/headphones/sony-wh-1000xm5-noise-cancelling-headphones"],
      ["/coffee-machines/gaggia-classic-e24-coffee-machine-white", "/coffee-machines/gaggia-classic-e24-coffee-machine-grey"],
      ["/coffee-machines/gaggia-classic-e24-coffee-machine-stainless", "/coffee-machines/gaggia-classic-e24-coffee-machine-grey"],
      ["/coffee-machines/gaggia-classic-e24-coffee-machine-black", "/coffee-machines/gaggia-classic-e24-coffee-machine-grey"],
      ["/coffee-machines/gaggia-classic-e24-coffee-machine-lobster-red", "/coffee-machines/gaggia-classic-e24-coffee-machine-grey"],
    ];
    // The root became the US home on 2026-11-01 (Australia's moved to /au), so the old US home redirects to it.
    // Brand slugs minted from an undecoded store title ("Bowers &amp; Wilkins", 2026-11-05); product URLs with the
    // same artefact redirect from the product page itself (lib/indexing.ts cleanedSlug).
    const entity = [["/brands/bowers-amp-wilkins", "/brands/bowers-wilkins"]];
    // 2026-11-06 (owner: one set of posts for every region, the Australia-only guides retired): each retired guide
    // 301s to the new post on its topic, else its category's page (the US one where the US has that category), else
    // /guides. tests/guides.test.ts checks every target exists and no live guide is redirected.
    const retiredGuides = Object.entries(JSON.parse(readFileSync(new URL("./content/guide-redirects.json", import.meta.url), "utf8"))).map(([slug, to]) => [`/guides/${slug}`, to]);
    // www is a 308 to the apex (2026-11-05): www had no DNS from 26 Oct, came back serving the whole site as a
    // duplicate host, and Google still filed most pages under it. Every path moves except eBay's account-deletion
    // endpoint, once registered under the www URL. That exemption never helped: Vercel redirects www before Next
    // (eBay marked the endpoint down, 2026-11-07), so eBay now has the apex URL.
    const www = { source: "/:path((?!api/ebay/).*)", has: [{ type: "host", value: "www.compareempire.com" }], destination: "https://compareempire.com/:path", permanent: true };
    return [www, { source: "/us", destination: "/", permanent: true }, ...retiredRedirects(), ...[...merged, ...entity, ...retiredGuides].map(([source, destination]) => ({ source, destination, permanent: true }))];
  },
  async headers() {
    // Never a bare "/:a/:b": that would CDN-cache GET /api/reviews, /api/alerts and the other API routes.
    return [
      { source: `/:category(${CATEGORY_IDS})/:slug`, has: HAS_UA, missing: NOT_RSC, headers: PRODUCT_CDN },
      { source: `/:region(us|uk|ca|sg)/:category(${CATEGORY_IDS})/:slug`, has: HAS_UA, missing: NOT_RSC, headers: PRODUCT_CDN },
    ];
  },
};
export default nextConfig;
