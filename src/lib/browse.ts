/**
 * The product grid's data, shared by the server (which renders its first page) and the browser
 * (PhoneBrowser, which filters, sorts and pages the full list). Pure: no "server-only" and no
 * React, so both sides sort and bucket exactly the same way.
 *
 * A category page sends only its first PAGE_SIZE products in the default order, plus the filter
 * options computed from the full list. The full list (GridItems, trimmed to what the grid reads,
 * packed into a GridFile) is a static JSON file per region and category, or per brand
 * (src/app/api/grid), which the browser loads when idle, or at once when someone filters, sorts or pages.
 */
import type { PhoneSummary } from "./catalog";
import type { RegionId } from "./region";
import type { CategoryId } from "./types";

/** Products per page of the grid, and the number the server renders. */
export const PAGE_SIZE = 48;

/** Bumped whenever GridFile's shape changes, so browsers never mix an old file with new code. */
export const GRID_FORMAT = 1;

/** What a product card draws (PhoneCard). PhoneSummary has all of it. */
export interface CardItem {
  href: string;
  category: CategoryId;
  name: string;
  brand: string;
  model: string;
  image?: string;
  subtitle: string;
  bestPrice: number;
  retailerCount: number;
  saving: number;
  atLowest?: boolean;
  region?: RegionId;
  ebayPrice?: number;
  network?: "5G" | "4G";
  foldable?: boolean;
}

/** A card plus what the grid filters and sorts on. */
export interface GridItem extends CardItem {
  generation: number;
  inStock?: boolean;
  storages: number[];
  /** Only the specs this category filters on (FACETS); absent when it has none. */
  facets?: Record<string, string>;
}

export const SORTS = {
  popular: "Most compared",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  saving: "Biggest saving",
  newest: "Newest models",
} as const;
export type Sort = keyof typeof SORTS;
/** A ?sort= value we offer. Own keys only: "valueOf" or "__proto__" would otherwise pick a built-in as the comparator and crash the grid. */
export const isSort = (s: string): s is Sort => Object.prototype.hasOwnProperty.call(SORTS, s);

type Sortable = Pick<GridItem, "retailerCount" | "generation" | "bestPrice" | "saving">;
export const SORT_FNS: Record<Sort, (a: Sortable, b: Sortable) => number> = {
  popular: (a, b) => b.retailerCount - a.retailerCount || b.generation - a.generation || b.bestPrice - a.bestPrice,
  "price-asc": (a, b) => a.bestPrice - b.bestPrice,
  "price-desc": (a, b) => b.bestPrice - a.bestPrice,
  saving: (a, b) => b.saving - a.saving,
  newest: (a, b) => b.generation - a.generation || b.bestPrice - a.bestPrice,
};

export interface FacetDef {
  key: string;
  label: string;
  bucket?: (v: string) => string;
}

function sizeBucket(n: number, steps: number[]): string {
  if (!n) return "";
  // Nearest listed size class, e.g. 64.5" → 65".
  const near = steps.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));
  return Math.abs(near - n) <= 3 ? `${near}"` : `${Math.round(n)}"`;
}

