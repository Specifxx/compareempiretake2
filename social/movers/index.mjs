// node social/movers/index.mjs <moversDir> <day>
// Writes <moversDir>/README.md (GitHub shows it on the `reels` branch: the page creators are sent to) and latest.json, from the
// week's folders <moversDir>/<day>/<site>/. Download links are raw.githubusercontent.com (served as files, a few minutes' cache).
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { SITES, prettyDay } from './pick.mjs';
const [dir, day] = process.argv.slice(2);
const RAW = 'https://raw.githubusercontent.com/Specifxx/compareempiretake2/reels/movers';
const weeks = readdirSync(dir).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().reverse();
const latest = {};
const block = [];
for (const id of Object.keys(SITES)) {
  const w = weeks.find((d) => existsSync(path.join(dir, d, id, 'movers.mp4')));
  if (!w) continue;
  const spec = JSON.parse(readFileSync(path.join(dir, w, id, 'spec.json'), 'utf8'));
  const base = `${RAW}/${w}/${id}`;
  latest[id] = { week: w, range: spec.range, video: `${base}/movers.mp4`, cover: `${base}/cover.png`, caption: `${base}/caption.txt`, links: `${base}/links.txt` };
  block.push(`### ${spec.siteName}: ${spec.topic}\n\n${spec.range} ${w.slice(0, 4)}. [Download the video](${base}/movers.mp4) · [cover](${base}/cover.png) · [caption](${base}/caption.txt) · [product links](${base}/links.txt)\n`);
}
writeFileSync(path.join(dir, 'latest.json'), JSON.stringify({ updated: day, sites: latest }, null, 1) + '\n');
writeFileSync(path.join(dir, 'README.md'), `# Weekly price movers: free videos for creators

Every Monday: a 20-second vertical video (1080×1920, with original music) of the week's biggest price moves on DexCompare,
RiftCompare, OP Compare and MTG Compare. Free to post on TikTok, Reels and Shorts, with or without your own voice-over. All we ask
is that the site stays named in the video (it is on the last screen) or in your caption.

Updated ${prettyDay(day)} ${day.slice(0, 4)}.

${block.join('\n')}
## The numbers

Each video says its basis on screen: the cheapest in-stock US store price (DexCompare, MTG Compare), the cheapest in-stock store
listing in US$ (RiftCompare) or TCGplayer's market price (OP Compare), a week ago against today. Moves under 10%, under US$5 or
over double / under half are left out. Prices change; a week is short.

Older weeks: the dated folders here (eight weeks are kept).
`);
console.log(Object.keys(latest).join(' '));
