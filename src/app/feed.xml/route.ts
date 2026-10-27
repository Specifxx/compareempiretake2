import { getGuides } from "@/lib/guides";
import { SITE, SITE_NAME } from "@/lib/site";

// The guides as RSS 2.0, newest first, as RiftCompare's /feed.xml: feed readers and some crawlers
// find new articles here. Built once per deploy.
export const dynamic = "force-static";

const x = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const items = [...getGuides()]
    .sort((a, b) => (b.updated ?? b.date).localeCompare(a.updated ?? a.date))
    .map((g) => {
      const url = `${SITE}/guides/${g.slug}`;
      return `<item><title>${x(g.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${new Date(`${(g.updated ?? g.date).slice(0, 10)}T00:00:00Z`).toUTCString()}</pubDate><description>${x(g.description)}</description></item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${x(SITE_NAME)} guides</title><link>${SITE}</link><description>Australian tech price guides from ${x(SITE_NAME)}.</description><language>en-AU</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
