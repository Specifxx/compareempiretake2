import Link from "next/link";
import { marked } from "marked";
import { categoryHref, getCatalog, getDeals, getPhones, getProduct, getProducts, productHref, summarise } from "@/lib/catalog";
import { categoryById } from "@/lib/categories";
import { money, REGIONS, type RegionId } from "@/lib/region";
import { DealCard } from "./DealCard";
import { blockArgs, cheapestBy, cheapestStore, parseCats, planVsOutright, PRICE_TWINS, storeWins, topOptions, topProducts } from "@/lib/guide-data";
import { headingId } from "@/lib/guides";
import type { CategoryId, Phone, RetailerId } from "@/lib/types";
import { storageLabel } from "@/lib/normalize";
import { RETAILERS } from "@/lib/retailers";
import { PhoneCard } from "./PhoneCard";
import { RetailerDot } from "./RetailerChip";

/**
 * A product in one region: a phone slug ("apple-iphone-17"), or any product as "category/slug" ("tvs/lg-oled-evo-c5-65").
 * Slugs come from the stores' own titles, so the same model can have a different slug (or none) in another region.
 */
const find = (ref: string, region: RegionId) => (ref.includes("/") ? getProduct(ref.split("/")[0] as CategoryId, ref.split("/")[1], region) : getProduct("phones", ref, region));
/** The first region that sells a product, for its name. */
const findAny = (ref: string, regions: RegionId[]) => regions.map((r) => find(ref, r)).find(Boolean);
const href = (p: Phone) => productHref(p);
const n0 = (n: number) => n.toLocaleString("en-US");

/**
 * Renders a guide's markdown with live data, for every region we compare at once (owner, 2026-11-06: one post for
 * every country). Each live block and inline price is drawn once per region, inside `.rg-<region>` (blocks) or
 * `.rgi-<region>` (inline); CSS shows the reader's own (html[data-gr], set before paint by REGION_BOOT_SCRIPT; the US
 * when unknown, so crawlers read the US copy) and GuideRegionPicker switches it.
 *   {{price:slug}}  {{price:slug:256gb}}  {{stores:slug}}  {{name:slug}}   inline
 *   [[phone:slug|why we pick it]]                                        a pick card
 *   [[compare:slug,slug,...]]                                            store-by-store table
 *   [[list:max=500,min=0,brand=Samsung,fold=1,n=8]]                      a live grid
 *   [[top:cat=tvs,spec=Screen size:65",max=2000,q=oled,sort=price,n=10]]  a ranked table
 *   [[stores:cat=tvs+soundbars,only=apple+samsung]]                      who is cheapest how often
 *   [[by:cat=graphics-cards,spec=GPU,values=RTX 5060+RTX 5070]]           the cheapest of each spec value
 *   [[deals:cat=tvs,n=6]]                                                today's real deals (DealsView rules)
 *   [[build:cpus/slug|CPU,graphics-cards/slug|Graphics card,...]]          a parts list with today's total
 *   [[plans:n=10]]                                                       outright vs carrier repayments
 *   {{count:tvs}}  {{storecount:tvs}}                                       catalogue numbers, inline
 * Price amounts (max=, min=) are in each region's own currency, so posts for every region leave them out.
 * A block with no data in a region says so in one line there, so a post degrades instead of showing a stale price.
 */
export function GuideBody({ body, regions = ["au"] }: { body: string; regions?: RegionId[] }) {
  const parts = inline(body, regions).split(/^\[\[(\w+):([^\]]+)\]\]\s*$/m);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i += 3) {
    const md = parts[i];
    if (md.trim()) out.push(<div key={i} className="prose-ce" dangerouslySetInnerHTML={{ __html: withHeadingIds(marked.parse(md, { async: false }) as string) }} />);
    if (parts[i + 1]) {
      const kind = parts[i + 1];
      const arg = parts[i + 2];
      if (regions.length === 1) out.push(<div key={`b${i}`}>{Block(kind, arg, regions[0])}</div>);
      else
        out.push(
          <div key={`b${i}`}>
            {regions.map((r) => (
              <div key={r} className={`rg rg-${r}`}>{Block(kind, arg, r) ?? <NoData kind={kind} arg={arg} region={r} />}</div>
            ))}
          </div>,
        );
    }
  }
  return <>{out}</>;
}

