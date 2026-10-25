import { sitemapSections, urlsetXml, XML_HEADERS } from "@/lib/seo";

export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => sitemapSections().map((s) => ({ id: `${s.id}.xml` }));

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id.replace(/\.xml$/, "");
  const section = sitemapSections().find((s) => s.id === id);
  if (!section) return new Response("Not found", { status: 404 });
  return new Response(urlsetXml(section.entries()), { headers: XML_HEADERS });
}
