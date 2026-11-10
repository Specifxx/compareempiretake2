import type { Metadata } from "next";
import { MCP_TOOLS } from "@/lib/mcp";
import { SITE } from "@/lib/site";

// /mcp (DECISIONS.md 2026-11-10): how to connect an AI assistant to the Compare Empire MCP server. Static.
export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "Compare Empire for AI assistants (MCP server)",
  description: "Connect Claude, ChatGPT or any MCP client to Compare Empire's price data: search products, compare every store's price and read price history. Free, no key.",
  alternates: { canonical: "/mcp" },
};

export default function Page() {
  const endpoint = `${SITE}/api/mcp`;
  return (
    <div className="container-x max-w-3xl pt-12 pb-16">
      <div className="eyebrow">For AI assistants</div>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Compare Empire’s MCP server</h1>
      <p className="mt-3 text-ink-soft">
        AI assistants that shop for people can ask Compare Empire for prices directly. The server answers with each country’s store prices in its own currency, the
        same data as this site and its sister sites, and links to the full comparison. Free, no key, read only.
      </p>
      <section className="mt-8">
        <h2 className="font-display text-2xl font-bold">Connect</h2>
        <p className="mt-2 text-ink-soft">Add a remote MCP server (Streamable HTTP) with this URL:</p>
        <pre className="mt-2 overflow-x-auto rounded-xl border border-line bg-bg-sunk p-3 text-sm">{endpoint}</pre>
        <p className="mt-2 text-sm text-ink-mute">In Claude: Settings, Connectors, Add custom connector. In other clients, the remote or HTTP server option.</p>
      </section>
      <section className="mt-8">
        <h2 className="font-display text-2xl font-bold">Tools</h2>
        <dl className="mt-3 space-y-4">
          {MCP_TOOLS.map((t) => (
            <div key={t.name}>
              <dt className="font-mono text-sm font-semibold">{t.name}</dt>
              <dd className="mt-1 text-ink-soft">{t.description}</dd>
            </div>
          ))}
        </dl>
      </section>
      <p className="mt-8 text-sm text-ink-mute">Some links are affiliate links: we may earn a commission, and it never changes the order of prices.</p>
    </div>
  );
}
