"use client";
import { useSearchParams } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { marketplacesFor } from "@/lib/marketplaces";
import { AmazonNote, AmazonRow } from "./AmazonLink";
import { AMAZON_PRICE_DISCLAIMER } from "./AmazonLivePrice";
import { amazonLink, amazonStore } from "@/lib/amazon";
import { EbayListingRow, EbaySearchRow, PIN_OUTLINE } from "./EbayListingRow";
import { REGIONS, withRegion } from "@/lib/region";
import { ebaySearch, ebaySellers, SPONSORED_REL } from "@/lib/ebay";
import { RETAILERS } from "@/lib/retailers";
import { shopifyCartHref, storeLink } from "@/lib/store-links";
import type { Offer, Phone, RetailerId } from "@/lib/types";
import { CheckIcon, ExternalIcon } from "./icons";
import { ShareButton } from "./ShareButton";
import { shareText } from "@/lib/share-link";
import { RetailerDot } from "./RetailerChip";
import { SaveButton } from "./SaveButton";
import { CompareToggle } from "./CompareToggle";
import { PriceCheckCard } from "./PriceCheckCard";
import { StoreVote } from "./StoreVote";
import { CartAddButton } from "./cart/CartAddButton";
import { PriceAlertButton } from "./PriceAlertButton";

/** The clock an Amazon price's "as of" time is shown in: the region's own. */
const AMAZON_CLOCK: Record<string, string> = { au: "Sydney time", us: "New York time", uk: "London time", ca: "Toronto time", sg: "Singapore time" };
import { aboveRrp, unusuallyHigh, type PriceCheck, type Rrp, type StorePrice, type WasCheck } from "@/lib/price-check";
import { useRegionKit } from "@/lib/use-region";

/** One row per retailer: its cheapest listing, with the colours it has at that price. */
export function groupByRetailer(list: Offer[]) {
  const m = new Map<RetailerId, { best: Offer; colours: Set<string>; all: Offer[] }>();
  for (const o of list) {
    const r = m.get(o.retailer);
    if (!r) m.set(o.retailer, { best: o, colours: new Set([o.colour]), all: [o] });
    else {
      r.all.push(o);
      const better = (o.inStock && !r.best.inStock) || (o.inStock === r.best.inStock && o.price < r.best.price);
      if (better) r.best = o;
      r.colours.add(o.colour);
    }
  }
  return [...m.values()].sort((a, b) => Number(b.best.inStock) - Number(a.best.inStock) || a.best.price - b.best.price);
}

