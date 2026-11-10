// "Offers from our partner stores": low on a page, after the real content, never above a price or beside a buy button.
// Every card is an Awin-tracked link (rel sponsored) and says so; nothing is drawn when no partner has a live offer.
import { ExternalIcon } from "@/components/icons";
import { SPONSORED_REL } from "@/lib/ebay";
import { partnerOffers } from "@/lib/partner-offers";
import { REGIONS, type RegionId } from "@/lib/region";

export function PartnerOffers({ region, placement }: { region: RegionId; placement: string }) {
  const stores = partnerOffers(region, placement);
  if (!stores.length) return null;
  const R = REGIONS[region];
  return (
    <section className="mt-12" aria-labelledby="partner-offers">
      <div className="eyebrow">Partner stores · Ad</div>
      <h2 id="partner-offers" className="mt-1 font-display text-2xl font-bold tracking-tight">Offers from {R.adjective} partner stores</h2>
      <p className="mt-1 text-sm text-ink-mute">Live sales and codes the stores publish themselves. These are paid links: we may earn a commission, and they never change a price or our order.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((s) => (
          <li key={s.advertiserId} className="card flex flex-col p-4">
            <div className="font-semibold">{s.name}</div>
            <ul className="mt-2 flex-1 space-y-2 text-sm">
              {s.offers.map((o) => (
                <li key={o.id}>
                  <span className="font-medium">{o.title}</span>
                  {o.description ? <span className="block text-xs text-ink-mute">{o.description}</span> : null}
                  {o.code ? <span className="mt-1 inline-block rounded-md bg-bg-sunk px-2 py-0.5 font-mono text-xs">Code {o.code}</span> : null}
                  <span className="block text-[11px] text-ink-mute">Ends {new Date(o.end).toLocaleDateString(R.locale, { day: "numeric", month: "short", timeZone: "UTC" })}</span>
                </li>
              ))}
            </ul>
            <a href={s.href} target="_blank" rel={SPONSORED_REL} data-buy={`awin-${s.advertiserId}`} data-buy-kind={`partner_offers_${placement}`} className="mt-3 inline-flex items-center justify-center gap-1 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-brand-ink">
              Shop at {s.name} <ExternalIcon className="h-3.5 w-3.5" />
            </a>
            <span className="mt-1 text-center text-[10px] text-ink-mute">Paid link</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
