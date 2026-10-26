import Link from "next/link";
import { marked } from "marked";
import { getPhone, getPhones, getProduct, getProducts, summarise } from "@/lib/catalog";
import type { CategoryId } from "@/lib/types";

/** A phone slug ("apple-iphone-17"), or any product as "category/slug" ("tvs/lg-oled-evo-c5-65"). */
const find = (ref: string) => (ref.includes("/") ? getProduct(ref.split("/")[0] as CategoryId, ref.split("/")[1]) : getPhone(ref));
import { storageLabel } from "@/lib/normalize";
import { RETAILERS } from "@/lib/retailers";
import type { Phone, RetailerId } from "@/lib/types";
import { PhoneCard } from "./PhoneCard";
import { RetailerDot } from "./RetailerChip";

/**
 * Renders a guide's markdown with live data:
 *   {{price:slug}}  {{price:slug:256gb}}  {{stores:slug}}  {{name:slug}}   inline
 *   [[phone:slug|why we pick it]]                                        a pick card
 *   [[compare:slug,slug,...]]                                            store-by-store table
 *   [[list:max=500,min=0,brand=Samsung,fold=1,n=8]]                      a live grid
 * A shortcode naming a phone no store sells any more renders nothing, so a
 * guide degrades instead of showing a stale price.
 */
export function GuideBody({ body }: { body: string }) {
  const parts = inline(body).split(/^\[\[(\w+):([^\]]+)\]\]\s*$/m);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i += 3) {
    const md = parts[i];
    if (md.trim()) out.push(<div key={i} className="prose-ce" dangerouslySetInnerHTML={{ __html: marked.parse(md, { async: false }) as string }} />);
    if (parts[i + 1]) out.push(<Block key={`b${i}`} kind={parts[i + 1]} arg={parts[i + 2]} />);
  }
  return <>{out}</>;
}

function inline(md: string): string {
  return md.replace(/\{\{(price|stores|name|link):([a-z0-9/-]+)(?::([a-z0-9]+))?\}\}/g, (all, kind, slug, vid) => {
    const p = find(slug);
    if (!p) return kind === "name" || kind === "link" ? slug : "—";
    if (kind === "price") {
      const v = vid ? p.variants.find((x) => x.id === vid) : undefined;
      return `$${(v?.bestPrice ?? p.bestPrice).toLocaleString("en-AU")}`;
    }
    if (kind === "stores") return String(p.retailerCount);
    if (kind === "link") return `[${p.name}](/${p.category}/${p.slug})`;
    return p.name;
  });
}

function Block({ kind, arg }: { kind: string; arg: string }) {
  if (kind === "phone") {
    const [slug, note] = arg.split("|");
    const p = find(slug.trim());
    return p ? <Pick p={p} note={note?.trim()} /> : null;
  }
  if (kind === "compare") {
    const phones = arg.split(",").map((s) => find(s.trim())).filter(Boolean) as Phone[];
    return phones.length ? <StoreTable phones={phones} /> : null;
  }
  if (kind === "list") {
    const o = Object.fromEntries(arg.split(",").map((kv) => kv.split("=").map((s) => s.trim())));
    const list = (o.cat ? getProducts(o.cat as CategoryId) : getPhones())
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
    return (
      <div className="not-prose my-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {list.map((p) => <PhoneCard key={p.slug} p={p} />)}
      </div>
    );
  }
  return null;
}

function Pick({ p, note }: { p: Phone; note?: string }) {
  const v = p.variants.reduce((a, b) => (a.bestPrice <= b.bestPrice ? a : b));
  const best = v.offers.find((o) => o.inStock && o.price === v.bestPrice) ?? v.offers[0];
  return (
    <div className="card my-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <Link href={`/${p.category}/${p.slug}`} prefetch={false} className="img-tile grid h-32 w-full shrink-0 place-items-center overflow-hidden rounded-xl sm:h-28 sm:w-28">
        {p.image && <img src={p.image} alt={p.name} loading="lazy" className="product-img h-full object-contain p-2" />}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/${p.category}/${p.slug}`} prefetch={false} className="font-display text-lg font-bold hover:text-brand">{p.name}</Link>
        {note && <p className="mt-1 text-sm text-ink-soft">{note.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")}</p>}
        <div className="mt-2 text-xs text-ink-mute">
          {p.variants.map((x) => storageLabel(x.storageGb)).join(" · ")} · sold by {p.retailerCount} {p.retailerCount === 1 ? "store" : "stores"}
        </div>
      </div>
      <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
        <div className="text-xs text-ink-mute">today from</div>
        <div className="price text-2xl">${p.bestPrice.toLocaleString("en-AU")}</div>
        <div className="flex items-center gap-1.5 text-xs text-ink-mute"><RetailerDot id={best.retailer} className="h-2 w-2" /> {RETAILERS[best.retailer].name}</div>
        <Link href={`/${p.category}/${p.slug}`} prefetch={false} className="btn-primary ml-auto py-2 text-xs sm:ml-0 sm:mt-1">Compare prices</Link>
      </div>
    </div>
  );
}

function StoreTable({ phones }: { phones: Phone[] }) {
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
              <th key={p.slug} className="px-4 py-3 font-semibold"><Link href={`/${p.category}/${p.slug}`} prefetch={false} className="hover:text-brand">{p.name}</Link></th>
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
                    {c ? <>${c.price.toLocaleString("en-AU")} <span className="text-xs font-normal text-ink-mute">{storageLabel(c.gb)}</span></> : <span className="text-ink-mute">—</span>}
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