/** Spec filters per category: which facet to offer, and how to bucket its values. */
export const FACETS: Record<string, FacetDef[]> = {
  tvs: [
    { key: "Screen size", label: "Size", bucket: (v) => sizeBucket(parseFloat(v), [43, 50, 55, 65, 75, 85]) },
    { key: "Panel", label: "Panel" },
    { key: "Resolution", label: "Resolution" },
  ],
  monitors: [
    { key: "Screen size", label: "Size", bucket: (v) => sizeBucket(parseFloat(v), [24, 27, 32, 34, 49]) },
    { key: "Resolution", label: "Resolution" },
    { key: "Refresh rate", label: "Refresh rate", bucket: (v) => (parseInt(v) >= 240 ? "240Hz+" : parseInt(v) >= 144 ? "144Hz+" : "Under 144Hz") },
    { key: "Panel", label: "Panel" },
  ],
  "graphics-cards": [
    { key: "GPU", label: "GPU" },
    { key: "Memory", label: "Memory" },
  ],
  laptops: [
    { key: "Memory", label: "Memory" },
    { key: "Storage", label: "Storage" },
    { key: "Graphics", label: "Dedicated graphics" },
  ],
  tablets: [{ key: "Chip", label: "Chip" }],
  cpus: [
    { key: "Family", label: "Family" },
    { key: "Socket", label: "Socket" },
  ],
  ssds: [
    { key: "Interface", label: "Interface" },
    { key: "PCIe", label: "PCIe" },
  ],
  ram: [
    { key: "Type", label: "Type" },
    { key: "Capacity", label: "Capacity" },
    { key: "Speed", label: "Speed" },
  ],
  motherboards: [
    { key: "Socket", label: "Socket" },
    { key: "Chipset", label: "Chipset" },
    { key: "Form factor", label: "Form factor" },
    { key: "Wi-Fi", label: "Wi-Fi" },
  ],
  headphones: [
    { key: "Type", label: "Type" },
    { key: "Noise cancelling", label: "Noise cancelling" },
  ],
  smartwatches: [{ key: "Connectivity", label: "Connectivity" }],
  consoles: [{ key: "Platform", label: "Platform" }],
  cameras: [
    { key: "Type", label: "Type" },
    { key: "Kit", label: "Lens" },
  ],
  soundbars: [
    { key: "Channels", label: "Channels" },
    { key: "Dolby Atmos", label: "Dolby Atmos" },
  ],
  speakers: [{ key: "Type", label: "Type" }],
  routers: [
    { key: "Wi-Fi", label: "Wi-Fi standard" },
    { key: "Mesh", label: "Mesh" },
  ],
  printers: [
    { key: "Type", label: "Type" },
    { key: "Colour", label: "Colour" },
  ],
  "robot-vacuums": [
    { key: "Mops", label: "Mops" },
    { key: "Base station", label: "Base station" },
  ],
  desktops: [
    { key: "Memory", label: "Memory" },
    { key: "Storage", label: "Storage" },
  ],
  vacuums: [
    { key: "Type", label: "Type" },
    { key: "Power", label: "Power" },
    { key: "Wet & dry", label: "Wet & dry" },
  ],
  "air-fryers": [
    { key: "Baskets", label: "Baskets" },
    { key: "Capacity", label: "Capacity", bucket: (v) => bucketNum(v, [[0, 4, "Under 4L"], [4, 7, "4–6.9L"], [7, 10, "7–9.9L"], [10, 99, "10L+"]]) },
  ],
  "coffee-machines": [
    { key: "Type", label: "Type" },
    { key: "Built-in grinder", label: "Grinder" },
    { key: "Milk", label: "Milk" },
  ],
  fridges: [
    { key: "Type", label: "Type" },
    { key: "Capacity", label: "Capacity", bucket: (v) => bucketNum(v, [[0, 300, "Under 300L"], [300, 450, "300–449L"], [450, 600, "450–599L"], [600, 9999, "600L+"]]) },
    { key: "Ice & water", label: "Ice & water" },
  ],
  "washing-machines": [
    { key: "Type", label: "Type" },
    { key: "Capacity", label: "Capacity", bucket: (v) => bucketNum(v, [[0, 8, "Under 8kg"], [8, 10, "8–9.5kg"], [10, 12, "10–11.5kg"], [12, 99, "12kg+"]]) },
  ],
  lego: [
    { key: "Theme", label: "Theme" },
    { key: "Pieces", label: "Pieces", bucket: (v) => bucketNum(v, [[0, 250, "Under 250"], [250, 750, "250–749"], [750, 2000, "750–1,999"], [2000, 99999, "2,000+"]]) },
  ],
  dishwashers: [
    { key: "Install", label: "Install" },
    { key: "Place settings", label: "Place settings" },
  ],
};

/** "635L" → "450–599L"-style bucket labels, by the first number in the value. */
function bucketNum(v: string, ranges: [number, number, string][]): string {
  const n = Number(v.match(/[\d.]+/)?.[0]);
  return ranges.find(([lo, hi]) => n >= lo && n < hi)?.[2] ?? v;
}

export const facetDefs = (category: string): FacetDef[] => FACETS[category] ?? [];

/** The value a product files under for one facet ("" when it has none). */
export function facetValue(p: Pick<GridItem, "facets">, f: FacetDef): string {
  const v = p.facets?.[f.key];
  return v ? (f.bucket ? f.bucket(v) : v) : "";
}

