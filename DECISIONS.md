# Decisions

## 2026-10-23: Skip builds that can't change the site

Every push to the production branch rebuilt ~10,800 static pages, docs-only commits included.
`scripts/vercel-ignore-build.sh` (vercel.json `ignoreCommand`) now skips non-production builds and
commits touching only docs, README/COST/DECISIONS or `.github/`. Data commits still build, because the
pages are generated from `data/`.

## 2026-10-23: Analytics counts real visitors only

Web Analytics is billed per event. `src/components/SiteAnalytics.tsx` keeps @vercel/analytics but drops
events from localhost, `*.vercel.app` previews, automated browsers, bot user agents and the owner
(`?notrack=1` sets a localStorage flag). It is mounted once, in the root layout.

## 2026-10-23: Block SEO scrapers in robots.txt

SEO-tool and bulk crawlers (Ahrefs, Semrush, MJ12, DotBot, Petal, Bytespider, DataForSeo, BLEX, CCBot,
barkrowler, Seekport) send no visitors. They are disallowed; search engines are not. `/admin` and
`/api/` are disallowed for everyone. robots.txt is advisory, so the Vercel Firewall's bot rules do the
enforcing (see COST.md).

## 2026-10-24: One "buy_click" event per store click

Every outbound store or marketplace link carries `data-buy="<retailer>"` (plus product, price, kind and
rank where known). One capturing listener in `SiteAnalytics.tsx` sends a Vercel Analytics custom event
`buy_click` with those properties, so Analytics → Events shows which retailers people click through to.
It uses the same real-visitor filter as pageviews, and middle-clicks count too. One listener rather than
an onClick per link keeps server components (EbayStrip, brands page) server-only.

## 2026-10-25: Amazon Associates (AU) links, without Amazon prices

To earn the three qualifying sales Amazon requires before approving the Associates account
(tag `compareempire-22`, overridable with `AMAZON_AU_TAG`), every Amazon AU link is built by
`amazonAuLink()` in `src/lib/amazon.ts`: `/dp/<ASIN>` when we know one, otherwise an amazon.com.au
search, always straight to Amazon with our tag (no shortener or redirect) and
`rel="sponsored nofollow noopener"`. Our data has no ASINs yet, so links are searches for the
product name. We show no Amazon price, rating or stock (that needs the Product Advertising API, which
comes after approval); buttons say "Check price on Amazon". Placements, all Australia only: a labelled
"Amazon AU" row under the store list on product pages, a row in the compare table, a search link in
the search box, and "Top picks on Amazon AU" on the home page and eight top categories. The footer
carries Amazon's required sentence on every page, `/affiliate-disclosure` explains it, and the first
Amazon link on a page has the short disclosure beside it. Clicks send `buy_click` (Vercel) and, once
`NEXT_PUBLIC_GA_ID` is set, a GA4 `amazon_click` event with product, placement and page.

## 2026-10-25: eBay prices: spend 5,000 calls on the products people click

The eBay Browse API (5,000 calls a day) runs once a day in the price job (`scripts/ebay-prices.ts`),
never from a page. Keys live only in GitHub secrets (`EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`). It
spends 4,950 searches, one per product, on products with a best price of at least 10 in their currency.
About 28,700 products qualify across AU, US and UK, so it ranks them by demand (stores stocking it,
newness, category weight, price, and a US boost), checks the top quarter of the budget every day and
rotates the rest stalest-first. Each search is new, Buy It Now, in-country, priced within 45–135% of
our best store price, and the listing title must contain the product's identifying words, so cases and
parts don't match. The cheapest passing listing, with eBay's affiliate URL for campaign 5339155912, goes
to `data/<region>/ebay.json`. Listings older than five days are dropped. Product pages show it as a
labelled "eBay · Ad · New" row beside, never among, the store rows, and cards show "eBay $X".

eBay requires a Marketplace Account Deletion endpoint for production keys:
`/api/ebay/account-deletion` answers the challenge with sha256(code + EBAY_VERIFICATION_TOKEN +
endpoint) and acknowledges deletion notices. We store no eBay user data, so there is nothing to delete.

## 2026-10-25: The daily job finishes: stores in parallel, JB Hi-Fi on a time budget

Runs on 23 and 24 Oct were cancelled at the time limit inside the AU category scrape: JB Hi-Fi's
scraper fetched thousands of product JSON files and retried every 429 with backoff. JB now pauses
all its workers together on a 429, stops after 40 minutes (`JB_BUDGET_MIN`), keeps yesterday's file for
any category it couldn't finish, and starts at a different category each day. The runner scrapes
four stores at once.

## 2026-10-25: Indexing: one www host, a tiered sitemap index, and crawlable browse pages

`compareempire.com` already 308-redirects to `www`, but canonicals, OG URLs and the robots.txt
Sitemap line used the bare domain, so every canonical pointed at a redirect. `SITE` now always resolves
to `https://www.compareempire.com` (a bare-domain `NEXT_PUBLIC_SITE_URL` is upgraded).

85% of the ~28K product pages are sold by one store: thin for a brand-new site. `/sitemap.xml` is now
a sitemap index of sections (`/sitemaps/<section>.xml`, `src/lib/seo.ts`). `SITEMAP_TIER` (Vercel env,
default 1) decides what's submitted: tier 1 is hubs, categories, guides and products at 3+ stores
(about 1,470 URLs), tier 2 adds 2-store products, brands, category deals and comparisons, and tier 3
is everything. Raise it once Search Console shows the tier indexed. Pages outside the sitemap stay
live and indexable, and every one is linked from the A-to-Z `/browse/<category>` pages (200 a page,
in every region), because category grids load most products in the browser.

Product pages gained a price summary (cheapest, range, options, lowest recorded, stores in stock),
category "Before you buy" tips, a data-driven FAQ, and BreadcrumbList and FAQPage JSON-LD; product
names that repeat in a region get their model code in the title. Category pages gained a buying guide,
price range, top brands and an FAQ. No ratings or reviews are marked up: we have none of our own.
