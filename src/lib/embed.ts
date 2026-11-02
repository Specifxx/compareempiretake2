// The free embeddable price badge (DECISIONS.md, "Free price widgets", 2026-11-02): a chrome-free HTML document a
// blog or community site drops into an <iframe>, plus one plain text link under it (the only part a search engine
// credits to us). Pure: tests/embed.test.ts. The route (src/app/embed/price/route.ts) reads the catalogue.
import { REGION_IDS, type RegionId } from "./region";
import { CATEGORIES } from "./categories";

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id));
const SLUG = /^[a-z0-9-]{1,160}$/;

/**
 * ?p= is a product's own address on the site, with or without the domain: "/us/tvs/lg-c5", "tvs/lg-c5" (Australia,
 * which has no prefix), "https://compareempire.com/uk/phones/x". Anything else is null.
 */
export function parseProductPath(v: string | null | undefined): { region: RegionId; category: string; slug: string } | null {
  if (!v) return null;
  const parts = v.trim().replace(/^https?:\/\/[^/]+/i, "").split(/[?#]/)[0].split("/").filter(Boolean);
  let region: RegionId = "au";
  if (parts.length === 3 && (REGION_IDS as string[]).includes(parts[0])) region = parts.shift() as RegionId;
  if (parts.length !== 2) return null;
  const [category, slug] = parts;
  if (!CATEGORY_IDS.has(category) || !SLUG.test(slug)) return null;
  return { region, category, slug };
}

export interface Badge {
  site: string;
  name: string;
  meta: string;
  price: string | null;
  sub: string;
  href: string;
  image: string | null;
}

/** The widget's whole HTML. Inline CSS, no script, noindex. */
export function badgeHtml(b: Badge): string {
  const img = b.image ? `<img class="i" src="${esc(b.image)}" alt="" width="56" height="56" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : `<div class="i"></div>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${esc(b.site)} price</title>
<style>*{box-sizing:border-box;margin:0;padding:0}html,body{background:transparent;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}a{text-decoration:none;color:inherit}
.c{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #d6dae1;border-radius:12px;background:#fff;color:#0f172a}.c:hover{border-color:#2563eb}
.i{width:56px;height:56px;border-radius:8px;object-fit:contain;flex:none;background:#f1f5f9}.b{min-width:0;flex:1}
.n{font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.m{font-size:11px;color:#64748b;margin-top:1px}
.p{font-size:19px;font-weight:800;color:#047857;margin-top:4px}.s{font-size:11px;color:#64748b}
.t{flex:none;font-weight:700;font-size:12px;padding:7px 10px;border-radius:8px;background:#eff6ff;color:#1d4ed8}.f{margin-top:4px;text-align:right;font-size:10px;color:#94a3b8}</style></head>
<body><a class="c" href="${esc(b.href)}" target="_blank" rel="noopener">${img}<div class="b"><div class="n" title="${esc(b.name)}">${esc(b.name)}</div><div class="m">${esc(b.meta)}</div><div class="p">${b.price ? esc(b.price) : "—"}</div><div class="s">${esc(b.sub)}</div></div><div class="t">Compare&nbsp;→</div></a><div class="f">Live prices by ${esc(b.site)}</div></body></html>`;
}

/** The snippet a site owner copies: the iframe, then one plain text link (the part search engines credit). */
export function embedSnippet(siteUrl: string, siteName: string, path: string, name: string): string {
  return `<iframe src="${siteUrl}/embed/price?p=${path}" width="100%" height="130" style="border:0" loading="lazy" title="${esc(name)} price"></iframe>\n<p style="font-size:12px;margin:2px 0 0"><a href="${siteUrl}${path}">${esc(name)} price comparison on ${siteName}</a></p>`;
}

/** The plain-HTML "compare prices" link for a page about a product type: no iframe, no script. */
export function textBadge(siteUrl: string, siteName: string, path: string, label: string): string {
  return `<a href="${siteUrl}${path}" style="display:inline-block;padding:6px 10px;border:1px solid #d6dae1;border-radius:8px;font:600 12px system-ui,sans-serif;color:#0f172a;text-decoration:none;background:#fff">${esc(label)} price comparison · ${siteName}</a>`;
}
