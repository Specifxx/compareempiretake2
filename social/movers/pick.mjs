// node social/movers/pick.mjs <outdir> <siteId> [--offline]
// The week's price movers for one site (dex, rift, op, mtg), read from that site's own public data on GitHub, on the same basis
// the site shows: never eBay, never a guess. Writes <outdir>/spec.json (for stage.html), caption.txt and the product photos.
// Exits 3 (and writes nothing) when the site has too few clean moves this week: a thin video is worse than none.
//
// THE NUMBERS
// - dex, mtg (sealed): the cheapest in-stock US store price today against the same product's a week back, from
//   data/public/price-history.json (change-points; lib/price-history.ts in each repo). DexCompare's /price-moves rules: at least
//   10% and US$5 either way, never under half or over double. Stricter here: 3+ US stores both days, headline product types only.
// - rift: the cheapest in-stock listing across RiftCompare's stores each Sydney day, in US$ (data/price-history/cards, the /movers
//   basis), latest day against the last day at least 7 days back, no promos (TCGEmpire social/lib/data.mjs). Stricter here:
//   US$5+ today and US$3+ a week back, at least 10%.
// - op: TCGplayer's market price and its 7-day change (the snapshot's prices.json.gz, what OP Compare's /movers shows), cards
//   worth US$5+ (and US$3+ a week back), no promos or DON!! cards.
// - every site: never a move over double or under half. A thin market's one listing makes those far more often than a real price
//   does, and a video gets screenshotted; the sites' pages keep their own wider bounds.
// Wording (DexCompare lib/copy-rules.ts): "cheaper" / "up", a dated "a week ago → today", never "dropped", "trending",
// "investment" or a prediction.
import { mkdirSync, writeFileSync } from 'fs';
import { gunzipSync } from 'zlib';
import path from 'path';

const RAW = 'https://raw.githubusercontent.com/Specifxx';
export const SITES = {
  dex: {
    name: 'DexCompare', topic: 'Pokémon TCG', host: 'dexcompare.app', accent: '#ffcb05', kind: 'sealed', page: 'dexcompare.app/us/price-moves',
    base: `${RAW}/CompareEmpire/main/apps/dexcompare-sealed/data/public`, url: (s) => `https://dexcompare.app/us/p/${s}`,
    types: /^(Booster Box|Elite Trainer Box|Pokémon Center Elite Trainer Box|Booster Bundle|Ultra-Premium Collection|Collection|Japanese Booster Box)$/,
    tags: '#pokemontcg #pokemoncards #pokemon #pokemonsealed', fine: 'Not affiliated with Nintendo, The Pokémon Company or Creatures.',
  },
  mtg: {
    name: 'MTG Compare', topic: 'Magic: The Gathering', host: 'mtgcompare.app', accent: '#e8743b', kind: 'sealed', page: 'mtgcompare.app/us',
    base: `${RAW}/mtgcompare/main/data/public`, url: (s) => `https://mtgcompare.app/us/p/${s}`,
    types: /^(Play Booster Box|Collector Booster Box|Set Booster Box|Draft Booster Box|Bundle|Gift Bundle|Commander Deck|Starter Kit|Scene Box)$/,
    tags: '#mtg #magicthegathering #mtgsealed #mtgcommunity', fine: 'Unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards.',
  },
  rift: {
    name: 'RiftCompare', topic: 'Riftbound', host: 'riftcompare.com', accent: '#e0a23a', kind: 'cards', page: 'riftcompare.com/movers',
    base: `${RAW}/TCGEmpire/main/data`, url: (s) => `https://riftcompare.com/card/${s}`,
    tags: '#riftbound #riftboundtcg #leagueoflegends #tcg', fine: "RiftCompare is fan-made and isn't endorsed by Riot Games.",
  },
  op: {
    name: 'OP Compare', topic: 'One Piece Card Game', host: 'opcompare.app', accent: '#e0454a', kind: 'cards', page: 'opcompare.app/movers',
    base: `${RAW}/OpCompare/snapshot`, url: (s) => `https://opcompare.app/card/${s}`,
    tags: '#onepiecetcg #onepiececardgame #onepiece #tcg', fine: 'Not affiliated with Bandai or Toei Animation.',
  },
};
export const PER_SIDE = 3;

const DAY = 86_400_000;
const isoOfDay = (d) => new Date(d * DAY).toISOString().slice(0, 10);
const dayOf = (iso) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / DAY);
export const prettyDay = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
export const usd = (c) => 'US$' + (c >= 10000 ? Math.round(c / 100).toLocaleString('en-US') : (c / 100).toFixed(2));

async function get(url, kind = 'json') {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  if (kind === 'json') return r.json();
  const b = Buffer.from(await r.arrayBuffer());
  return kind === 'gz' ? JSON.parse(gunzipSync(b).toString('utf8')) : b;
}