/** Gallery + storage picker + the retailer price table for one phone. */
export function PhoneOffers({
  phone,
  chart,
  checks,
  checkedAt = {},
}: {
  phone: Phone;
  chart: Record<string, React.ReactNode>;
  checks: Record<string, { check: PriceCheck; was: Partial<Record<RetailerId, WasCheck>>; kinds?: Partial<Record<RetailerId, StorePrice>> }>;
  /** When each store's prices were last read (lib/catalog.ts storeCheckedAt), ISO time. */
  checkedAt?: Partial<Record<RetailerId, string>>;
}) {
  const params = useSearchParams();
  const initial = phone.variants.find((v) => v.id === params.get("v")) ?? defaultVariant(phone);
  const [vid, setVid] = useState(initial.id);
  const [colour, setColour] = useState<string | null>(null);
  const variant = phone.variants.find((v) => v.id === vid) ?? initial;
  const { $, R, region } = useRegionKit();
  const href = withRegion(`/${phone.category}/${phone.slug}`, region);
  const mq = `${phone.name}${variant.storageGb ? ` ${variant.label.split(" ·")[0]}` : ""}`;
  const vLabel = phone.variants.length > 1 || variant.storageGb ? variant.label : "";

  const colours = useMemo(() => [...new Set(variant.offers.map((o) => o.colour).filter(Boolean))].sort(), [variant]);
  const shown = colour && colours.includes(colour) ? variant.offers.filter((o) => o.colour === colour) : variant.offers;

  const rows = useMemo(() => groupByRetailer(shown.filter((o) => o.kind !== "plan")), [shown]);
  const planRows = useMemo(() => groupByRetailer(shown.filter((o) => o.kind === "plan")), [shown]);
  const [tabPick, setTab] = useState<"outright" | "plan" | null>(null);
  const tab = tabPick ?? (rows.length ? "outright" : "plan");

  const [img, setImg] = useState(0);
  const images = useMemo(() => {
    const fromColour = colour ? shown.map((o) => o.image).filter(Boolean) as string[] : [];
    return [...new Set([...fromColour, ...phone.images])].slice(0, 6);
  }, [colour, shown, phone.images]);
  const best = rows[0]?.best;
  const top = rows.length > 1 ? Math.max(...rows.map((r) => r.best.price)) : undefined;

  // Word of mouth: the message names the real gap between two stores, in-stock outright prices only.
  const shareMsg = shareText(
    `${phone.name}${vLabel ? ` ${vLabel}` : ""}`,
    rows.filter((r) => r.best.inStock).map((r) => ({ price: r.best.price, store: RETAILERS[r.best.retailer].name })),
    $,
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="img-tile relative aspect-square overflow-hidden rounded-3xl border border-line">
          {images[img] && <img src={images[img]} alt={phone.name} className="product-img absolute inset-0 h-full w-full object-contain p-10" />}
          <SaveButton slug={href} className="absolute right-4 top-4" />
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
            {images.map((src, i) => (
              <button key={src} onClick={() => setImg(i)} className={`img-tile h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${i === img ? "border-brand" : "border-transparent"}`}>
                <img src={src} alt={`${phone.name}, photo ${i + 1}`} className="product-img h-full w-full object-contain p-1.5" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="text-sm font-semibold text-brand">{phone.brand}</div>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{phone.model}</h1>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <div className="shrink-0">
            <div className="text-xs text-ink-mute">Best price{vLabel ? ` · ${vLabel}` : ""}</div>
            <div className="price text-4xl">{$(variant.bestPrice)}</div>
            {top && top > variant.bestPrice && (
              <div className="mt-1 text-xs font-semibold text-save">Save {$((top - variant.bestPrice))} vs dearest store</div>
            )}
          </div>
          <a
            href={phone.ebay?.url ?? ebaySearch(mq, { condition: "new", customid: `p-${phone.category}-${phone.slug}-top`, phones: phone.category === "phones", region })}
            target="_blank"
            rel={SPONSORED_REL}
            data-buy="ebay"
            data-buy-product={href}
            data-buy-kind="ebay-top"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-line bg-bg-card px-3 py-2 text-sm font-semibold transition hover:border-brand/40 sm:self-center"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#E53238] ring-1 ring-black/10" />
            {phone.ebay ? <>eBay {$(phone.ebay.price)}</> : "Check eBay"}
            <span className="rounded-full bg-bg-sunk px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft">Ad</span>
          </a>
          {checks[variant.id] && (
            <PriceCheckCard check={checks[variant.id].check} onOpenHistory={() => document.getElementById("history")?.scrollIntoView({ behavior: "smooth", block: "center" })} />
          )}
        </div>

        {phone.variants.length > 1 && (
        <div className="mt-6">
          <div className="eyebrow mb-2">{phone.category === "tablets" ? "Storage & connectivity" : phone.category === "phones" ? "Storage" : "Options"}</div>
          <div className="flex flex-wrap gap-2">
            {phone.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setVid(v.id);
                  setImg(0);
                  history.replaceState(null, "", `?v=${v.id}`);
                }}
                className={`rounded-xl border px-4 py-2.5 text-left transition ${v.id === variant.id ? "border-brand bg-brand-soft" : "border-line bg-bg-card hover:border-ink/25"}`}
              >
                <div className={`text-sm font-semibold ${v.id === variant.id ? "text-brand" : ""}`}>{v.label}</div>
                <div className="text-xs text-ink-mute">from {$(v.bestPrice)}</div>
              </button>
            ))}
          </div>
        </div>
        )}

        {colours.length > 1 && (
          <div className="mt-5">
            <div className="eyebrow mb-2">Colour</div>
            <div className="flex flex-wrap gap-2">
              <button className={`chip text-xs ${!colour ? "chip-on" : ""}`} onClick={() => { setColour(null); setImg(0); }}>Any colour</button>
              {colours.map((c) => (
                <button key={c} className={`chip text-xs ${colour === c ? "chip-on" : ""}`} onClick={() => { setColour(c); setImg(0); }}>{c}</button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            {planRows.length > 0 ? (
            <div className="inline-flex rounded-xl border border-line bg-bg-sunk p-1" role="tablist">
              {([
                ["outright", `Buy outright`, rows.length],
                ["plan", `On a plan`, planRows.length],
              ] as const).map(([id, label, n]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  disabled={!n}
                  onClick={() => setTab(id)}
                  className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:opacity-40 ${tab === id ? "bg-bg-card text-ink shadow-sm" : "text-ink-mute hover:text-ink"}`}
                >
                  {label} <span className="font-normal text-ink-mute">{n}</span>
                </button>
              ))}
            </div>
            ) : (
              <h2 className="font-display text-xl font-bold">Compare {rows.length} {rows.length === 1 ? "store" : "stores"}</h2>
            )}
            <span className="text-xs text-ink-mute">{tab === "outright" ? "Cheapest in-stock first" : "Lowest monthly repayment first"}</span>
          </div>
          {tab === "outright" ? (
          <>
          {variant.rrp && <RrpLine rrp={variant.rrp} rows={rows.map((r) => r.best)} />}
          {/* The cheapest store always comes first; the eBay and Amazon ads sit under it, never above it (US shopper review, 2026-11-06). */}
          <ol className="space-y-2.5">
            {rows.map(({ best: o, colours: cs }, i) => (
              <Fragment key={o.retailer}>
                <li>
                  <OutrightRow
                    o={o}
                    colours={cs}
                    rank={i}
                    best={best}
                    product={href}
                    was={checks[variant.id]?.was[o.retailer]}
                    rrp={variant.rrp}
                    kind={checks[variant.id]?.kinds?.[o.retailer]}
                    others={rows.filter((r) => r.best.retailer !== o.retailer).map((r) => r.best.price)}
                    checkedAt={checkedAt[o.retailer]}
                    cart={{ title: phone.name, detail: vLabel || null, image: phone.image ?? phone.images[0] ?? null }}
                  />
                </li>
                {i === 0 && <li><PinnedMarketplaces phone={phone} variantId={variant.id} variantQuery={mq} product={href} cheapest={best?.price} part="rows" /></li>}
              </Fragment>
            ))}
            {!rows.length && <li><PinnedMarketplaces phone={phone} variantId={variant.id} variantQuery={mq} product={href} cheapest={best?.price} part="rows" /></li>}
          </ol>
          <PinnedMarketplaces phone={phone} variantId={variant.id} variantQuery={mq} product={href} cheapest={best?.price} part="more" />
          {checkedWas(checks[variant.id]?.was).length > 0 && (
            <div className="mt-4 rounded-2xl bg-bg-sunk p-4">
              <div className="text-sm font-semibold">Are these &ldquo;was&rdquo; prices real?</div>
              <ul className="mt-2 space-y-1.5 text-xs text-ink-soft">
                {checkedWas(checks[variant.id]?.was).map((w) => (
                  <li key={w!.retailer} className="flex gap-2">
                    <span className={w!.status === "backed" ? "text-save" : w!.status === "never" ? "text-hot" : "text-ink-mute"}>{w!.status === "backed" ? "✓" : w!.status === "never" ? "⚠" : "•"}</span>
                    <span><b className="text-ink">{RETAILERS[w!.retailer].name} says was {$(w!.was)}.</b> {w!.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          </>
          ) : (
          <>
          <ol className="space-y-2.5">
            {[...planRows].sort((a, b) => (a.best.monthly ?? 0) - (b.best.monthly ?? 0)).map(({ best: o }) => (
              <li key={o.retailer}>
                <a href={storeLink(o.url, "plan").href} target="_blank" rel={storeLink(o.url, "plan").rel} data-buy={o.retailer} data-buy-product={href} data-buy-price={o.monthly} data-buy-kind="plan" className="card flex items-center gap-3 p-4 transition hover:border-brand/40 hover:shadow-lift sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex items-center gap-2 font-semibold"><RetailerDot id={o.retailer} /> {RETAILERS[o.retailer].name}</span>
                    <div className="mt-1 text-xs text-ink-mute">
                      Phone repayments over {o.months ?? 36} months · {$(o.price)} total for the phone
                      {best && o.price > best.price && <span className="text-hot"> (+{$(Math.round(o.price - best.price))} vs cheapest outright)</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="price text-xl sm:text-2xl">${(o.monthly ?? 0).toFixed(2)}<span className="text-sm font-medium text-ink-mute">/mth</span></div>
                    <div className="text-[11px] text-ink-mute">+ plan</div>
                  </div>
                  <ExternalIcon className="h-4 w-4 text-ink-mute" />
                </a>
              </li>
            ))}
          </ol>
          <div className="mt-2.5"><PinnedMarketplaces phone={phone} variantId={variant.id} variantQuery={mq} product={href} cheapest={best?.price} /></div>
          <p className="mt-3 text-xs text-ink-mute">
            Repayments are for the phone only; you also pay for a mobile plan from that carrier. Leaving early usually means paying off the rest of the phone.
            {rows.length > 0 && best && <> Buying outright from {RETAILERS[best.retailer].name} at {$(best.price)} and adding any SIM-only plan is often cheaper.</>}
          </p>
          </>
          )}
          <p className="mt-3 text-xs text-ink-mute">
            {R.taxNote}, checked daily. Delivery and in-store availability vary — confirm on the retailer&apos;s site.{" "}
            <Link prefetch={false} href={withRegion("/stores", region)} className="underline underline-offset-2 hover:text-ink">Which stores we check</Link>
            {" · "}
            <Link prefetch={false} href="/contact#suggest" className="underline underline-offset-2 hover:text-ink">Missing a store? Suggest one</Link>
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <PriceAlertButton key={variant.id} product={href} productName={phone.name} variant={variant.id} variantLabel={vLabel || undefined} price={variant.bestPrice} />
          <CompareToggle slug={href} block />
          <ShareButton title={phone.name} path={`${href}?v=${variant.id}`} text={shareMsg} />
        </div>

        <div className="mt-10 scroll-mt-24" id="history">
          <h2 className="mb-3 font-display text-xl font-bold">Price history{vLabel ? ` · ${vLabel}` : ""}</h2>
          <div className="card p-5">{chart[variant.id]}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Amazon and eBay ad rows, drawn like the store rows. Since 2026-11-06 (a US shopper's review: an eBay ad sat above
 * the store tagged "Cheapest" in a "cheapest first" list) they go UNDER the cheapest store, never above it: `part="rows"`
 * is placed after the first store row and `part="more"` (the marketplace searches) after the list. eBay before Amazon,
 * as on every sister site. None is ranked among the stores, counted as one or given the "Cheapest" badge.
 */
export function PinnedMarketplaces({ phone, variantId, variantQuery: mq, product, cheapest, compact = false, part = "all" }: { phone: Phone; variantId?: string; variantQuery: string; product: string; cheapest?: number; compact?: boolean; part?: "rows" | "more" | "all" }) {
  const { $, R, region } = useRegionKit();
  const markets = marketplacesFor(region);
  // The variant's own Amazon page when the ASIN finder matched it (scripts/amazon-asins.ts), else a tagged search. The quick
  // view (compact) carries the same tagged link (owner, 2026-11-06: a visitor-opened view of this one product is the
  // Associates policy's "pop-up windows in conjunction with your Site promoting Products closely associated with the
  // materials on your Site"), but never Amazon's price: that stays on the product page (24-hour licence).
  const found = variantId ? phone.amazon?.[variantId] : undefined;
  const live = compact ? undefined : found;
  const amazonHref = found?.url ?? amazonLink(region, mq, compact ? "quickview" : "product");
  const amazonName = amazonStore(region)?.name;
  const ebay = markets.find((m) => m.id === "ebay")!;
  const cid = `p-${phone.category}-${phone.slug}`;
  const phones = phone.category === "phones";
  const more = [
    ...(phone.ebay ? [{ kind: "marketplace-new", href: ebay.url(mq, cid, phones), title: `New on ${ebay.name}`, note: "Every new listing, not just the cheapest" }] : []),
    { kind: "marketplace-refurbished", href: ebaySearch(mq, { condition: "refurbished", customid: `${cid}-refurb`, phones, region }), title: "Refurbished on eBay", note: "Often far cheaper; check the warranty" },
    { kind: "marketplace-used", href: ebaySearch(mq, { condition: "used", customid: `${cid}-used`, phones, region }), title: "Used on eBay", note: `The cheapest way in, ${ebaySellers(region)}` },
  ];
  return (
    <div className={part === "rows" ? "space-y-2.5" : part === "more" ? "mt-2.5" : "mb-2.5 space-y-2.5"} aria-label="Amazon and eBay">
      {part === "more" ? null : phone.ebay ? (
        <EbayListingRow listing={phone.ebay} product={product} money={$} cheapest={cheapest} locale={R.locale} timeZone={R.timeZone} cart={compact ? undefined : { title: phone.name, image: phone.image ?? null, currency: R.currency }} />
      ) : (
        <EbaySearchRow href={ebaySearch(mq, { condition: "new", customid: `${cid}-pinned`, phones, region })} product={product} sellers={ebaySellers(region)} />
      )}
      {part !== "more" && amazonHref && <AmazonRow query={mq} product={product} placement={compact ? "quickview" : live ? "product-asin" : "product"} href={amazonHref} name={amazonName} live={live?.price && live.at ? { text: $(live.price), at: live.at, zone: { locale: REGIONS[region].locale, timeZone: REGIONS[region].timeZone, label: AMAZON_CLOCK[region] } } : undefined} cart={live?.price ? { title: phone.name, priceCents: Math.round(live.price * 100), currency: R.currency, image: phone.image ?? null } : undefined} />}
      {compact || part === "rows" ? null : (
      <div className="rounded-2xl border border-brand/50 bg-brand-soft p-3 sm:p-4">
        <div className="text-sm font-bold text-brand">Also check the marketplaces</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {more.map((m) => (
            <a key={m.kind} data-buy="ebay" data-buy-product={product} data-buy-kind={m.kind} href={m.href} target="_blank" rel={SPONSORED_REL} className="flex items-center justify-between gap-2 rounded-xl border border-brand/30 bg-bg-card px-3 py-2.5 text-sm transition hover:border-brand">
              <span className="min-w-0">
                <span className="font-semibold text-brand">{m.title}</span>
                <span className="block text-[11px] text-ink-soft">{m.note}</span>
              </span>
              <ExternalIcon className="h-4 w-4 shrink-0 text-brand" />
            </a>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink-soft">
          Amazon and eBay links are ads and affiliate links: we may earn a commission. They are never ranked above the cheapest store and never change the store order.{" "}
          <Link prefetch={false} href="/disclosure" className="underline">Learn more</Link>
        </p>
        {amazonHref && <AmazonNote className="mt-1" />}
        {live?.price && <p className="mt-1 text-[11px] text-ink-mute">* Amazon price: {AMAZON_PRICE_DISCLAIMER}</p>}
      </div>
      )}
    </div>
  );
}

/** Our verdict on a store's own "was" price, from what we've recorded there. */
/** One store's outright row (its cheapest listing of the variant), on the product page and in the quick view. */
export function OutrightRow({
  o,
  colours: cs,
  rank: i,
  best,
  product: href,
  was,
  rrp,
  kind,
  others,
  checkedAt,
  cart,
}: {
  o: Offer;
  colours: Set<string>;
  rank: number;
  best?: Offer;
  product: string;
  was?: WasCheck;
  /** The variant's RRP as the stores state it (lib/price-check.ts storeRrp). */
  rrp?: Rrp;
  /** Sale or everyday price, from this store's own history. */
  kind?: StorePrice;
  /** The other stores' prices, to flag one far above them when there is no RRP. */
  others?: number[];
  /** When this store's prices were last read, ISO time. */
  checkedAt?: string;
  /** The product, for the cart list's add button (in-stock rows only). */
  cart?: { title: string; detail?: string | null; image?: string | null };
}) {
  const { $, R } = useRegionKit();
  const link = storeLink(o.url, "row");
  // The cart list (components/cart, owner 2026-11-06): a Shopify listing with no programme checks out at the
  // store's cart; the rest keep this row's own (Awin-tracked) link.
  const add =
    cart && o.inStock
      ? { href: shopifyCartHref(o.url, o.inStock) ?? link.href, productUrl: o.url, storeName: RETAILERS[o.retailer].name, title: cart.title, detail: cart.detail ?? null, priceCents: Math.round(o.price * 100), currency: R.currency, image: o.image ?? cart.image ?? null }
      : null;
  return (
    <a
      href={link.href}
      target="_blank"
      rel={link.rel}
      data-buy={o.retailer}
      data-buy-product={href}
      data-buy-price={o.price}
      data-buy-rank={i + 1}
      data-buy-kind="outright"
      className={`card flex items-center gap-3 p-4 transition hover:border-brand/40 hover:shadow-lift sm:gap-4 ${i === 0 && o.inStock ? PIN_OUTLINE.cheapest : ""}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 font-semibold"><RetailerDot id={o.retailer} /> {RETAILERS[o.retailer].name}</span>
          {RETAILERS[o.retailer].type === "official" && <span className="rounded-full bg-bg-sunk px-2 py-0.5 text-[10px] font-semibold text-ink-soft">Official store</span>}
          {i === 0 && o.inStock && <span className="rounded-full bg-save px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Cheapest</span>}
          {aboveRrp(o.price, rrp) ? (
            <span className="rounded-full bg-hot/10 px-2 py-0.5 text-[10px] font-semibold text-hot" title={`The RRP ${rrp!.stores} stores list is ${$(rrp!.price)}`}>Above RRP</span>
          ) : !rrp && others && unusuallyHigh(o.price, others) ? (
            <span className="rounded-full bg-hot/10 px-2 py-0.5 text-[10px] font-semibold text-hot" title="Much dearer than the other stores: worth checking before you buy">Unusually high</span>
          ) : null}
          {kind?.kind === "sale" && <span className="rounded-full bg-save/10 px-2 py-0.5 text-[10px] font-semibold text-save" title={`Usually ${$(kind.usual)} at this store`}>Sale · usually {$(kind.usual)}</span>}
          {kind?.kind === "everyday" && <span className="rounded-full bg-bg-sunk px-2 py-0.5 text-[10px] font-semibold text-ink-soft" title="About what this store has charged for the past few weeks">Everyday price</span>}
          {kind?.kind === "up" && <span className="rounded-full bg-bg-sunk px-2 py-0.5 text-[10px] font-semibold text-ink-soft" title={`Usually ${$(kind.usual)} at this store`}>Up from {$(kind.usual)}</span>}
          {link.paid && <span className="text-[10px] text-ink-mute">Paid link</span>}
          {/* The thumbs stop the row's link (StoreVote calls preventDefault). */}
          <StoreVote url={o.url} name={RETAILERS[o.retailer].name} className="text-ink-mute" />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-mute">
          <span className={o.inStock ? "inline-flex items-center gap-1 text-save" : o.preorder ? "font-semibold text-brand" : "text-hot"}>
            {o.inStock ? <><CheckIcon className="h-3.5 w-3.5" /> In stock</> : o.preorder ? "Pre-order" : "Out of stock / pre-order"}
          </span>
          <span className="truncate">{[...cs].filter(Boolean).slice(0, 4).join(", ")}{cs.size > 4 ? ` +${cs.size - 4}` : ""}</span>
          {/* Phones: the add button as a line here, where the row has no width to spare. It stops the row's link. */}
          {checkedAt && <span suppressHydrationWarning title="When we last read this store's prices">Checked {checkedLabel(checkedAt, R.locale, R.timeZone)}</span>}
          {add && <CartAddButton inline {...add} className="text-xs sm:hidden" />}
        </div>
      </div>
      <div className="text-right">
        <div className="price text-xl sm:text-2xl">{$(o.price)}</div>
        {/* A store's "was" price is shown only once our own history can check it (US shopper review, 2026-11-06). */}
        {o.wasPrice && was && was.status !== "unknown" && <div className="text-xs text-ink-mute line-through">{$(o.wasPrice)}</div>}
        {o.wasPrice && was && was.status !== "unknown" && <WasNote w={was} />}
        {best && o !== best && o.price > best.price && <div className="text-[11px] text-hot">{$((o.price - best.price))} more than the cheapest</div>}
      </div>
      {add && <CartAddButton {...add} className="hidden shrink-0 text-ink-mute sm:inline-flex" />}
      <span className="hidden items-center gap-1 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white sm:inline-flex">
        Go to store <ExternalIcon className="h-3.5 w-3.5" />
      </span>
      <ExternalIcon className="h-4 w-4 text-ink-mute sm:hidden" />
    </a>
  );
}

/** "6 Nov, 9:54 pm" in the region's own clock. */
function checkedLabel(iso: string, locale: string, timeZone: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString(locale, { timeZone, day: "numeric", month: "short" })}, ${d.toLocaleTimeString(locale, { timeZone, hour: "numeric", minute: "2-digit" })}`;
}

/** The RRP the stores state, and how many of today's stores sell at or under it. */
function RrpLine({ rrp, rows }: { rrp: Rrp; rows: Offer[] }) {
  const { $ } = useRegionKit();
  const above = rows.filter((o) => aboveRrp(o.price, rrp)).length;
  return (
    <p className="mb-3 rounded-xl bg-bg-sunk px-3.5 py-2.5 text-xs text-ink-soft">
      <b className="text-ink">RRP {$(rrp.price)}</b>, the recommended price {rrp.stores} stores list.{" "}
      {rows.length - above} of {rows.length} {rows.length === 1 ? "store sells" : "stores sell"} at or under it
      {above > 0 ? <>; <span className="font-semibold text-hot">{above} {above === 1 ? "charges" : "charge"} more</span>.</> : "."}
    </p>
  );
}

/** The "was" prices our history can speak to: checked out, or never seen. "Too new to check" ones are left out. */
const checkedWas = (was: Partial<Record<RetailerId, WasCheck>> | undefined) => Object.values(was ?? {}).filter((w): w is WasCheck => !!w && w.status !== "unknown");

function WasNote({ w }: { w: WasCheck }) {
  const style = w.status === "backed" ? "text-save" : w.status === "never" ? "text-hot font-semibold" : "text-ink-mute";
  const label = w.status === "backed" ? "✓ Was price checks out" : "⚠ Was price not seen";
  return (
    <div className={`mt-0.5 max-w-[12rem] text-[10px] leading-tight ${style}`} title={w.text}>
      {label}
    </div>
  );
}

/** The variant most stores carry, cheapest among ties: what most buyers mean by "the" phone. */
export function defaultVariant(p: Phone) {
  return [...p.variants].sort(
    (a, b) => new Set(b.offers.map((o) => o.retailer)).size - new Set(a.offers.map((o) => o.retailer)).size || a.storageGb - b.storageGb,
  )[0];
}
