// node social/reels/pick.mjs <outdir> [siteId] [YYYY-MM-DD]
// Picks the day's site (rotation by date), reads its public family feed from GitHub and writes spec.json with the top
// three deals: the same store deals the site shows, never eBay, never a converted price. Downloads each product photo.
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
const RAW = 'https://raw.githubusercontent.com/Specifxx';
export const SITES = [
  { id: 'dex', name: 'DexCompare', topic: 'Pokémon', host: 'dexcompare.app', accent: '#ffcb05', feed: `${RAW}/CompareEmpire/main/apps/dexcompare-sealed/data/public/family/family-feed.json`, tags: '#pokemontcg #pokemoncards #pokemon #tcgdeals' },
  { id: 'rift', name: 'RiftCompare', topic: 'Riftbound', host: 'riftcompare.com', accent: '#e0a23a', feed: `${RAW}/TCGEmpire/main/data/public/family/family-feed.json`, tags: '#riftbound #riftboundtcg #leagueoflegends #tcgdeals', fine: 'RiftCompare is fan-made and isn\'t endorsed by Riot Games.' },
  { id: 'mtg', name: 'MTG Compare', topic: 'Magic', host: 'mtgcompare.app', accent: '#e8743b', feed: `${RAW}/mtgcompare/main/data/public/family/family-feed.json`, tags: '#mtg #magicthegathering #mtgsealed #tcgdeals' },
  { id: 'empire', name: 'Compare Empire', topic: 'Tech', host: 'compareempire.com', accent: '#8b74ff', feed: `${RAW}/compareempiretake2/claude/admiring-newton-5xtu2p/data/family/family-feed.json`, tags: '#techdeals #blackfriday #deals #tech', hook: 'Same TV.' },
  { id: 'op', name: 'OP Compare', topic: 'One Piece', host: 'opcompare.app', accent: '#e0454a', feed: `${RAW}/OpCompare/snapshot/family-feed.json`, tags: '#onepiecetcg #onepiececardgame #onepiece #tcgdeals' },
  { id: 'lorcana', name: 'Lorcana Compare', topic: 'Disney Lorcana', host: 'lorcanacompare.com', accent: '#7aa7ff', feed: `${RAW}/lorcanacompare/main/data/public/family/family-feed.json`, tags: '#disneylorcana #lorcana #tcgdeals' },
  { id: 'wargame', name: 'WargameCompare', topic: 'Wargames', host: 'wargamecompare.com', accent: '#d65c5c', feed: `${RAW}/wargamecompare/main/data/family/family-feed.json`, tags: '#miniatures #tabletopgaming #wargaming #hobbydeals', hook: 'Same kit.' },
  { id: 'ygo', name: 'YGO Compare', topic: 'Yu-Gi-Oh!', host: 'ygocompare.com', accent: '#a978ff', feed: `${RAW}/ygocompare/main/data/public/family/family-feed.json`, tags: '#yugioh #yugiohtcg #tcgdeals' },
  { id: 'figure', name: 'FigureCompare', topic: 'Anime figures', host: 'figurecompare.com', accent: '#ff4f86', feed: `${RAW}/figurecompare/main/data/family/family-feed.json`, tags: '#animefigures #nendoroid #figma #figurecollection', hook: 'Same figure.' },
  { id: 'gundam', name: 'Gundam Compare', topic: 'Gundam', host: 'gundamcompare.com', accent: '#4f8cff', feed: `${RAW}/GundamCompare/main/data/public/family/family-feed.json`, tags: '#gundam #gunpla #gundamcardgame #tcgdeals' },
  { id: 'cam', name: 'CamCompare', topic: 'Cameras', host: 'camcompare.app', accent: '#2fbf8f', feed: `${RAW}/Camcompare/main/data/family/family-feed.json`, tags: '#camera #photography #cameragear #techdeals', hook: 'Same camera.' },
  { id: 'cyberpunk', name: 'Cyberpunk Compare', topic: 'Cyberpunk TCG', host: 'cyberpunkcompare.com', accent: '#f2e600', feed: `${RAW}/cyberpunkcompare/main/data/public/family/family-feed.json`, tags: '#cyberpunktcg #tcg #tcgdeals' },
  { id: 'bandai', name: 'BandaiCompare', topic: 'Union Arena, Digimon, Fusion World', host: 'bandaicompare.com', accent: '#ff8a3a', feed: `${RAW}/bandaicompare/main/data/public/family/family-feed.json`, tags: '#unionarena #digimontcg #dragonballsuper #tcgdeals' },
];
const SYM = { USD: '$', AUD: 'A$', GBP: '£', CAD: 'C$', EUR: '€', SGD: 'S$', NZD: 'NZ$' };
const REGION_NAME = { US: 'US', AU: 'Australian', UK: 'UK', CA: 'Canadian', EU: 'EU', NZ: 'NZ', SG: 'Singapore' };
const money = (c, cur) => (SYM[cur] || '') + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function pickDeals(feed) {
  // Plausible deals only: 15-60% under the reference (more is usually a mismatched listing), with a photo.
  const ok = feed.items.filter((i) => i.kind === 'deal' && i.image && i.refCents > i.cents && i.savingPct >= 15 && i.savingPct <= 60);
  const by = {};
  for (const i of ok) (by[i.region] ||= []).push(i);
  const region = ['US', 'UK', 'AU', 'CA', 'EU'].find((r) => (by[r] || []).length >= 3) || Object.keys(by).sort((a, b) => by[b].length - by[a].length)[0];
  if (!region) return null;
  const seen = new Set();
  const deals = by[region].sort((a, b) => b.savingPct - a.savingPct).filter((i) => !seen.has(i.title) && seen.add(i.title)).slice(0, 3);
  return deals.length >= 2 ? { region, deals } : null;
}

