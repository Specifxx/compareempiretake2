# Australian phone stores: HTTP-readability survey

Surveyed 2026-10-22 from the Compare Empire container with plain curl GETs (Chrome UA). Excludes stores already scraped: JB Hi-Fi, Harvey Norman, The Good Guys, Mobileciti. 84 stores: ok 18, client-side 10, blocked 28, no-phones 28.

No API keys or tokens from page JS were used. "client-side" means prices arrive via JS (often a keyed search API) and were skipped. Machine-readable version: `survey.json`.

| # | Store | Type | Status | Method | Condition | List URL | Sample | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Telstra | carrier | ok | html-attributes | new | https://www.telstra.com.au/mobile-phones/mobiles-on-a-plan | Galaxy S26 FE 128GB (Pistachio) — $31.91/mth x36 = 1148.76 | Server-rendered grid: <li class="tcom-device-grid__product-card" data-mobile-device-name, -brand, -storage, -colour, -price (monthly repayment), -old-price, -repayment-term (36), -price-total (outright equivalent). ~73 cards on one page, no paging. Plan price/data not on the card; plans are separate pages. |
| 2 | Optus | carrier | ok | html-jsonld | new | https://www.optus.com.au/mobile/phones | Apple iPhone 18 Pro — $58.30/mth x36 (total 2098.80) | Single ld+json @graph on listing holds ~54 Product nodes: offers[0].price = total device cost, offers[0].priceSpecification (priceType Installment) .price = monthly, .eligibleQuantity.value = term months (36). Some totals null (use monthly*term). One page, no paging. Plan data not included. |
| 3 | Apple Store AU | official | ok | html-jsonld | new | https://www.apple.com/au/shop/buy-iphone/iphone-17 | iPhone 17 256GB Mist Blue — $1549.00 | One page per model (/au/shop/buy-iphone/<model>; discover from /au/shop/buy-iphone). ld+json Product AggregateOffer low/highPrice AUD; per-SKU prices in embedded analytics JSON "products":[{"sku","partNumber","price":{"fullPrice"},"name"}]. Outright only. |
| 4 | Samsung AU | official | ok | html-jsonld | new | https://www.samsung.com/au/smartphones/all-smartphones/ | Galaxy Z Fold8 (Samsung.com only) — $2699 | ld+json ItemList (numberOfItems 23) of Product with offers.price AUD (from-price per model). Per-storage/colour pricing needs product /buy/ pages. Akamai present but plain GET passed. |
| 5 | Costco AU | retailer | ok | html-text | new | https://www.costco.com.au/Electronics/Mobile-Phones/c/cos_22.10 | Apple iPhone 17 Pro 256GB — $1929.99 | SAP Spartacus SSR: names in <span class="notranslate">, prices in <span class="notranslate ng-star-inserted">$x</span> inside product-price-amount. ~40 per page; paging likely ?currentPage=N (verify). Member prices shown. |
| 6 | Umart | specialist | ok | html-attributes | new | https://www.umart.com.au/mobile-phones-digital/mobile-phone-1406?page=1 | Apple iPhone 18 Pro 256GB - Silver (MJRQ4X/A) — $2069.00 | itemprop="price" content="2,069.00" per tile + goods-name links; ld+json ItemList of product URLs; paging ?page=N. |
| 7 | Vodafone AU | carrier | ok | html-jsonld | new | https://www.vodafone.com.au/mobile/mobile-phones | iPhone 17 Pro — $1698.72 | Listing (__NEXT_DATA__) gives product links /mobile/mobile-phones/<brand>/<model>; listing has no structured prices. Each product page ld+json Offer.price = base outright/total device price. Monthly/term in page UI (repaymentPeriodLabel) but not cleanly in JSON; would need more work. ~40 product fetches/run. |
| 8 | amaysim | carrier | ok | html-attributes | new | https://www.amaysim.com.au/devices/phones | Samsung Galaxy S26 — $1549 (discounted 999) | <article class="product-card" data-href data-brand data-price (RRP outright) data-discount-price; also itemprop="price". ~42 cards, one page. Repayments on product pages. |
| 9 | MSY Technology | specialist | ok | html-attributes | new | https://www.msy.com.au/mobile-phones-digital/mobile-phone-1406?page=1 | Apple iPhone 18 Pro 256GB — $2069.00 | Same platform and category id as Umart (sister store); identical parser. Prices may differ slightly. |
| 10 | digiDirect | retailer | ok | shopify-products-json | new | https://www.digidirect.com.au/collections/apple-iphones/products.json?limit=250&page=1 | Apple iPhone 17 256GB (White) — $1497.00 | Shopify; two collections: apple-iphones (79) and android-phones (100). variants[].price; variant per colour/storage. |
| 11 | Betta Electrical | retailer | ok | shopify-products-json | new | https://betta.com.au/collections/mobile-devices/products.json?limit=250&page=1 | Apple iPhone 17 Smartphone - Unlocked 5G 256GB - Black — $1549.00 | Shopify; collections mobile-devices (75, includes modems/home phones - filter by title "Smartphone"/"Mobile Phone") and iphone (12). |
| 12 | TeleChoice | carrier | ok | woocommerce-store-api | new (also refurb categories) | https://telechoice.com.au/wp-json/wc/store/v1/products?category=32&per_page=100&page=1 | SAMSUNG GALAXY A17 5G 128GB — $349.00 | WooCommerce Store API: prices.price in cents (minor_unit 2). Category 32 mobile-phones = outright (26), 47 mobiles-on-plan = plan devices (price is upfront/0, plan info in description). Exclude refurbished-iphones (527) / catch-refurb (546). |
| 13 | Mwave | specialist | ok | shopify-products-json | new | https://www.mwave.com.au/collections/audio-and-electronics-mobile-phones/products.json?limit=250&page=1 | Samsung Galaxy S26 Ultra 256GB - Black — $2199.00 | Shopify; ~20 phones. variants[].price, product_type empty. |
| 14 | Phonebot | specialist | ok | html-jsonld | refurbished | https://www.phonebot.com.au/unlocked-mobile-phones?page=1 | Apple iPhone 8 (64GB) [Like New] — $149 | dataLayer view_item_list items[] (item_name, price) + ld+json ItemList. Paging ?page=N (~14 pages). Refurbished only - grade in title. |
| 15 | Nothing AU | official | ok | html-text | new | https://au.nothing.tech/collections/phones | Phone (4a) — $649 | Shopify storefront but /products.json returns 404; collection HTML shows "Phone (4a) A$649". Parse text; few models. |
| 16 | Reebelo | marketplace | ok | next-data | refurbished | https://reebelo.com.au/collections/smartphones | iPhone 15 128GB (TechAgain offer) — $665.57 (price 66557 cents) | __NEXT_DATA__ products with offers[{price (cents), vendor, stock}]. Refurbished marketplace; new stock rare. |
| 17 | OzMobiles | specialist | ok | shopify-products-json | refurbished | https://ozmobiles.com.au/collections/mobile-phones/products.json?limit=250&page=1 | iPhone 13 128GB — $429.00 | Shopify; product_type "Phone". Mostly refurbished. shop.mobilemonster.com.au appears to be the same catalogue. |
| 18 | OzPhones | specialist | ok | html-text | new (stale) | https://ozphones.com.au/index.php?route=product/manufacturer/info&manufacturer_id=10 | Sony Xperia Arc S HD 3G Unlocked — $150.00 | OpenCart; class="price". Catalogue looks abandoned (3G-era, SOLD OUT images). Low value. |
| 19 | Officeworks | retailer | client-side |  | new | https://officeworks.com.au/ |  | Category HTML has product names in config JSON but "price":null; prices loaded client-side (Algolia/Constructor search key) - skipped. |
| 20 | Google Store AU | official | client-side |  | new | https://store.google.com/au/ |  | Collection page 2.6MB with no AUD prices in HTML; prices fetched client-side. |
| 21 | Motorola AU | official | client-side |  | new | https://motorola.com/au/ |  | Product page ld+json price 0; price loaded via cart JS. Akamai CAPTCHA script present. |
| 22 | HONOR AU | official | client-side |  | new | https://honor.com/au/ |  | Phone pages have no prices in HTML; price/stock loaded by JS. |
| 23 | OPPO AU | official | client-side |  | new | https://oppo.com/au/ |  | Model pages have no price; OPPO AU mostly points to retailers. |
| 24 | Xiaomi AU | official | client-side |  | new | https://mi.com/au/ |  | mi.com/au/mobile has no prices in HTML; store is buy.mi.com JS. |
| 25 | PLE Computers | specialist | client-side |  | new | https://ple.com.au/ |  | Search/category are a client-rendered app (no prices in HTML). |
| 26 | Appliances Online | retailer | client-side |  | new | https://appliancesonline.com.au/ |  | 82KB SPA shell; everything client-side. |
| 27 | Cash Converters | marketplace | client-side |  | used | https://cashconverters.com.au/ |  | Smartphones listing renders client-side; second-hand goods anyway. |
| 28 | Belong | carrier | client-side |  | new | https://belong.com.au/ |  | Next.js; SIM-only, no handset catalogue found. |
| 29 | Kogan | marketplace | blocked |  | new | https://kogan.com/au/ |  | 403 bot wall (captcha) |
| 30 | Catch | marketplace | blocked |  | new | https://catch.com.au/ |  | 403 (Cloudflare-style block page) |
| 31 | Amazon AU | marketplace | blocked |  | new | https://amazon.com.au/ |  | 202 empty body (bot challenge) |
| 32 | eBay AU | marketplace | blocked |  | new | https://ebay.com.au/ |  | 403 on home and search |
| 33 | Big W | retailer | blocked |  | new | https://bigw.com.au/ |  | HTTP/2 stream reset / connection dropped on every request |
| 34 | Kmart | retailer | blocked |  | new | https://kmart.com.au/ |  | 403 |
| 35 | Bing Lee | retailer | blocked |  | new | https://binglee.com.au/ |  | 403 |
| 36 | Retravision | retailer | blocked |  | new | https://retravision.com.au/ |  | 403 |
| 37 | Dick Smith | retailer | blocked |  | new | https://dicksmith.com.au/ |  | 403 (Kogan-owned) |
| 38 | Videopro | retailer | blocked |  | new | https://videopro.com.au/ |  | 403 |
| 39 | Domayne | retailer | blocked |  | new | https://domayne.com.au/ |  | Incapsula challenge (Harvey Norman group) |
| 40 | Joyce Mayne | retailer | blocked |  | new | https://joycemayne.com.au/ |  | Incapsula challenge |
| 41 | David Jones | retailer | blocked |  | new | https://davidjones.com/ |  | Incapsula challenge |
| 42 | Woolworths / Woolworths Mobile | carrier | blocked |  | new | https://woolworths.com.au/ |  | 403 Access Denied (Akamai); mobile.woolworths.com.au redirects to mobile.everyday.com.au which drops connection |
| 43 | Coles / Coles Mobile | retailer | blocked |  | new | https://coles.com.au/ |  | Incapsula |
| 44 | MyDeal | marketplace | blocked |  | new | https://mydeal.com.au/ |  | 403 |
| 45 | Allphones | specialist | blocked |  | new | https://allphones.com.au/ |  | 403 |
| 46 | Scorptec | specialist | blocked |  | new | https://scorptec.com.au/ |  | 403 |
| 47 | Centre Com | specialist | blocked |  | new | https://centrecom.com.au/ |  | 403 |
| 48 | Device Deal | specialist | blocked |  | new | https://devicedeal.com.au/ |  | 403 |
| 49 | JW Computers | specialist | blocked |  | new | https://jw.com.au/ |  | 403 |
| 50 | PC Case Gear | specialist | blocked |  | new | https://pccasegear.com/ |  | 403 |
| 51 | Computer Alliance | specialist | blocked |  | new | https://computeralliance.com.au/ |  | 403 |
| 52 | IJK | specialist | blocked |  | new | https://ijk.com.au/ |  | 403 |
| 53 | CPL Online | specialist | blocked |  | new | https://cplonline.com.au/ |  | 403 |
| 54 | PB Tech AU | specialist | blocked |  | new | https://pbtech.com/au/ |  | 403 |
| 55 | Mighty Ape AU | marketplace | blocked |  | new | https://mightyape.com.au/ |  | 403 captcha |
| 56 | Back Market AU | marketplace | blocked |  | new | https://backmarket.com.au/ |  | 403 on listing (refurbished only anyway) |
| 57 | Target AU | retailer | no-phones |  |  | https://target.com.au/ |  | Phone category is accessories; search returns no handsets |
| 58 | Myer | retailer | no-phones |  |  | https://myer.com.au/ |  | No phone category; search shows accessories only |
| 59 | Tech Mall | specialist | no-phones |  |  | https://techmall.com.au/ |  | Magento; Galaxy search returns only cases/screen protectors |
| 60 | Shopping Express | specialist | no-phones |  |  | https://shoppingexpress.com.au/ |  | No phone category in nav; search 404 |
| 61 | MobileMonster | specialist | no-phones |  |  | https://mobilemonster.com.au/ |  | Main site is buy-back (sell-your-phone); shop.mobilemonster.com.au is Shopify mirror of OzMobiles refurb stock (see ozmobiles) |
| 62 | Renewd | specialist | no-phones |  |  | https://renewd.com.au/ |  | Shopify; refurbished laptops/tablets only, no phones in products.json |
| 63 | ALDImobile | carrier | no-phones |  |  | https://aldimobile.com.au/ |  | Shopify products are plans only; handsets are ALDI Special Buys in store |
| 64 | Boost Mobile | carrier | no-phones |  |  | https://boost.com.au/ |  | SIM/recharge only online; phones sold via retailers |
| 65 | TPG | carrier | no-phones |  |  | https://tpg.com.au/ |  | SIM-only; /mobile/phones 404 |
| 66 | Aussie Broadband | carrier | no-phones |  |  | https://aussiebroadband.com.au/ |  | /mobile/phones 404; SIM-only now |
| 67 | Lebara | carrier | no-phones |  |  | https://lebara.com.au/ |  | SIM-only (WooCommerce for plans) |
| 68 | Felix Mobile | carrier | no-phones |  |  | https://felixmobile.com.au/ |  | SIM-only plans |
| 69 | Dodo | carrier | no-phones |  |  | https://dodo.com/ |  | SIM-only plans |
| 70 | iiNet | carrier | no-phones |  |  | https://iinet.net.au/ |  | No handsets |
| 71 | Superloop | carrier | no-phones |  |  | https://superloop.com/ |  | No handsets |
| 72 | Spintel | carrier | no-phones |  |  | https://spintel.net.au/ |  | No handsets |
| 73 | vivo AU | official | no-phones |  |  | https://vivo.com/au/ |  | No AU store/prices (vivo exited AU retail) |
| 74 | Gadgets Online | specialist | no-phones |  |  | https://gadgetsonline.com.au/ |  | Domain parked/for sale |
| 75 | Phonezone | specialist | no-phones |  |  | https://phonezone.com.au/ |  | Domain parked (/lander) |
| 76 | DWmobile | specialist | no-phones |  |  | https://dwmobile.com.au/ |  | DNS fails (.com.au); dwmobile.com parked |
| 77 | Mobileshop | specialist | no-phones |  |  | https://mobileshop.com.au/ |  | DNS fails |
| 78 | Futu Online | specialist | no-phones |  |  | https://futuonline.com.au/ |  | DNS fails |
| 79 | Ruby Mobiles | specialist | no-phones |  |  | https://rubymobiles.com.au/ |  | DNS fails |
| 80 | eBuyer AU | specialist | no-phones |  |  | https://ebuyer.com.au/ |  | Domain parked |
| 81 | DGS | specialist | no-phones |  |  | https://dgs.com.au/ |  | Domain parked |
| 82 | Cellmate | specialist | no-phones |  |  | https://cellmate.com.au/ |  | Shopify with empty products.json |
| 83 | TechGeeks | specialist | no-phones |  |  | https://techgeeks.com.au/ |  | Repair shop, not retail |
| 84 | OzBuy | marketplace | no-phones |  |  | https://ozbuy.com.au/ |  | Generic dropship store, no phone catalogue found |