/** A summary trimmed to what the grid reads: no slug, offer count or top price, and only this grid's facets. */
export function toGridItem(p: PhoneSummary, category: string): GridItem {
  const facets: Record<string, string> = {};
  for (const f of facetDefs(category)) if (p.facets[f.key]) facets[f.key] = p.facets[f.key];
  return {
    href: p.href,
    category: p.category,
    name: p.name,
    brand: p.brand,
    model: p.model,
    image: p.image,
    subtitle: p.subtitle,
    bestPrice: p.bestPrice,
    retailerCount: p.retailerCount,
    saving: p.saving,
    generation: p.generation,
    storages: p.storages,
    region: p.region,
    ebayPrice: p.ebayPrice,
    network: p.network,
    // Absent rather than false: most products are neither, and every byte is sent for every product.
    ...(p.atLowest ? { atLowest: true } : {}),
    ...(p.inStock ? { inStock: true } : {}),
    ...(p.foldable ? { foldable: true } : {}),
    ...(Object.keys(facets).length ? { facets } : {}),
  };
}

/** Filter chips, counted over the whole list. They never depend on the active filters, so the server sends them. */
export interface GridOptions {
  /** [brand, products] by count; omitted on a brand's own page. */
  brands?: [string, number][];
  /** [category id, products]; only where the grid offers a category filter. */
  cats?: [string, number][];
  /** Facets with more than one value, each with its first 18 values. */
  facets: { key: string; label: string; opts: [string, number][] }[];
}

function counts<T>(items: T[], key: (p: T) => string): [string, number][] {
  const m = new Map<string, number>();
  for (const p of items) {
    const k = key(p);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m];
}

export function gridOptions(items: GridItem[], category: string, o: { brands: boolean; cats: boolean }): GridOptions {
  return {
    ...(o.brands ? { brands: counts(items, (p) => p.brand).sort((a, b) => b[1] - a[1]) } : {}),
    ...(o.cats ? { cats: counts(items, (p) => p.category) } : {}),
    facets: facetDefs(category)
      .map((f) => ({
        key: f.key,
        label: f.label,
        opts: counts(items, (p) => facetValue(p, f)).sort((a, b) => (parseFloat(a[0]) && parseFloat(b[0]) ? parseFloat(a[0]) - parseFloat(b[0]) : b[1] - a[1])),
      }))
      .filter((f) => f.opts.length > 1)
      .map((f) => ({ ...f, opts: f.opts.slice(0, 18) })),
  };
}

/** What a page hands PhoneBrowser: the first page in the default order, the counts, and where the rest is. */
export interface GridProps {
  initial: GridItem[];
  total: number;
  options: GridOptions;
  /** The full list's URL, when there is more than one page. */
  src?: string;
}

export function gridProps(summaries: PhoneSummary[], category: string, o: { brands: boolean; cats: boolean; src: string; version: string }): GridProps {
  const items = summaries.map((p) => toGridItem(p, category));
  return {
    initial: [...items].sort(SORT_FNS.popular).slice(0, PAGE_SIZE),
    total: items.length,
    options: gridOptions(items, category, o),
    ...(items.length > PAGE_SIZE ? { src: `${o.src}?v=${GRID_FORMAT}.${o.version}` } : {}),
  };
}

/**
 * A list file: the items without what they all share. `category` and `region` are hoisted when
 * every item has the same one, and `name` is left out where it is just brand and model (all of
 * them today), which cuts a file by about a quarter.
 */
export interface GridFile {
  category?: CategoryId;
  region?: RegionId;
  items: (Omit<GridItem, "name" | "category" | "region"> & Partial<Pick<GridItem, "name" | "category" | "region">>)[];
}

export function packGrid(items: GridItem[]): GridFile {
  const shared = <K extends "category" | "region">(k: K): GridItem[K] | undefined => (items.length && items.every((p) => p[k] === items[0][k]) ? items[0][k] : undefined);
  const category = shared("category");
  const region = shared("region");
  return {
    ...(category ? { category } : {}),
    ...(region ? { region } : {}),
    items: items.map(({ name, category: c, region: r, ...rest }) => ({
      ...(name === `${rest.brand} ${rest.model}` ? {} : { name }),
      ...(category ? {} : { category: c }),
      ...(region || !r ? {} : { region: r }),
      ...rest,
    })),
  };
}

export const unpackGrid = (f: GridFile): GridItem[] =>
  f.items.map((p) => ({ ...p, category: (p.category ?? f.category)!, ...(p.region ?? f.region ? { region: p.region ?? f.region } : {}), name: p.name ?? `${p.brand} ${p.model}` }));

/** The static list files (src/app/api/grid). Only lists longer than one page have one. */
export const gridSrc = {
  category: (region: RegionId, category: string) => `/api/grid/${region}/${category}`,
  brand: (slug: string) => `/api/grid/brands/${slug}`,
};
/** A short, URL-safe stamp of an import time (catalog.ts gridVersion). */
export const dataVersion = (updatedAt: string) => (Date.parse(updatedAt) || 0).toString(36);