/** One line where a block has nothing in a region, with that region's category page when the block names one. */
function NoData({ kind, arg, region }: { kind: string; arg: string; region: RegionId }) {
  const cat = kind === "compare" || kind === "phone" || kind === "build" ? undefined : parseCats(blockArgs(arg).cat?.[0] ?? "phones")[0];
  const c = cat ? categoryById(cat) : undefined;
  const live = c && getProducts(c.id as CategoryId, region).length > 0;
  return (
    <p className="not-prose my-6 rounded-xl border border-dashed border-line px-4 py-3 text-sm text-ink-mute">
      Not enough {REGIONS[region].adjective} stores we check sell these yet to rank them.
      {live && c && <> <Link prefetch={false} href={categoryHref(c.id, region)} className="font-medium text-brand hover:underline">See every {c.noun} price in {REGIONS[region].name}</Link>.</>}
    </p>
  );
}

/** h2s get the ids the table of contents links to (headingId, from the same markdown text). */
function withHeadingIds(html: string): string {
  return html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, inner: string) => `<h2 id="${headingId(inner.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"'))}">${inner}</h2>`);
}

/** An inline value per region: one span each, the reader's shown by CSS. One region: the bare value. */
function perRegion(regions: RegionId[], value: (r: RegionId) => string): string {
  if (regions.length === 1) return value(regions[0]);
  return regions.map((r) => `<span class="rgi rgi-${r}">${value(r)}</span>`).join("");
}

function inline(md: string, regions: RegionId[]): string {
  return md
    .replace(/\{\{(count|storecount):([a-z+-]+)\}\}/g, (_, kind, cats) => {
      const ids = parseCats(cats);
      return perRegion(regions, (r) =>
        kind === "count" ? n0(ids.reduce((n, c) => n + getProducts(c, r).length, 0)) : String(new Set(ids.flatMap((c) => getCatalog(c, r).retailers.map((x) => x.id))).size),
      );
    })
    .replace(/\{\{(price|stores|name|link):([a-z0-9/-]+)(?::([a-z0-9]+))?\}\}/g, (all, kind, slug, vid) => {
      if (kind === "name") return findAny(slug, regions)?.name ?? slug;
      if (kind === "link") {
        const any = findAny(slug, regions);
        if (!any) return slug;
        return perRegion(regions, (r) => {
          const p = find(slug, r);
          return p ? `<a href="${href(p)}">${p.name}</a>` : any.name;
        });
      }
      return perRegion(regions, (r) => {
        const p = find(slug, r);
        if (!p) return "—";
        if (kind === "stores") return String(p.retailerCount);
        const v = vid ? p.variants.find((x) => x.id === vid) : undefined;
        return money(v?.bestPrice ?? p.bestPrice, r);
      });
    });
}