async function main() {
  const [out, want, dayArg] = process.argv.slice(2);
  const day = dayArg || new Date().toISOString().slice(0, 10);
  const n = Math.floor(Date.parse(day) / 86400000);
  mkdirSync(path.join(out, 'img'), { recursive: true });
  const order = want ? [SITES.find((s) => s.id === want)] : SITES.map((_, k) => SITES[(n + k) % SITES.length]);
  for (const site of order) {
    const feed = await fetch(site.feed).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const got = feed && pickDeals(feed);
    if (!got) { console.error(`skip ${site.id}: no usable deals`); continue; }
    const deals = [];
    for (const [k, d] of got.deals.entries()) {
      const img = await fetch(d.image.replace(/_200w\.jpg$/, '_in_1000x1000.jpg')).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null);
      if (!img) continue;
      writeFileSync(path.join(out, 'img', `${k}.jpg`), Buffer.from(img));
      const ref = d.refLabel || 'median store price';
      deals.push({ siteName: site.name, topic: site.topic, accent: site.accent, title: d.title, cents: d.cents, refCents: d.refCents, currency: d.currency, refLabel: ref[0].toUpperCase() + ref.slice(1), refShort: ref, store: d.store, savingPct: d.savingPct, imgFile: `img/${k}.jpg`, url: site.host, link: d.url });
    }
    if (deals.length < 2) { console.error(`skip ${site.id}: photos missing`); continue; }
    const date = new Date(day + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    const rn = REGION_NAME[got.region] || got.region;
    const spec = {
      site: site.id, day, region: got.region,
      hook: [site.hook || 'Same box.', Math.min(...deals.map((d) => d.savingPct)) >= 45 ? 'Half the price.' : `Up to ${Math.max(...deals.map((d) => d.savingPct))}% less.`],
      sub: `${deals.length} real ${site.topic} deals from today's ${rn} store prices`,
      deals,
      endLine: `${site.name} compares ${site.topic} prices across stores every day.`,
      sites: ['Pokémon', 'Magic', 'Lorcana', 'Riftbound', 'One Piece', 'Yu-Gi-Oh!', 'Gundam', 'Wargames', 'Anime figures', 'Cameras', 'Tech'],
      fine: `${rn} store prices, ${date}, before shipping. Prices change. ${site.fine || 'Independent; not affiliated with any brand shown.'}`,
    };
    writeFileSync(path.join(out, 'spec.json'), JSON.stringify(spec, null, 1));
    const lines = deals.map((d, k) => `${k + 1}. ${d.title}: ${money(d.cents, d.currency)} at ${d.store} (${d.refShort} ${money(d.refCents, d.currency)})`);
    writeFileSync(path.join(out, 'caption.txt'), `${spec.hook.join(' ')} 👀 ${spec.sub}:\n\n${lines.join('\n')}\n\nEvery store compared on ${site.host}, link in bio. Checked ${date}, before shipping; prices move fast.\n\n${site.tags} #compareempire`);
    console.log(`picked ${site.id} ${got.region}: ${deals.length} deals`);
    return;
  }
  throw new Error('no site had usable deals');
}
if (import.meta.url === `file://${process.argv[1]}`) await main();
