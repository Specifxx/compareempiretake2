# Compare Empire

Price comparison for Australia, starting with mobile phones. Live at compareempire.com.

## How it works

1. `npm run scrape` — reads the public phone listings of JB Hi-Fi, Harvey Norman,
   The Good Guys and Mobileciti (`scripts/scrapers/`) into `data/phones/raw/<retailer>.json`.
   A retailer that fails keeps yesterday's file.
2. `npm run build:catalog` — matches listings to phones by brand + model + storage
   (`src/lib/normalize.ts`), drops refurbished/carrier-locked/outlier listings, writes
   `data/catalog.json`, today's snapshot to `data/phones/history/<date>.json` and the chart
   series to `data/series.json`.
3. `next build` — prerenders every phone, brand and listing page from those files.
   No database.

`.github/workflows/refresh-prices.yml` runs steps 1–2 every morning and commits the
data, which triggers one Vercel deploy a day.

## Develop

```
npm install
npm run dev          # http://localhost:3000
npm run refresh      # re-scrape + rebuild the catalogue (≈3 min)
npm test && npm run typecheck && npm run lint
```

## Adding a retailer

Write `scripts/scrapers/<id>.ts` returning `RawOffer[]`, register it in
`scripts/scrape.ts` and `src/lib/retailers.ts`, then run `npm run refresh` and check
the new titles parse (`tests/normalize.test.ts`).
