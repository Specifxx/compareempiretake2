// node social/reels/publish.mjs <day>
// Posts reels/<day>/reel.mp4 from the public `reels` branch to @compareempire through Instagram's content-publishing
// API. Needs IG_ACCESS_TOKEN: a never-expiring system-user token from the Meta app "Compare Empire Reels" (Unified
// login, starts EAA, served by graph.facebook.com), or an Instagram Login token (graph.instagram.com). IG_USER_ID
// defaults to @compareempire's Instagram id (public, not a secret). Without the token it says so and
// exits 0, so the render still succeeds before the account is connected. Never posts the same day twice: it skips when
// reels/<day>/posted.json exists (written by the workflow after a publish).
import { readFileSync, writeFileSync, existsSync } from 'fs';
const day = process.argv[2];
const { IG_ACCESS_TOKEN: token, REELS_SHA: sha } = process.env;
let user = process.env.IG_USER_ID || '';
if (!token) { console.log('Instagram not connected yet (IG_ACCESS_TOKEN missing): rendered only.'); process.exit(0); }
if (existsSync(`reels/${day}/posted.json`)) { console.log('already posted'); process.exit(0); }
const G = token.startsWith('EAA') ? 'https://graph.facebook.com/v21.0' : 'https://graph.instagram.com/v21.0';
// A system-user token (Unified login) names the Instagram account it may publish to in its granular scopes; that
// Graph id differs from the id the dashboard shows, so read it from the token itself when IG_USER_ID is unset.
if (!user && token.startsWith('EAA')) {
  const d = await (await fetch(`${G}/debug_token?input_token=${token}&access_token=${token}`)).json();
  const scopes = d.data?.granular_scopes || [];
  const ids = [...new Set(scopes.filter((g) => /^instagram_/.test(g.scope)).flatMap((g) => g.target_ids || []))];
  console.log(`token scopes: ${scopes.map((g) => `${g.scope}${g.target_ids ? `[${g.target_ids.join(',')}]` : ''}`).join(' ') || JSON.stringify(d.error || {})}`);
  user = ids[0] || '';
}
if (!user) user = token.startsWith('EAA') ? '17841469203276309' : 'me';
console.log(`posting as ${user}`);
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
