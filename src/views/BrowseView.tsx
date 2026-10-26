import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { activeCategories, getProducts } from "@/lib/catalog";
import { categoryById } from "@/lib/categories";
import { money, REGIONS, withRegion, type RegionId } from "@/lib/region";
import type { CategoryId } from "@/lib/types";

/**
 * Plain HTML lists of every product, A to Z, so every product page is reachable by a crawlable link
 * (category grids load most of their products in the browser). 200 links a page.
 */
const PER_PAGE = 200;
const IN: Record<RegionId, string> = { au: "Australia", us: "the US", uk: "the UK" };

const sorted = (category: CategoryId, region: RegionId) => [...getProducts(category, region)].sort((a, b) => a.name.localeCompare(b.name));
const pages = (category: CategoryId, region: RegionId) => Math.max(1, Math.ceil(getProducts(category, region).length / PER_PAGE));

export const browseCategoryParams = (region: RegionId) => activeCategories(region).map((c) => ({ category: c.id }));
export const browsePageParams = (region: RegionId) =>
  activeCategories(region).flatMap((c) => Array.from({ length: pages(c.id as CategoryId, region) - 1 }, (_, i) => ({ category: c.id, page: String(i + 2) })));

export function browseIndexMetadata(region: RegionId): Metadata {
  return { title: `Browse every product we compare in ${IN[region]}`, description: `An A to Z list of every product and category Compare Empire tracks across ${REGIONS[region].adjective} stores.`, alternates: { canonical: withRegion("/browse", region) } };
}

export function BrowseIndex({ region }: { region: RegionId }) {
  const cats = activeCategories(region);
  return (
    <div className="container-x max-w-4xl pt-10 pb-16">
      <nav className="mb-4 text-sm text-ink-mute" aria-label="Breadcrumb">
        <Link href={REGIONS[region].prefix || "/"} className="hover:text-ink">Home</Link> / <span>Browse</span>
      </nav>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Browse every product</h1>
      <p className="mt-2 text-ink-mute">Every category and product we compare in {IN[region]}, A to Z.</p>
      <ul className="mt-8 grid gap-2 sm:grid-cols-2">
        {cats.map((c) => (
          <li key={c.id}>
            <Link href={withRegion(`/browse/${c.id}`, region)} className="card flex items-center justify-between px-4 py-3 hover:shadow-lift">
              <span className="font-semibold">{c.emoji} {c.name}</span>
              <span className="text-sm text-ink-mute">{getProducts(c.id as CategoryId, region).length.toLocaleString()} products</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Params = Promise<{ category: string; page?: string }>;
async function resolve(params: Params, region: RegionId) {
  const { category, page } = await params;
  const c = categoryById(category);
  if (!c || !activeCategories(region).some((x) => x.id === c.id)) return null;
  const n = page ? Number(page) : 1;
  const total = pages(c.id as CategoryId, region);
  if (!Number.isInteger(n) || n < 1 || n > total || page === "1") return null;
  return { c, n, total };
}

export async function browseMetadata(params: Params, region: RegionId): Promise<Metadata> {
  const r = await resolve(params, region);
  if (!r) return {};
  const path = withRegion(`/browse/${r.c.id}${r.n > 1 ? `/${r.n}` : ""}`, region);
  return {
    title: `All ${r.c.name.toLowerCase()} A to Z${r.total > 1 ? ` (page ${r.n} of ${r.total})` : ""} — ${IN[region]}`,
    description: `Every ${r.c.noun} we compare in ${IN[region]}, listed A to Z with today's lowest price${r.total > 1 ? `, page ${r.n} of ${r.total}` : ""}.`,
    alternates: { canonical: path },
  };
}

export async function BrowseCategory({ params, region }: { params: Params; region: RegionId }) {
  const r = await resolve(params, region);
  if (!r) notFound();
  const { c, n, total } = r;
  const items = sorted(c.id as CategoryId, region).slice((n - 1) * PER_PAGE, n * PER_PAGE);
  const page = (k: number) => withRegion(`/browse/${c.id}${k > 1 ? `/${k}` : ""}`, region);
  return (
    <div className="container-x max-w-4xl pt-10 pb-16">
      <nav className="mb-4 text-sm text-ink-mute" aria-label="Breadcrumb">
        <Link href={REGIONS[region].prefix || "/"} className="hover:text-ink">Home</Link> / <Link href={withRegion("/browse", region)} className="hover:text-ink">Browse</Link> / <span>{c.name}</span>
      </nav>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">All {c.name.toLowerCase()}, A to Z</h1>
      <p className="mt-2 text-ink-mute">
        {getProducts(c.id as CategoryId, region).length.toLocaleString()} products{total > 1 ? ` · page ${n} of ${total}` : ""}. For filters and sorting, see <Link href={withRegion(`/${c.id}`, region)} className="underline">{c.name}</Link>.
      </p>
      <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-bg-card">
        {items.map((p) => (
          <li key={p.slug}>
            <Link href={withRegion(`/${p.category}/${p.slug}`, region)} prefetch={false} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm hover:bg-bg-sunk">
              <span className="min-w-0 truncate">{p.name}</span>
              <span className="shrink-0 text-ink-mute">{money(p.bestPrice, region)} · {p.retailerCount} {p.retailerCount === 1 ? "store" : "stores"}</span>
            </Link>
          </li>
        ))}
      </ul>
      {total > 1 && (
        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Pages">
          {Array.from({ length: total }, (_, i) => i + 1).map((k) => (
            <Link key={k} href={page(k)} aria-current={k === n ? "page" : undefined} className={`chip text-xs ${k === n ? "chip-on" : ""}`}>{k}</Link>
          ))}
        </nav>
      )}
    </div>
  );
}
