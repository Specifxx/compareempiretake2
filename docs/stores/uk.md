# UK stores

Scrapers live in `scripts/scrapers/regions/uk/<store>.ts` (retailer id `uk-<store>`), run with
`npx tsx scripts/scrape-categories.ts --region uk [store]`, and write `data/uk/<cat>/raw/uk-<store>.json`.
Prices are the GBP price incl. VAT a shopper sees. Counts below are from the runs on 2026-10-24.

`_shopify.ts` is a shared helper, not a store: it exports no `scrapers`, so the runner imports it and skips it. It loads a
Shopify store's whole `/products.json` once and filters by `product_type` plus the AU title checks
(`IS` / `junk` / `badPrice` from `scripts/scrapers/categories/jbhifi.ts`; phones use `looksLikePhone`).
Several UK files are ports of the AU official-store scrapers with the locale swapped.

## Shipped (22)

| Store | Source | Offers by category |
|---|---|---|
| Box (box.co.uk) | The listing's own JSON (`/api/products?category_id=…`); sku = MPN | laptops 463, motherboards 280, monitors 201, desktops 125, ssds 112, ram 84, headphones 83, routers 70, cpus 50, graphics-cards 49, printers 39, phones 27, tablets 22 |
| Laptops Direct | Server-rendered listing cards (`?pageNumber=N`), MPN from "SKU:" | laptops 426, monitors 279, desktops 200, phones 183, tvs 82, printers 56, cpus 42, ram 42, ssds 35, tablets 35, routers 29, graphics-cards 22, motherboards 21, headphones 19, drones 15, soundbars 14, smartwatches 12 |
| Overclockers UK | JSON-LD ItemList on listing pages (`?page=N`) | graphics-cards 483, ram 421, monitors 344, motherboards 292, cpus 178, laptops 118, desktops 76, ssds 67, routers 63 |
| Clove Technology | Shopify `/products.json` (~12k products) | laptops 2690, monitors 2006, ram 1337, graphics-cards 1045, headphones 780, motherboards 630, tablets 606, ssds 496, cpus 445, phones 339, routers 179, desktops 32, drones 24, consoles 15, smartwatches 9 |
| Hughes | Shopware listing cards (`?p=N`) | tvs 167, soundbars 44, headphones 41, speakers 23 |
| Peter Tyson | Magento/Hyvä listing cards | headphones 131, speakers 112, soundbars 49 |
| Superfi | Shopify | headphones 56, speakers 32, soundbars 3 |
| The Game Collection | Shopify ("Hardware > …" types) | consoles 10 |
| Apple UK | Port of AU `apple.ts` (watch prices now read `"amount"`) | tablets 160, laptops 61, smartwatches 34, desktops 26, headphones 18, monitors 10, speakers 9 |
| Samsung UK | Port of AU listing JSON-LD; phones/watches added from URL slugs | tvs 42, monitors 34, tablets 16, smartwatches 11, phones 10 |
| Dell UK | Port of AU `dell.ts` (en-gb; the "ps-dell-price" is incl. VAT, the "excluding VAT" note is ignored) | monitors 86, laptops 83, desktops 44 |
| HP UK | Storefront's public GraphQL (`/gb-en/shop/graphql`), product page confirms "Incl. VAT" | laptops 465, desktops 254, printers 104, monitors 55 |
| Microsoft UK | Port of AU (`/store/b/shop-all-microsoft-surface`); slow pages, 3 at a time (~150 s) | laptops 120, tablets 108 |
| Garmin UK | Port of AU (storeCode/countries GB) | smartwatches 170 |
| Bose UK | Port of AU (bose.co.uk) | headphones 76, speakers 38, soundbars 6 |
| Sonos UK | Port of AU (en-gb) | speakers 19, soundbars 8, headphones 6 |
| soundcore UK | Shopify | headphones 30, speakers 11 |
| DJI UK | Port of AU (store.dji.com/uk) | drones 16, cameras 9 |
| ECOVACS UK | Port of AU (ecovacs.com/uk) | robot-vacuums 7 |
| Roborock UK | Shopify | robot-vacuums 25 |
| eufy UK | Shopify; "with Smart Scale" / BUNDLE- SKUs dropped | robot-vacuums 10 |

Notes:
- Clove's catalogue is distributor-fed: many lines are out of stock and some prices are well above market. They are shown as
  listed. Its SKUs are its own codes, so mpn comes only from a model code in the title. Refurbished stock (RSV-/RMAV- SKUs,
  "Refurbished" titles) is dropped.
- Samsung UK's product-finder JSON has no prices, so Buds, soundbars, speakers and SSDs are not scraped. "Certified
  Re-Newed" phones and `/buy/?modelCode=` cards (which show no storage) are skipped.
- Laptops Direct listings show no stock state; a listed product counts as in stock.
- Peter Tyson's TV listings answer 403 to non-browser clients, so TVs are not scraped there.

## Blocked or skipped

| Store | Why |
|---|---|
| Currys, Argos, AO.com, Very, Scan, CCL, Wex, Park Cameras, Clifton Cameras, Jessops, Sony UK, Ultimate Ears, Audio-Technica, Cambridge Audio, CVP, Wilkinson, Novatech, PC Specialist, Chillblast, HMV, Audio Affair, Selfridges | 403 / bot wall (Akamai, Cloudflare "Just a moment") from this sandbox |
| John Lewis, Ebuyer, GAME, Google Store UK (listing), DJI www | Connection dropped / timed out |
| Amazon UK | 202 empty challenge (expected) |
| Richer Sounds, Mobile Phones Direct, Lenovo UK | Listings are client-rendered; no product data in the HTML (would need their internal APIs) |
| Sevenoaks Sound & Vision | 500 on every page |
| Handtec | Almost all refurbished |
| Harrison Cameras | Mostly used stock |
| Smyths | Bot wall on the catalogue |

## For the lead

- `_shopify.ts` is a non-store file in the region folder; if the runner should ignore `_`-prefixed files explicitly, that is
  a one-line change in `scripts/scrape-categories.ts`.
- Several UK scrapers import the AU helpers (`categories/jbhifi.ts` `IS`/`junk`/`badPrice`/`mpnFrom*`, `filter.ts`), so a
  change there changes UK results too.
- Affiliate programmes worth a look: Box, Laptops Direct, Overclockers, Hughes (Awin); Dell, HP, Samsung, Microsoft,
  Garmin, Bose, DJI, eufy/soundcore and Roborock run their own or Awin/Rakuten programmes.
