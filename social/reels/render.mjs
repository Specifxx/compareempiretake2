// node render.mjs spec.json outdir [--stills]
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { spawn } from 'child_process';
import path from 'path';
const [specPath, out, flag] = process.argv.slice(2);
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
// Photos: the daily reel's deals, or the weekly movers' two lists (social/movers), inlined as data URIs.
for (const d of [...(spec.deals || []), ...(spec.up || []), ...(spec.down || [])]) if (d.imgFile) d.img = `data:${d.imgType || 'image/jpeg'};base64,` + readFileSync(path.resolve(path.dirname(specPath), d.imgFile)).toString('base64');
mkdirSync(out, { recursive: true });
const here = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.addInitScript(s => { window.SPEC = s; }, spec);
// spec.stage: another stage page, relative to this folder's parent (social/), e.g. movers/stage.html.
await page.goto('file://' + (spec.stage ? path.resolve(here, '..', spec.stage) : here + '/stage.html'));
await page.waitForFunction(() => window.READY);
await page.evaluate(() => document.fonts.ready);
const dur = await page.evaluate(() => window.DURATION);
writeFileSync(path.join(out, 'timeline.json'), JSON.stringify({ duration: dur, cuts: await page.evaluate(() => window.CUTS) }));
if (flag === '--stills') {
  const ts = spec.stills || [1.8, 6.5, 12, 17.5, dur - 1];
  for (const t of ts) { await page.evaluate(t => render(t), t); await page.screenshot({ path: path.join(out, `still-${t}.png`) }); }
} else {
  const fps = 30, n = Math.ceil(dur * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', path.join(out, 'video-silent.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => render(t), i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i === Math.round((spec.coverAt ?? 2.3) * fps)) await page.screenshot({ path: path.join(out, 'cover.png') });
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await browser.close();