/** Split, rank and trim: the biggest moves each way, one per name (a product's two listings, a card's two printings). */
export function rankMoves(moves, n = PER_SIDE * 2) {
  const pick = (dir) => {
    const seen = new Set();
    return moves.filter((m) => (dir > 0 ? m.pct > 0 : m.pct < 0)).sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct) || b.after - a.after)
      .filter((m) => !seen.has(m.name) && seen.add(m.name)).slice(0, n);
  };
  return { up: pick(1), down: pick(-1) };
}

// ─── sealed: Dex and MTG (price-history.json change-points) ──────────────────────────────────────────────
/** The point that held on `day` (the last at or before it), or null. */
export function valueOn(points, day) {
  let v = null;
  for (const p of points) { if (p[0] <= day) v = p; else break; }
  return v;
}

export function sealedMoves(history, products, site, market = 'US') {
  const T = history.through;
  if (T - history.since < 7) return { from: null, to: null, moves: [] };
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const moves = [];
  for (const [slug, pts] of Object.entries(history.series[market] || {})) {
    const p = bySlug.get(slug);
    if (!p || !p.imageUrl || !site.types.test(p.productType || '')) continue;
    const a = valueOn(pts, T - 7), b = valueOn(pts, T);
    if (!a || !b || a[1] == null || b[1] == null || a[2] < 3 || b[2] < 3) continue;
    const diff = b[1] - a[1], ratio = b[1] / a[1];
    if (ratio > 2 || ratio < 0.5) continue;
    const pct = Math.round((diff / a[1]) * 100);
    if (Math.abs(pct) < 10 || Math.abs(diff) < 500) continue;
    moves.push({ name: p.name, sub: p.productType, before: a[1], after: b[1], pct, stores: b[2], image: p.imageUrl, link: site.url(slug) });
  }
  return { from: isoOfDay(T - 7), to: isoOfDay(T), basis: 'Cheapest in-stock US store price', moves };
}

// ─── Rift (daily price files) ─────────────────────────────────────────────────────────────────────────────
export function riftLabel(c) {
  const tags = [];
  if (c.isOvernumbered) tags.push('Overnumbered');
  if (c.variant && /^[a-z]$/i.test(c.variant) && c.type !== 'Rune') tags.push('Alt art');
  if (/\*/.test(c.collectorNumber ?? '')) tags.push('Signature');
  return { name: [c.name, ...tags].join(' · '), sub: `${c.setName} · ${c.collectorNumber}` };
}

export function riftMoves(now, then, cards, site) {
  const byId = new Map(cards.map((c) => [c.id, c]));
  const moves = [];
  for (const [id, after] of Object.entries(now.prices)) {
    const before = then.prices[id];
    const c = byId.get(id);
    if (!before || !c || c.isPromo || !(c.imageThumbUrl || c.imageUrl) || after < 500 || before < 300) continue;
    const pct = Math.round(((after - before) / before) * 100);
    if (pct > 100 || pct < -50 || Math.abs(pct) < 10) continue;
    const l = riftLabel(c);
    moves.push({ name: l.name, sub: l.sub, before, after, pct, image: c.imageThumbUrl || c.imageUrl, link: site.url(c.slug), card: true });
  }
  return { from: then.day, to: now.day, basis: 'Cheapest in-stock store listing, in US$', moves };
}

// ─── OP (snapshot core + prices) ──────────────────────────────────────────────────────────────────────────
export function opMoves(core, prices, site) {
  const setById = new Map(core.sets.map((s) => [s.id, s]));
  const byId = new Map(core.cards.map((c) => [c[0], c]));
  const moves = [];
  prices.ids.forEach((id, i) => {
    const p = prices.prices[i], c = byId.get(id);
    if (!c || !p || p[0] == null || p[3] == null || p[0] < 500 || c[14] !== 1) return;
    if (p[0] / (1 + p[3] / 100) < 300) return; // a week back under US$3 too: the same floor both ways
    if (c[7] === 'promo' || c[7] === 'don') return;
    const pct = Math.round(p[3]);
    if (pct > 100 || pct < -50 || Math.abs(pct) < 10) return;
    const before = Math.round(p[0] / (1 + p[3] / 100));
    const slug = c[1] === 0 ? null : c[1];
    if (!slug) return;
    const name = [c[2], c[6]].filter(Boolean).join(' · ');
    const set = setById.get(c[4]);
    // No photo: TCGplayer's One Piece scans carry a "SAMPLE" watermark (every card in the 2026-11-08 run), so the row draws a
    // card-shaped tile with the card number and rarity instead (stage.html .tile).
    moves.push({ name, sub: set?.name || set?.code || '', before, after: p[0], pct, image: null, tile: { number: c[3] || '', rarity: c[5] || '' }, link: site.url(slug), card: true });
  });
  const to = prices.at.slice(0, 10);
  return { from: isoOfDay(dayOf(to) - 7), to, basis: "TCGplayer market price", moves };
}

