const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET with a browser UA, retrying transient failures with backoff. */
export async function get(url: string, tries = 4): Promise<string> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": UA, accept: "text/html,application/json;q=0.9,*/*;q=0.8", "accept-language": "en-AU,en;q=0.9" },
        redirect: "follow",
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status === 404) throw Object.assign(new Error(`404 ${url}`), { permanent: true });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return await res.text();
    } catch (e) {
      last = e;
      if ((e as { permanent?: boolean }).permanent) throw e;
      await sleep(2000 * 2 ** i);
    }
  }
  throw last;
}

export async function getJson<T>(url: string): Promise<T> {
  return JSON.parse(await get(url)) as T;
}

/** Map with bounded concurrency, keeping order. */
export async function pool<T, R>(items: T[], n: number, fn: (t: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

/**
 * A store title as a buyer reads it, whatever the scraper left in: HTML entities ("Bowers &amp; Wilkins" became
 * the brand "Bowers &Amp; Wilkins" and the slug "bowers-amp-wilkins"; "Weber&#174" with no semicolon), the
 * ®/™ marks and a feed's variant tag ("[v::tx]"). The catalogue builder runs every raw title through it, so one
 * scraper that forgets to decode can no longer mint a URL (DECISIONS.md, 2026-11-05).
 */
export function cleanTitle(title: string): string {
  return decodeEntities(title.replace(/&#(\d+)(?![\d;])/g, "&#$1;"))
    .replace(/[®™©]/g, "")
    .replace(/\s*\[v::[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