/** A block in one region, or null when it has nothing to show there. Called as a function so an empty block is visible. */
function Block(kind: string, arg: string, region: RegionId): React.ReactNode | null {
  const $ = (n: number) => money(n, region);
  if (kind === "phone") {
    const [slug, note] = arg.split("|");
    const p = find(slug.trim(), region);
    return p ? <Pick p={p} note={note?.trim()} $={$} /> : null;
  }
  if (kind === "compare") {
    const phones = arg.split(",").map((s) => find(s.trim(), region)).filter(Boolean) as Phone[];
    return phones.length ? <StoreTable phones={phones} $={$} /> : null;
  }
  if (kind === "list") {
    const o = Object.fromEntries(arg.split(",").map((kv) => kv.split("=").map((s) => s.trim())));
    const list = (o.cat ? getProducts(o.cat as CategoryId, region) : getPhones(region))
      .filter(
        (p) =>
          (!o.max || p.bestPrice <= Number(o.max)) &&
          (!o.min || p.bestPrice >= Number(o.min)) &&
          (!o.brand || p.brand.toLowerCase() === o.brand.toLowerCase()) &&
          (!o.fold || p.specs.foldable) &&
          p.retailerCount >= Number(o.stores ?? 2) &&
          p.image,
      )
      .sort((a, b) => b.retailerCount - a.retailerCount || b.generation - a.generation)
      .slice(0, Number(o.n ?? 8))
      .map(summarise);
    return list.length ? (
      <div className="not-prose my-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {list.map((p) => <PhoneCard key={p.slug} p={p} />)}
      </div>
    ) : null;
  }
  if (kind === "top") {
    const o = topOptions(arg);
    const pool = o.cats.flatMap((c) => getProducts(c, region));
    let rows = topProducts(pool, o);
    // A region with few shared listings yet (the US and UK catalogues are younger than Australia's): rank what single
    // stores sell rather than show nothing. The row says "1 store", so it never reads as a comparison.
    if (rows.length < 3 && (o.stores ?? 2) > 1) rows = topProducts(pool, { ...o, stores: 1 });
    return rows.length ? <TopTable rows={rows} $={$} /> : null;
  }
  if (kind === "by") {
    const a = blockArgs(arg);
    const cats = parseCats(a.cat?.[0]);
    const rows = cheapestBy(cats.flatMap((c) => getProducts(c, region)), {
      cats,
      spec: a.spec?.[0] ?? "",
      values: a.values?.[0]?.split("+").map((v) => v.trim()),
      minModels: a.models ? Number(a.models[0]) : undefined,
      stores: a.stores ? Number(a.stores[0]) : undefined,
      max: a.max ? Number(a.max[0]) : undefined,
    });
    return rows.length ? <ByTable rows={rows} label={a.label?.[0] ?? a.spec?.[0] ?? ""} $={$} /> : null;
  }
  if (kind === "deals") {
    const a = blockArgs(arg);
    const deals = getDeals(Number(a.n?.[0] ?? 6), a.cat?.[0] as CategoryId | undefined, region);
    return deals.length ? <div className="not-prose my-6 grid gap-3 md:grid-cols-2">{deals.map((d) => <DealCard key={`${d.phone.category}/${d.phone.slug}`} d={d} />)}</div> : null;
  }
  if (kind === "build") {
    const parts = arg
      .split(",")
      .map((x) => {
        const [ref, role] = x.split("|").map((y) => y.trim());
        return { role: role ?? "", p: find(ref, region) };
      })
      .filter((x): x is { role: string; p: Phone } => !!x.p);
    return parts.length ? <BuildTable parts={parts} $={$} /> : null;
  }
  if (kind === "plans") {
    const rows = planVsOutright(getPhones(region), Number(blockArgs(arg).n?.[0] ?? 10));
    return rows.length ? <PlansTable rows={rows} $={$} /> : null;
  }
  if (kind === "stores") {
    const a = blockArgs(arg);
    const cats = parseCats(a.cat?.[0]);
    const only = a.only?.[0]?.split("+") as RetailerId[] | undefined;
    const wins = storeWins(cats.flatMap((c) => getProducts(c, region)), { only, minCompared: Number(a.min?.[0] ?? 10) });
    return wins.length ? <WinsTable wins={wins} /> : null;
  }
  return null;
}

type Money = (n: number) => string;

const storeName = (r: RetailerId) => (Object.values(PRICE_TWINS).includes(r) ? [r, ...Object.keys(PRICE_TWINS).filter((k) => PRICE_TWINS[k as RetailerId] === r)].map((x) => RETAILERS[x as RetailerId].name).join(" / ") : RETAILERS[r].name);

