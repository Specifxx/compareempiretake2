// node social/reels/publish.mjs <day>
// Posts reels/<day>/reel.mp4 from the public `reels` branch to Instagram through the Instagram API with Instagram
// Login (graph.instagram.com, content publishing). Needs IG_USER_ID and IG_ACCESS_TOKEN; without them it says so and
// exits 0, so the render still succeeds before the account is connected. Never posts the same day twice: it skips when
// reels/<day>/posted.json exists (written by the workflow after a publish).
import { readFileSync, writeFileSync, existsSync } from 'fs';
const day = process.argv[2];
const { IG_USER_ID: user, IG_ACCESS_TOKEN: token, REELS_SHA: sha } = process.env;
if (!user || !token) { console.log('Instagram not connected yet (IG_USER_ID / IG_ACCESS_TOKEN missing): rendered only.'); process.exit(0); }
if (existsSync(`reels/${day}/posted.json`)) { console.log('already posted'); process.exit(0); }
const G = 'https://graph.instagram.com/v21.0';
const base = `https://cdn.jsdelivr.net/gh/Specifxx/compareempiretake2@${sha}/reels/${day}`;
const caption = readFileSync(`reels/${day}/caption.txt`, 'utf8');
async function call(path, params, method = 'POST') {
  const body = new URLSearchParams({ ...params, access_token: token });
  const r = method === 'GET' ? await fetch(`${G}/${path}?${body}`) : await fetch(`${G}/${path}`, { method, body });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(`${path}: ${JSON.stringify(j.error || j)}`);
  return j;
}
const c = await call(`${user}/media`, { media_type: 'REELS', video_url: `${base}/reel.mp4`, cover_url: `${base}/cover.png`, caption, share_to_feed: 'true' });
for (let i = 0; ; i++) {
  await new Promise((r) => setTimeout(r, 10000));
  const s = await call(c.id, { fields: 'status_code,status' }, 'GET');
  if (s.status_code === 'FINISHED') break;
  if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED' || i > 60) throw new Error(`container ${c.id}: ${JSON.stringify(s)}`);
}
const p = await call(`${user}/media_publish`, { creation_id: c.id });
const m = await call(p.id, { fields: 'permalink' }, 'GET');
writeFileSync(`reels/${day}/posted.json`, JSON.stringify({ id: p.id, permalink: m.permalink, at: new Date().toISOString() }) + '\n');
console.log(`posted ${m.permalink}`);
