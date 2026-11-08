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
let G = token.startsWith('EAA') ? 'https://graph.facebook.com/v21.0' : 'https://graph.instagram.com/v21.0';
// Which host and Instagram id the token publishes with: the token itself decides. Try the Instagram host first (an
// Instagram Login token, or a Unified-login token it accepts), then the Facebook host's own account and its Pages'
// linked Instagram accounts. Each probe logs its answer (never the token) so a failure says why.
async function probe(url) {
  try { const j = await (await fetch(`${url}${url.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`)).json(); console.log(`probe ${url.split('?')[0].replace(/^https:\/\//, '')}: ${JSON.stringify(j).slice(0, 300)}`); return j; }
  catch (e) { console.log(`probe ${url}: ${e.message}`); return {}; }
}
if (!user) {
  const ig = await probe('https://graph.instagram.com/v21.0/me?fields=user_id,username');
  if (ig.user_id || ig.id) { G = 'https://graph.instagram.com/v21.0'; user = ig.user_id || ig.id; }
}
if (!user) {
  await probe('https://graph.facebook.com/v21.0/me?fields=id,name');
  const pages = await probe('https://graph.facebook.com/v21.0/me/accounts?fields=name,instagram_business_account{id,username}');
  const hit = (pages.data || []).map((p) => p.instagram_business_account).find(Boolean);
  if (hit) { G = 'https://graph.facebook.com/v21.0'; user = hit.id; }
}
if (!user) {
  // A system-user token reaches the Instagram accounts its business (RiftCompare portfolio) has and assigns to it.
  for (const path of ['me/assigned_business_assets?fields=id,name', 'me?fields=business{id,name}',
    '1787602549084949/instagram_business_accounts?fields=id,username', '1787602549084949/owned_instagram_accounts?fields=id,username',
    '1787602549084949/instagram_accounts?fields=id,username', '17841469203276309?fields=id,username']) {
    const j = await probe(`https://graph.facebook.com/v21.0/${path}`);
    const acct = (j.data || [j]).find((a) => a && a.username === 'compareempire' && a.id);
    if (acct && !user) { G = 'https://graph.facebook.com/v21.0'; user = acct.id; }
  }
}
if (!user) throw new Error('no Instagram account reachable with this token (see probes above)');
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
