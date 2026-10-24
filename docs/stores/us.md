# US stores

The scrapers are in `scripts/scrapers/regions/us/` and their entries in `src/lib/retailers-us.ts`. Prices are in USD as a product page shows them, without sales tax. Tested from the sandbox on 2026-10-24; the offer counts below are that run (`data/us/<cat>/raw/us-<store>.json`).

`_shopify.ts` is a helper used by all the Shopify stores, not a store. It exports no `scrapers`, so the runner loads it and does nothing with it. It holds the shared `NOT_NEW` filter (refurbished, renewed, open box, pre-owned, demo, warranty or protection plan, gift card) and a reader for one offer per variant from `products.json`.

## Shipped (26)

| Store | How | Offers by category |
|---|---|---|
| Abt (`abt`) | server-rendered category pages: `<li data-productId>` cards plus the GA `pbGaObjArr` price and brand; the mpn is the code after the last " - " | tvs 244, headphones 231, tablets 169, speakers 115, laptops 111, soundbars 89, cameras 85, monitors 69, desktops 64, printers 38, drones 24, robot-vacuums 18, smartwatches 16, phones 14, routers 10, consoles 7 |
| Focus Camera (`focuscamera`) | Shopify collections filtered by product_type; store bundles dropped | cameras 408, headphones 311, smartwatches 152, monitors 107, speakers 91, laptops 62, drones 31, desktops 21, tablets 16 |
| World Wide Stereo | Shopify | headphones 246, speakers 189, tvs 114, soundbars 50 |
| Audio Advice | Shopify; the mpn is the part of the SKU after `BRAND:` | headphones 130, speakers 127, tvs 68, soundbars 50 |
| Headphones.com (`headphonescom`) | Shopify (USD) | headphones 277, speakers 19 |
| Audio46 | Shopify | headphones 1841 (one offer per colour or termination variant) |
| Apple | ported from the AU scraper; watch prices use the US `"amount"` field | tablets 160, laptops 61, desktops 29, smartwatches 26, headphones 18, monitors 10, speakers 9 |
| Dell | AU scraper with en-us | laptops 93, monitors 92, desktops 49 |
| LG | JSON-LD ItemList on each listing plus the sub-listings it links | monitors 141, laptops 76, tvs 60, soundbars 19, speakers 14 |
| Bose | AU scraper on bose.com | headphones 49, speakers 33, soundbars 5 |
| Sonos | AU scraper with en-us | speakers 19, soundbars 8, headphones 6 |
| Garmin | AU scraper with locale and country US | smartwatches 167 |
| Nintendo | `__NEXT_DATA__` on the hardware page | consoles 4 (Switch 2 systems and bundles) |
| Roborock, Dreame, ECOVACS | Shopify for the first two; the AU scraper for ECOVACS | robot-vacuums 86 / 89 / 20 |
| soundcore, Skullcandy, JLab, Shokz | Shopify | headphones 130 / 117 / 220 / 62; speakers: soundcore 59, JLab 17 |
| Amazfit | Shopify | smartwatches 32 |
| NZXT, Starforge, MAINGEAR, MINISFORUM, GMKtec | Shopify; for the mini-PC stores only the US-plug variants are kept | desktops 9 / 17 / 22 / 106 / 119; NZXT also monitors 4 and motherboards 10; MAINGEAR also laptops 6 |

## Blocked or skipped

- **Cloudflare "Just a moment" (403):** B&H, Newegg, Micro Center, Crutchfield, Corsair, Monoprice, Framework, Zotac, Insta360, Withings.
- **Akamai or a reset connection:** Best Buy (the connection times out; its free developer API needs a key, which the owner could apply for), HP US (connection reset; `hp.ts` was removed), Sony US, BJ's, MSI, GameStop and Antonline (403).
- **Walmart and Sam's Club:** their pages return "blocked - redirecting". Walmart also mixes marketplace sellers into its listings.
- **Target:** listings load through the redsky API with a key embedded in the page's JavaScript, which the rules don't allow.
- **Costco US:** products load from `gdx-api.costco.com`, which needs client headers from the page's JavaScript.
- **Samsung US:** the finder API answers for `siteCode=us` but returns no prices, and the listing pages come back empty.
- **Microsoft US:** the Surface page moved to `/en-us/surface` and has no JSON-LD list.
- **DJI US:** it works, but all 13 products were out of stock (DJI is not selling in the US), so I skipped it.
- **Not worth a scraper:** Logitech (no prices on its listings, mostly accessories), Netgear (only 7 priced), Lenovo and Razer (nothing in the HTML), eufy (only 2 robot vacuums), Edifier (titles are bare model codes), Moment (accessories), Back Market (refurbished).

## Gaps and notes for the lead

- No US store gives us GPUs, CPUs, SSDs or RAM: every US PC-parts retailer is behind Cloudflare. NZXT has motherboards only. Phones come only from Abt (14). Consoles come only from Abt and Nintendo.
- The daily job runs from Azure IPs, which may get different results. Best Buy and Walmart are worth one retry from Actions.
- Garmin keeps the AU behaviour of also listing `BUNDLE-…` part numbers.
- Programmes the owner could join: Abt, Focus Camera, World Wide Stereo and Audio Advice (through CJ, Impact or AvantLink), plus the brand stores, most of which are on Impact.