export async function loadMoves(id) {
  const site = SITES[id];
  if (!site) throw new Error(`unknown site ${id} (${Object.keys(SITES).join(', ')})`);
  if (site.kind === 'sealed') {
    const [h, p] = await Promise.all([get(`${site.base}/price-history.json`), get(`${site.base}/products.json`)]);
    return sealedMoves(h, p, site);
  }
  if (id === 'rift') {
    // The newest daily file and the newest one at least a week older (a missed import day leaves a gap).
    let today = isoOfDay(Math.floor(Date.now() / DAY) + 1); // a Sydney day can be tomorrow in UTC
    let now = null;
    for (let k = 0; k < 6 && !now; k++, today = isoOfDay(dayOf(today) - 1)) now = await get(`${site.base}/price-history/cards/${today}.json`).catch(() => null);
    if (!now) throw new Error('rift: no recent price file');
    let then = null, back = dayOf(now.day) - 7;
    for (let k = 0; k < 4 && !then; k++, back--) then = await get(`${site.base}/price-history/cards/${isoOfDay(back)}.json`).catch(() => null);
    if (!then) throw new Error('rift: no price file a week back');
    return riftMoves(now, then, await get(`${site.base}/public/cards.json`), site);
  }
  const [core, prices] = await Promise.all([get(`${site.base}/core.json.gz`, 'gz'), get(`${site.base}/prices.json.gz`, 'gz')]);
  return opMoves(core, prices, site);
}

/** A larger photo where the CDN offers one. */
const bigImage = (u) => u.replace(/_200w\.jpg$/, '_in_1000x1000.jpg').replace(/([?&]width=)\d+/, '$1900');
const mimeOf = (u, b) => (b[0] === 0x89 ? 'image/png' : b.slice(8, 12).toString() === 'WEBP' ? 'image/webp' : 'image/jpeg');

async function main() {
  const [out, id, flag] = process.argv.slice(2);
  const site = SITES[id];
  const got = await loadMoves(id);
  const ranked = rankMoves(got.moves);
  mkdirSync(path.join(out, 'img'), { recursive: true });
  // Photos: a move without one is skipped (offline: a grey placeholder, for local previews only).
  const withImg = async (list) => {
    const keep = [];
    for (const m of list) {
      if (keep.length >= PER_SIDE) break;
      if (m.tile) { keep.push({ ...m }); continue; }
      let buf = null;
      if (flag !== '--offline') buf = await get(bigImage(m.image), 'bin').catch(() => null);
      if (!buf && flag !== '--offline') continue;
      const file = `img/${m.pct > 0 ? 'u' : 'd'}${keep.length}`;
      if (buf) { writeFileSync(path.join(out, file), buf); keep.push({ ...m, imgFile: file, imgType: mimeOf(m.image, buf) }); }
      else keep.push({ ...m });
    }
    return keep;
  };
  const up = await withImg(ranked.up), down = await withImg(ranked.down);
  if (up.length + down.length < 3 || (up.length < 2 && down.length < 2)) {
    console.error(`skip ${id}: ${up.length} up, ${down.length} cheaper with photos (${got.moves.length} clean moves)`);
    process.exit(3);
  }
  const range = `${prettyDay(got.from)} → ${prettyDay(got.to)}`;
  const spec = {
    stage: 'movers/stage.html', coverAt: 2.2, stills: [2.2, 6.5, 12.8, 18.5], site: id, siteName: site.name, topic: site.topic, host: site.host, accent: site.accent, page: site.page,
    from: got.from, to: got.to, range, basis: got.basis, cardsArt: site.kind === 'cards', up, down,
    fine: `${got.basis}, ${prettyDay(got.from)} vs ${prettyDay(got.to)} ${got.to.slice(0, 4)}. Prices change. ${site.fine}`,
  };
  writeFileSync(path.join(out, 'spec.json'), JSON.stringify(spec, null, 1));
  const line = (m) => `${m.pct > 0 ? '▲' : '▼'} ${m.name}: ${usd(m.before)} → ${usd(m.after)} (${m.pct > 0 ? '+' : '−'}${Math.abs(m.pct)}%)`;
  const parts = [`${site.topic} price movers this week 📊 ${range}`];
  if (up.length) parts.push(`Up:\n${up.map(line).join('\n')}`);
  if (down.length) parts.push(`Cheaper:\n${down.map(line).join('\n')}`);
  parts.push(site.kind === 'cards' && id === 'op' ? `${got.basis}, a week ago vs today.` : `${got.basis}, a week ago vs today. A week is short: a move can be one store selling out.`);
  parts.push(`Every store compared daily on ${site.host} 👉 ${site.page}`);
  parts.push(`${site.fine}\n\n${site.tags} #tcgprices`);
  writeFileSync(path.join(out, 'caption.txt'), parts.join('\n\n') + '\n');
  writeFileSync(path.join(out, 'links.txt'), [...up, ...down].map((m) => `${m.name}: ${m.link}`).join('\n') + '\n');
  console.log(`${id}: ${up.length} up, ${down.length} cheaper (${got.moves.length} clean moves, ${range})`);
}
if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exit(1); });
