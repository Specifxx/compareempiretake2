/**
 * Garmin US (garmin.com/en-US): smartwatches (category 10002, Wearables).
 * The category page's own JSON (`/c/api/getProducts?categoryKey=10002&locale=en-US&storeCode=US`) lists every
 * product (pid, name incl. case size); `/c/api/getColorSwatches?id=<pid>` names each colour's part number, and the
 * public pricing service the page calls (buy.garmin.com/pricing-proxy-services/countries/US/pid/<pid>/prices) prices
 * each part number. One offer per part number (= mpn, e.g. 010-04761-01). Parts without a US price are not sold.
 */
import type { CategoryId, RawOffer, RetailerId } from "../../../../src/lib/types";
import { get, pool, sleep } from "../../../lib/http";

type Product = { id: string; name: string; group?: boolean; url: string; image?: { large?: string } };
type Swatch = { swatchName?: string; sku: string; imageUrl?: string };
type Priced = { partNumber: string; listPrice?: { price?: number }; salePrice?: { price?: number } | null };

const tidy = (s: string) => s.replace(/[®™]/g, "").replace(/\s+/g, " ").trim();
const titleCase = (s: string) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase());

async function smartwatches(): Promise<RawOffer[]> {
  const list = JSON.parse(
    await get("https://www.garmin.com/c/api/getProducts?cg=none&categoryKey=10002&locale=en-US&storeCode=US&appName=www-category-pages"),
  ) as { products: Product[] };
  const products = list.products.filter((p) => !p.group && !/vívosmart|vivosmart|index|hrm|band|strap|charger|kids? |bounce|lily/i.test(p.name));
  const seen = new Set<string>();
  const res = await pool(products, 2, async (p) => {
    const out: RawOffer[] = [];
    try {
      const prices = JSON.parse(
        await get(`https://buy.garmin.com/pricing-proxy-services/countries/US/pid/${p.id}/prices?locale=en-US&customerGroup=`),
      ) as { pricedSkus?: Priced[] };
      if (!prices.pricedSkus?.length) return out;
      let swatches: Swatch[] = [];
      try {
        swatches = (JSON.parse(await get(`https://www.garmin.com/c/api/getColorSwatches?locale=en-US&id=${p.id}`)) as { data?: Swatch[] }).data ?? [];
      } catch {}
      await sleep(500);
      const name = tidy(p.name);
      const cellular = /\bLTE\b|cellular/i.test(name);
      for (const s of prices.pricedSkus) {
        const list = s.listPrice?.price;
        const sale = s.salePrice?.price;
        const price = sale ?? list;
        if (!price || seen.has(s.partNumber)) continue;
        seen.add(s.partNumber);
        const sw = swatches.find((x) => x.sku === s.partNumber);
        const colour = sw?.swatchName ? titleCase(tidy(sw.swatchName)) : undefined;
        out.push({
          retailer: "us-garmin" as RetailerId,
          sku: s.partNumber,
          mpn: s.partNumber,
          brand: "Garmin",
          title: `Garmin ${name} ${cellular ? "GPS + Cellular (LTE)" : "GPS"}${colour ? ` - ${colour}` : ""}`.replace(/\s+/g, " "),
          url: `https://www.garmin.com/en-US/p/${p.id}/pn/${s.partNumber}/`,
          price,
          wasPrice: sale && list && list > sale ? list : undefined,
          image: `https://res.garmin.com/en/products/${s.partNumber}/v/cf-lg.jpg`,
          inStock: true,
        });
      }
    } catch {}
    return out;
  });
  return res.flat();
}

export const scrapers: Partial<Record<Exclude<CategoryId, "phones">, () => Promise<RawOffer[]>>> = { smartwatches };