function TopTable({ rows, $ }: { rows: Phone[]; $: Money }) {
  return (
    <div className="card not-prose my-6 overflow-hidden">
      <ol className="divide-y divide-line">
        {rows.map((p, i) => {
          const store = cheapestStore(p);
          return (
            <li key={p.slug}>
              <Link href={href(p)} prefetch={false} className="flex items-center gap-3 px-3 py-3 transition hover:bg-bg-sunk sm:gap-4 sm:px-4">
                <span className="w-5 shrink-0 text-center font-display text-sm font-bold text-ink-mute">{i + 1}</span>
                <span className="img-tile grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl">
                  {p.image && <img src={p.image} alt={p.name} loading="lazy" className="product-img h-full w-full object-contain p-1.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm font-semibold leading-snug">{p.name}</span>
                  <span className="mt-0.5 block text-xs text-ink-mute">
                    {p.retailerCount} {p.retailerCount === 1 ? "store" : "stores"}{store && <> · cheapest at {RETAILERS[store].name}</>}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[11px] text-ink-mute">from</span>
                  <span className="price text-base sm:text-lg">{$(p.bestPrice)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ByTable({ rows, label, $ }: { rows: ReturnType<typeof cheapestBy>; label: string; $: Money }) {
  return (
    <div className="card not-prose my-6 overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="px-4 py-3 font-medium text-ink-mute">{label}</th>
            <th className="px-4 py-3 font-medium text-ink-mute">Cheapest in stock today</th>
            <th className="px-4 py-3 text-right font-medium text-ink-mute">Price</th>
            <th className="px-4 py-3 text-right font-medium text-ink-mute">Models</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const store = cheapestStore(r.cheapest);
            return (
              <tr key={r.value} className="border-b border-line last:border-0">
                <td className="whitespace-nowrap px-4 py-3 font-semibold">{r.value}</td>
                <td className="px-4 py-3">
                  <Link href={href(r.cheapest)} prefetch={false} className="line-clamp-2 hover:text-brand">{r.cheapest.name}</Link>
                  {store && <span className="text-xs text-ink-mute">at {RETAILERS[store].name}</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums">{$(r.cheapest.bestPrice)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-ink-mute">{r.models}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BuildTable({ parts, $ }: { parts: { role: string; p: Phone }[]; $: Money }) {
  const total = parts.reduce((n, x) => n + x.p.bestPrice, 0);
  return (
    <div className="card not-prose my-6 overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <tbody>
          {parts.map(({ role, p }) => {
            const store = cheapestStore(p);
            return (
              <tr key={p.slug} className="border-b border-line">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-ink-mute">{role}</td>
                <td className="px-4 py-3"><Link href={href(p)} prefetch={false} className="font-medium hover:text-brand">{p.name}</Link>{store && <span className="block text-xs text-ink-mute">cheapest at {RETAILERS[store].name}</span>}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums">{$(p.bestPrice)}</td>
              </tr>
            );
          })}
          <tr className="bg-bg-sunk">
            <td className="px-4 py-3 font-bold" colSpan={2}>Total today, buying each part where it&apos;s cheapest</td>
            <td className="whitespace-nowrap px-4 py-3 text-right font-display text-lg font-bold tabular-nums">{$(Math.round(total))}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function PlansTable({ rows, $ }: { rows: ReturnType<typeof planVsOutright>; $: Money }) {
  return (
    <div className="card not-prose my-6 overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="px-4 py-3 font-medium text-ink-mute">Phone</th>
            <th className="px-4 py-3 text-right font-medium text-ink-mute">Cheapest outright</th>
            <th className="px-4 py-3 text-right font-medium text-ink-mute">Cheapest on a plan (phone only)</th>
            <th className="px-4 py-3 text-right font-medium text-ink-mute">Difference</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const diff = r.plan.price - r.outright.price;
            return (
              <tr key={r.phone.slug} className="border-b border-line last:border-0">
                <td className="px-4 py-3"><Link href={href(r.phone)} prefetch={false} className="font-medium hover:text-brand">{r.phone.name}</Link> <span className="text-xs text-ink-mute">{storageLabel(r.storageGb)}</span></td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums"><b>{$(r.outright.price)}</b><span className="block text-xs text-ink-mute">{RETAILERS[r.outright.retailer].name}</span></td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                  <b>{$(Math.round(r.plan.price))}</b>
                  <span className="block text-xs text-ink-mute">{RETAILERS[r.plan.retailer].name}{r.plan.monthly && r.plan.months ? ` · ${$(r.plan.monthly)} × ${r.plan.months} months` : ""}</span>
                </td>
                <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${diff < 0 ? "text-save" : "text-ink-soft"}`}>{diff < 0 ? `${$(Math.round(-diff))} less on a plan` : diff > 0 ? `${$(Math.round(diff))} more on a plan` : "Same"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-line px-4 py-2.5 text-xs text-ink-mute">The plan column is the phone&apos;s repayments only, as the carrier lists them; the plan&apos;s own monthly charge is on top, and carrier prices can depend on the plan you pick.</p>
    </div>
  );
}

function WinsTable({ wins }: { wins: ReturnType<typeof storeWins> }) {
  return (
    <div className="card not-prose my-6 overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="px-4 py-3 font-medium text-ink-mute">Store</th>
            <th className="px-4 py-3 text-right font-medium text-ink-mute">Prices compared</th>
            <th className="px-4 py-3 font-medium text-ink-mute">Cheapest (or equal cheapest)</th>
            <th className="px-4 py-3 text-right font-medium text-ink-mute">Typical gap when not</th>
          </tr>
        </thead>
        <tbody>
          {wins.map((w) => {
            const pct = Math.round((100 * w.wins) / w.compared);
            return (
              <tr key={w.retailer} className="border-b border-line last:border-0">
                <td className="px-4 py-3"><span className="inline-flex items-center gap-2 font-medium"><RetailerDot id={w.retailer} /> {storeName(w.retailer)}</span></td>
                <td className="px-4 py-3 text-right tabular-nums text-ink-soft">{n0(w.compared)}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-24 overflow-hidden rounded-full bg-bg-sunk"><span className="block h-full rounded-full bg-save" style={{ width: `${pct}%` }} /></span>
                    <span className="tabular-nums font-semibold">{pct}%</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-ink-soft">{w.wins === w.compared ? "—" : `+${w.medianGap.toFixed(w.medianGap < 1 ? 1 : 0)}%`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-line px-4 py-2.5 text-xs text-ink-mute">Every product variant at least two of these stores had in stock today, at its outright price. Recalculated every morning.</p>
    </div>
  );
}

function Pick({ p, note, $ }: { p: Phone; note?: string; $: Money }) {
  const v = p.variants.reduce((a, b) => (a.bestPrice <= b.bestPrice ? a : b));
  const best = v.offers.find((o) => o.inStock && o.price === v.bestPrice) ?? v.offers[0];
  return (
    <div className="card my-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <Link href={href(p)} prefetch={false} className="img-tile grid h-32 w-full shrink-0 place-items-center overflow-hidden rounded-xl sm:h-28 sm:w-28">
        {p.image && <img src={p.image} alt={p.name} loading="lazy" className="product-img h-full object-contain p-2" />}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={href(p)} prefetch={false} className="font-display text-lg font-bold hover:text-brand">{p.name}</Link>
        {note && <p className="mt-1 text-sm text-ink-soft">{note.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")}</p>}
        <div className="mt-2 text-xs text-ink-mute">
          {p.variants.map((x) => storageLabel(x.storageGb)).join(" · ")} · sold by {p.retailerCount} {p.retailerCount === 1 ? "store" : "stores"}
        </div>
      </div>
      <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
        <div className="text-xs text-ink-mute">today from</div>
        <div className="price text-2xl">{$(p.bestPrice)}</div>
        <div className="flex items-center gap-1.5 text-xs text-ink-mute"><RetailerDot id={best.retailer} className="h-2 w-2" /> {RETAILERS[best.retailer].name}</div>
        <Link href={href(p)} prefetch={false} className="btn-primary ml-auto py-2 text-xs sm:ml-0 sm:mt-1">Compare prices</Link>
      </div>
    </div>
  );
}

function StoreTable({ phones, $ }: { phones: Phone[]; $: Money }) {
  const cheapest = (p: Phone, r: RetailerId) =>
    p.variants.flatMap((v) => v.offers.filter((o) => o.retailer === r && o.kind !== "plan").map((o) => ({ price: o.price, gb: v.storageGb }))).sort((a, b) => a.price - b.price)[0];
  const ids = (Object.keys(RETAILERS) as RetailerId[]).filter((r) => phones.some((p) => cheapest(p, r)));
  return (
    <div className="card my-6 overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="px-4 py-3 font-medium text-ink-mute">Store</th>
            {phones.map((p) => (
              <th key={p.slug} className="px-4 py-3 font-semibold"><Link href={href(p)} prefetch={false} className="hover:text-brand">{p.name}</Link></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ids.map((r) => (
            <tr key={r} className="border-b border-line last:border-0">
              <td className="px-4 py-3"><span className="inline-flex items-center gap-2"><RetailerDot id={r} /> {RETAILERS[r].name}</span></td>
              {phones.map((p) => {
                const c = cheapest(p, r);
                const low = c && c.price === p.bestPrice;
                return (
                  <td key={p.slug} className={`px-4 py-3 tabular-nums ${low ? "font-bold text-save" : ""}`}>
                    {c ? <>{$(c.price)} <span className="text-xs font-normal text-ink-mute">{storageLabel(c.gb)}</span></> : <span className="text-ink-mute">—</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
