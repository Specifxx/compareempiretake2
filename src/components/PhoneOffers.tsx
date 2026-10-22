"use client";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { MARKETPLACES } from "@/lib/marketplaces";
import { RETAILERS } from "@/lib/retailers";
import type { Offer, Phone, RetailerId } from "@/lib/types";
import { CheckIcon, ExternalIcon, ShareIcon } from "./icons";
import { RetailerDot } from "./RetailerChip";
import { SaveButton } from "./SaveButton";
import { CompareToggle } from "./CompareToggle";
import { PriceCheckCard } from "./PriceCheckCard";
import type { PriceCheck, WasCheck } from "@/lib/price-check";

/** Gallery + storage picker + the retailer price table for one phone. */
export function PhoneOffers({
  phone,
  chart,
  checks,
}: {
  phone: Phone;
  chart: Record<string, React.ReactNode>;
  checks: Record<string, { check: PriceCheck; was: Partial<Record<RetailerId, WasCheck>> }>;
}) {
  const params = useSearchParams();
  const initial = phone.variants.find((v) => v.id === params.get("v")) ?? defaultVariant(phone);
  const [vid, setVid] = useState(initial.id);
  const [colour, setColour] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const variant = phone.variants.find((v) => v.id === vid) ?? initial;
  const href = `/${phone.category}/${phone.slug}`;
  const vLabel = phone.variants.length > 1 || variant.storageGb ? variant.label : "";

  const colours = useMemo(() => [...new Set(variant.offers.map((o) => o.colour).filter(Boolean))].sort(), [variant]);
  const shown = colour && colours.includes(colour) ? variant.offers.filter((o) => o.colour === colour) : variant.offers;

  // One row per retailer: its cheapest listing, with the colours it has at that price.
  const group = (list: Offer[]) => {
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
  };
  const rows = useMemo(() => group(shown.filter((o) => o.kind !== "plan")), [shown]);
  const planRows = useMemo(() => group(shown.filter((o) => o.kind === "plan")), [shown]);
  const [tabPick, setTab] = useState<"outright" | "plan" | null>(null);
  const tab = tabPick ?? (rows.length ? "outright" : "plan");

  const [img, setImg] = useState(0);
  const images = useMemo(() => {
    const fromColour = colour ? shown.map((o) => o.image).filter(Boolean) as string[] : [];
    return [...new Set([...fromColour, ...phone.images])].slice(0, 6);
  }, [colour, shown, phone.images]);
  const best = rows[0]?.best;
  const top = rows.length > 1 ? Math.max(...rows.map((r) => r.best.price)) : undefined;

  const share = async () => {
    const url = `${location.origin}${href}?v=${variant.id}`;
    const text = `${phone.name}${vLabel ? ` ${vLabel}` : ""} from $${variant.bestPrice} — compared across ${phone.retailerCount} Aussie stores`;
    try {
      if (navigator.share) await navigator.share({ title: phone.name, text, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="img-tile relative aspect-square overflow-hidden rounded-3xl border border-line">
          {images[img] && <img src={images[img]} alt={phone.name} className="product-img absolute inset-0 h-full w-full object-contain p-10" />}
          <SaveButton slug={href} className="absolute right-4 top-4" />
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
            {images.map((src, i) => (
              <button key={src} onClick={() => setImg(i)} className={`img-tile h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${i === img ? "border-brand" : "border-transparent"}`}>
                <img src={src} alt="" className="product-img h-full w-full object-contain p-1.5" loading="lazy" />
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
            <div className="price text-4xl">${variant.bestPrice.toLocaleString("en-AU")}</div>
            {top && top > variant.bestPrice && (
              <div className="mt-1 text-xs font-semibold text-save">Save ${(top - variant.bestPrice).toLocaleString("en-AU")} vs dearest store</div>
            )}
          </div>
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
                <div className="text-xs text-ink-mute">from ${v.bestPrice.toLocaleString("en-AU")}</div>
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
          <ol className="space-y-2.5">
            {rows.map(({ best: o, colours: cs }, i) => (
              <li key={o.retailer}>
                <a
                  href={o.url}
                  target="_blank"
                  rel="noopener nofollow"
                  className={`card flex items-center gap-3 p-4 transition hover:border-brand/40 hover:shadow-lift sm:gap-4 ${i === 0 && o.inStock ? "ring-2 ring-save/60" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 font-semibold"><RetailerDot id={o.retailer} /> {RETAILERS[o.retailer].name}</span>
                      {RETAILERS[o.retailer].type === "official" && <span className="rounded-full bg-bg-sunk px-2 py-0.5 text-[10px] font-semibold text-ink-soft">Official store</span>}
                      {i === 0 && o.inStock && <span className="rounded-full bg-save px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Cheapest</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-mute">
                      <span className={o.inStock ? "inline-flex items-center gap-1 text-save" : "text-hot"}>
                        {o.inStock ? <><CheckIcon className="h-3.5 w-3.5" /> In stock</> : "Out of stock / pre-order"}
                      </span>
                      <span className="truncate">{[...cs].filter(Boolean).slice(0, 4).join(", ")}{cs.size > 4 ? ` +${cs.size - 4}` : ""}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="price text-xl sm:text-2xl">${o.price.toLocaleString("en-AU")}</div>
                    {o.wasPrice && <div className="text-xs text-ink-mute line-through">${o.wasPrice.toLocaleString("en-AU")}</div>}
                    {o.wasPrice && checks[variant.id]?.was[o.retailer] && (
                      <WasNote w={checks[variant.id].was[o.retailer]!} />
                    )}
                    {best && o !== best && o.price > best.price && <div className="text-[11px] text-hot">+${(o.price - best.price).toLocaleString("en-AU")}</div>}
                  </div>
                  <span className="hidden items-center gap-1 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white sm:inline-flex">
                    Go to store <ExternalIcon className="h-3.5 w-3.5" />
                  </span>
                  <ExternalIcon className="h-4 w-4 text-ink-mute sm:hidden" />
                </a>
              </li>
            ))}
          </ol>
          {Object.values(checks[variant.id]?.was ?? {}).length > 0 && (
            <div className="mt-4 rounded-2xl bg-bg-sunk p-4">
              <div className="text-sm font-semibold">Are these &ldquo;was&rdquo; prices real?</div>
              <ul className="mt-2 space-y-1.5 text-xs text-ink-soft">
                {Object.values(checks[variant.id].was).map((w) => (
                  <li key={w!.retailer} className="flex gap-2">
                    <span className={w!.status === "backed" ? "text-save" : w!.status === "never" ? "text-hot" : "text-ink-mute"}>{w!.status === "backed" ? "✓" : w!.status === "never" ? "⚠" : "•"}</span>
                    <span><b className="text-ink">{RETAILERS[w!.retailer].name} says was ${w!.was.toLocaleString("en-AU")}.</b> {w!.text}</span>
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
                <a href={o.url} target="_blank" rel="noopener nofollow" className="card flex items-center gap-3 p-4 transition hover:border-brand/40 hover:shadow-lift sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex items-center gap-2 font-semibold"><RetailerDot id={o.retailer} /> {RETAILERS[o.retailer].name}</span>
                    <div className="mt-1 text-xs text-ink-mute">
                      Phone repayments over {o.months ?? 36} months · ${o.price.toLocaleString("en-AU")} total for the phone
                      {best && o.price > best.price && <span className="text-hot"> (+${Math.round(o.price - best.price).toLocaleString("en-AU")} vs cheapest outright)</span>}
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
          <p className="mt-3 text-xs text-ink-mute">
            Repayments are for the phone only; you also pay for a mobile plan from that carrier. Leaving early usually means paying off the rest of the phone.
            {rows.length > 0 && best && <> Buying outright from {RETAILERS[best.retailer].name} at ${best.price.toLocaleString("en-AU")} and adding any SIM-only plan is often cheaper.</>}
          </p>
          </>
          )}
          <div className="mt-4 rounded-2xl border border-dashed border-line p-4">
            <div className="text-sm font-semibold">Also check the marketplaces</div>
            <p className="mt-0.5 text-xs text-ink-mute">Sometimes cheaper, but listings mix sellers and warranties, so we link to a search rather than rank them.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {MARKETPLACES.map((m) => (
                <a key={m.id} href={m.url(`${phone.name}${variant.storageGb ? ` ${variant.label.split(" ·")[0]}` : ""}`)} target="_blank" rel="noopener nofollow sponsored" className="flex items-center justify-between rounded-xl bg-bg-sunk px-3 py-2.5 text-sm transition hover:bg-brand-soft">
                  <span>
                    <span className="font-semibold">Search {m.name}</span>
                    <span className="block text-[11px] text-ink-mute">{m.note}</span>
                  </span>
                  <ExternalIcon className="h-4 w-4 text-ink-mute" />
                </a>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-mute">
            Prices include GST and are checked daily. Delivery and in-store availability vary — confirm on the retailer&apos;s site.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <CompareToggle slug={href} block />
          <button onClick={share} className="btn-ghost"><ShareIcon /> {copied ? "Link copied" : "Share"}</button>
        </div>

        <div className="mt-10 scroll-mt-24" id="history">
          <h2 className="mb-3 font-display text-xl font-bold">Price history{vLabel ? ` · ${vLabel}` : ""}</h2>
          <div className="card p-5">{chart[variant.id]}</div>
        </div>
      </div>
    </div>
  );
}

/** Our verdict on a store's own "was" price, from what we've recorded there. */
function WasNote({ w }: { w: WasCheck }) {
  const style = w.status === "backed" ? "text-save" : w.status === "never" ? "text-hot font-semibold" : "text-ink-mute";
  const label = w.status === "backed" ? "✓ Was price checks out" : w.status === "never" ? "⚠ Was price not seen" : "Was price: too new to check";
  return (
    <div className={`mt-0.5 max-w-[12rem] text-[10px] leading-tight ${style}`} title={w.text}>
      {label}
    </div>
  );
}

/** The variant most stores carry, cheapest among ties: what most buyers mean by "the" phone. */
function defaultVariant(p: Phone) {
  return [...p.variants].sort(
    (a, b) => new Set(b.offers.map((o) => o.retailer)).size - new Set(a.offers.map((o) => o.retailer)).size || a.storageGb - b.storageGb,
  )[0];
}
