"use client";
// The quick view (owner, 2026-10-30: "I really like the kaeyoung quick view pop ups", ported from K Young). A plain
// click on a product card (a[data-qv]) opens this panel at once with what the card already knows (photo, brand,
// model), then fills in the product from /api/products (CDN-cached for a day, the same answer the compare table
// reads) and draws the product page's own rows: eBay first, Amazon second, then every store's outright price,
// cheapest in stock first. The card stays a real link: crawlers, new tabs and modified clicks go to the product page,
// whose server HTML keeps every price. The card's own buttons (save, compare) keep working.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Phone } from "@/lib/types";
import { useRegionKit } from "@/lib/use-region";
import { defaultVariant, groupByRetailer, OutrightRow, PinnedMarketplaces } from "./PhoneOffers";

interface Head {
  href: string;
  name: string;
  brand: string;
  img: string | null;
}

const cache = new Map<string, Promise<Phone | null>>();
function load(href: string): Promise<Phone | null> {
  let p = cache.get(href);
  if (!p) {
    p = fetch(`/api/products?p=${encodeURIComponent(href)}`)
      .then((r) => (r.ok ? (r.json() as Promise<{ products: Phone[] }>) : null))
      .then((d) => d?.products[0] ?? null)
      .catch(() => null);
    p.then((d) => d || cache.delete(href));
    cache.set(href, p);
  }
  return p;
}
/** The card under a click or pointer, unless the target is one of its own buttons (save, compare). */
function cardOf(e: Event): HTMLAnchorElement | null {
  const t = e.target as Element | null;
  if (!t?.closest || t.closest("button")) return null;
  return t.closest("a[data-qv]") as HTMLAnchorElement | null;
}

export function QuickView() {
  const [head, setHead] = useState<Head | null>(null);
  const [phone, setPhone] = useState<Phone | null | "loading">(null);
  const [vid, setVid] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setHead(null), []);

  useEffect(() => {
    // Capture phase on the document: runs before Next's Link, which then sees the click already handled.
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = cardOf(e);
      if (!a) return;
      e.preventDefault();
      const href = a.dataset.qv!;
      setHead({ href, name: a.dataset.qvName || "", brand: a.dataset.qvBrand || "", img: a.dataset.qvImg || null });
      setVid(null);
      setPhone("loading");
      load(href).then((d) => setPhone((cur) => (cur === "loading" ? d : cur)));
    }
    // Warm the answer when a mouse rests on a card, so most opens are instant.
    function onOver(e: PointerEvent) {
      const a = cardOf(e);
      if (a && e.pointerType === "mouse") load(a.dataset.qv!);
    }
    document.addEventListener("click", onClick, true);
    document.addEventListener("pointerover", onOver, { passive: true });
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerover", onOver);
    };
  }, []);

  useEffect(() => {
    if (!head) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [head, close]);

  if (!head) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={head.name}>
      <button type="button" aria-label="Close" tabIndex={-1} className="qv-backdrop absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={close} />
      <div className="qv-panel relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-line bg-bg-card shadow-2xl sm:rounded-3xl">
        <div className="flex items-start gap-4 border-b border-line p-4 sm:p-5">
          <div className="img-tile relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
            {head.img ? <img src={head.img} alt="" className="product-img absolute inset-0 h-full w-full object-contain p-2" /> : <div className="grid h-full place-items-center text-xs text-ink-mute">No image</div>}
          </div>
          <div className="min-w-0 flex-1">
            {head.brand && <div className="text-sm font-semibold text-brand">{head.brand}</div>}
            <h2 className="mt-0.5 font-display text-lg font-bold leading-snug">{head.name}</h2>
          </div>
          <button ref={closeRef} type="button" onClick={close} aria-label="Close" className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-mute hover:bg-bg-sunk hover:text-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {phone === "loading" ? (
            <Skeleton />
          ) : phone ? (
            <Prices phone={phone} href={head.href} vid={vid} setVid={setVid} />
          ) : (
            <p className="rounded-2xl border border-line p-4 text-sm text-ink-mute">Prices did not load. The full page has every store&apos;s price.</p>
          )}
        </div>
        <div className="border-t border-line p-4 sm:px-5">
          <Link href={phone && phone !== "loading" && vid ? `${head.href}?v=${vid}` : head.href} prefetch={false} onClick={close} className="btn-primary flex w-full justify-center text-[15px]">
            See price history and details <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Prices({ phone, href, vid, setVid }: { phone: Phone; href: string; vid: string | null; setVid: (v: string) => void }) {
  const { $ } = useRegionKit();
  const variant = phone.variants.find((v) => v.id === vid) ?? defaultVariant(phone);
  const rows = groupByRetailer(variant.offers.filter((o) => o.kind !== "plan"));
  const plans = new Set(variant.offers.filter((o) => o.kind === "plan").map((o) => o.retailer)).size;
  const mq = `${phone.name}${variant.storageGb ? ` ${variant.label.split(" ·")[0]}` : ""}`;
  const best = rows[0]?.best;
  return (
    <>
      {phone.variants.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {phone.variants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVid(v.id)}
              className={`rounded-xl border px-3 py-1.5 text-left transition ${v.id === variant.id ? "border-brand bg-brand-soft" : "border-line bg-bg-card hover:border-ink/25"}`}
            >
              <div className={`text-sm font-semibold ${v.id === variant.id ? "text-brand" : ""}`}>{v.label}</div>
              <div className="text-xs text-ink-mute">from {$(v.bestPrice)}</div>
            </button>
          ))}
        </div>
      )}
      <h3 className="mb-3 text-sm font-semibold">Every store&apos;s price</h3>
      <PinnedMarketplaces phone={phone} variantQuery={mq} product={href} cheapest={best?.price} compact />
      {rows.length ? (
        <ol className="space-y-2.5">
          {rows.map(({ best: o, colours }, i) => (
            <li key={o.retailer}>
              <OutrightRow o={o} colours={colours} rank={i} best={best} product={href} />
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-2xl border border-line p-4 text-sm text-ink-mute">No store sells this outright today.</p>
      )}
      {plans > 0 && (
        <p className="mt-3 text-xs text-ink-mute">
          Also on a plan at {plans} {plans === 1 ? "carrier" : "carriers"}: the full page compares the repayments.
        </p>
      )}
    </>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2.5" aria-label="Loading prices" aria-busy="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-line p-4">
          <div className="flex-1 space-y-1.5">
            <div className="qv-shimmer h-3.5 w-1/3 rounded" />
            <div className="qv-shimmer h-2.5 w-1/4 rounded" />
          </div>
          <div className="qv-shimmer h-8 w-20 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
