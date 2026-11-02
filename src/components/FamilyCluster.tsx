// "More tech deals from our sister sites" (DECISIONS.md "Sites that grow each other", 2026-11-02):
// CamCompare's best real camera prices today, read from the committed data/family/family-cluster.json
// (lib/family.ts). One block per page; nothing when there is nothing real to show.
import { familyTiles } from "@/lib/family";
import { blockHeading, familyMoney, tileNote } from "@/lib/family-network";
import type { RegionId } from "@/lib/region";

export function FamilyCluster({ region }: { region: RegionId }) {
  const tiles = familyTiles(region);
  if (!tiles.length) return null;
  const more = tiles.find((t) => t.more)?.more;
  return (
    <section className="mt-12" aria-labelledby="family-tech">
      <div className="eyebrow">From our sister site</div>
      <h2 id="family-tech" className="mt-1 font-display text-2xl font-extrabold tracking-tight">{blockHeading("tech", "deal")}</h2>
      <p className="mt-1 text-sm text-ink-mute">Today&apos;s best camera prices on CamCompare, from its own daily price check.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {tiles.map(({ site, item }) => (
          <li key={item.url} className="card flex gap-3 p-4">
            {item.image ? <img src={item.image} alt="" className="h-16 w-16 shrink-0 object-contain" loading="lazy" /> : null}
            <div className="min-w-0 text-sm">
              <div className="text-xs text-ink-mute">{site.name}</div>
              <a href={item.url} rel="noopener" className="line-clamp-2 font-semibold hover:underline">{item.title}</a>
              <div><b>{familyMoney(item.cents, item.currency)}</b> <span className="text-ink-mute">at {item.store}</span></div>
              <div className="text-xs text-ink-mute">{tileNote(item)}</div>
            </div>
          </li>
        ))}
      </ul>
      {more ? <p className="mt-3 text-sm"><a href={more} rel="noopener" className="font-semibold hover:underline">More camera deals on CamCompare →</a></p> : null}
    </section>
  );
}
