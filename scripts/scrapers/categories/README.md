# Category scrapers

One file per store: `scripts/scrapers/categories/<retailer>.ts`, exporting

```ts
import type { CategoryId, RawOffer } from "../../../src/lib/types";
export const scrapers: Partial<Record<Exclude<CategoryId, "phones">, () => Promise<RawOffer[]>>> = { ... };
```

Rules:
- Only public pages / JSON a browser loads anonymously. Never use API keys or tokens embedded in page JS.
- New, retail-boxed products only: drop refurbished, renewed, open-box, ex-demo, "B-grade", second-hand, and accessories
  (cases, stands, mounts, cables, keyboards sold alone, screen protectors…).
- `title` = the store's product name, untouched except entity decoding. Fill `brand` and `mpn` (model code / manufacturer
  part number) whenever the page shows them — matching across stores depends on them.
- `price` = the price a shopper pays today in AUD incl. GST; `wasPrice` only when the store shows one.
- `inStock` from the page; `image` absolute URL; `url` the product page.
- Be polite: ≤ 4 concurrent requests per store, small sleeps between pages, retries via `get`/`getJson` in `scripts/lib/http.ts`.
- Use `RetailerId` values from `src/lib/types.ts`; if you need a new store id, use the id agreed in your brief (the lead adds it to the union).
