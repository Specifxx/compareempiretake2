import { handleMcp, MCP_MAX_BODY, MCP_TOOLS } from "@/lib/mcp";
import { SITE } from "@/lib/site";

/**
 * POST /api/mcp: the Compare Empire MCP server (lib/mcp.ts, DECISIONS.md 2026-11-10). Stateless Streamable HTTP:
 * one JSON-RPC message per POST, one JSON answer, never cached. GET describes the server (MCP clients that try a
 * server-sent-events stream get 405, which the spec allows for a server that offers none).
 */
export const dynamic = "force-dynamic";

const HEADERS = { "cache-control": "no-store", "x-content-type-options": "nosniff", "x-robots-tag": "noindex" };

export async function POST(req: Request) {
  const text = await req.text();
  if (text.length > MCP_MAX_BODY) return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Request too large" } }, { status: 413, headers: HEADERS });
  let msg: unknown;
  try {
    msg = JSON.parse(text);
  } catch {
    return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400, headers: HEADERS });
  }
  const out = handleMcp(msg);
  if (!out) return new Response(null, { status: 202, headers: HEADERS });
  // One line per tool call in the function log: how often assistants use us, and for what (the 4-week test).
  const m = msg as { method?: string; params?: { name?: string; arguments?: { region?: string } } };
  if (m.method === "tools/call") console.log(`[mcp] tool=${String(m.params?.name).slice(0, 30)} region=${String(m.params?.arguments?.region ?? "us").slice(0, 4)}`);
  return Response.json(out, { headers: HEADERS });
}

export function GET(req: Request) {
  if ((req.headers.get("accept") ?? "").includes("text/event-stream")) return new Response(null, { status: 405, headers: { ...HEADERS, allow: "POST" } });
  return Response.json(
    { name: "Compare Empire MCP server", endpoint: `${SITE}/api/mcp`, transport: "streamable-http (POST, JSON responses)", tools: MCP_TOOLS.map((t) => t.name), docs: `${SITE}/mcp` },
    { headers: HEADERS },
  );
}
