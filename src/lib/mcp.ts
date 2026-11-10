/**
 * The Compare Empire MCP server (owner, 2026-11-10, plan B; DECISIONS.md 2026-11-10): AI assistants that shop for
 * people (Claude, ChatGPT and any MCP client) can search the family's prices and read store-by-store comparisons,
 * with our tagged links. Model Context Protocol over Streamable HTTP, stateless: every POST to /api/mcp is one
 * JSON-RPC message answered with one JSON response; no sessions, no streaming, no server-sent events.
 *
 * Tools read the same committed data as the site (lib/live-search.ts); nothing here fetches anything.
 */
import { comparePrices, isRegion, normaliseQuery, priceHistory, QUERY_MIN, searchEverything } from "./live-search";
import { SITE, SITE_NAME } from "./site";

export const MCP_PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"] as const;
export const MCP_MAX_BODY = 16 * 1024;

const REGION_SCHEMA = { type: "string", enum: ["us", "au", "uk", "ca", "sg"], description: "Shopper's country: us, au, uk, ca or sg. Prices are that country's stores, in its currency, never converted. Default us." };
const PRODUCT_SCHEMA = { type: "string", description: "A Compare Empire product URL or path from search_products, e.g. https://compareempire.com/us/phones/apple-iphone-17-pro" };

export const MCP_TOOLS = [
  {
    name: "search_products",
    title: "Search product prices",
    description:
      "Search prices across the Compare Empire family of price comparison sites: phones, laptops, TVs, headphones, consoles and other tech (compareempire.com), plus Pokémon, Magic, Yu-Gi-Oh!, Lorcana, Gundam and sports card sealed product, anime figures and miniature wargames on the sister sites. Returns the lowest in-stock store price per product with a link to the full comparison.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "What the shopper wants, e.g. \"iPhone 17 Pro\", \"Sony WH-1000XM6\", \"Prismatic Evolutions elite trainer box\"." }, region: REGION_SCHEMA, limit: { type: "integer", minimum: 1, maximum: 20, description: "Results per source, default 8." } },
      required: ["query"],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "compare_prices",
    title: "Compare store prices",
    description: "Every store's current price for one Compare Empire product, cheapest in stock first, per variant (storage or size), with buy links. Use a URL from search_products.",
    inputSchema: { type: "object", properties: { product: PRODUCT_SCHEMA }, required: ["product"] },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "price_history",
    title: "Price history",
    description: "The daily best store price for one Compare Empire product over recent days, per variant, to judge whether today's price is good.",
    inputSchema: { type: "object", properties: { product: PRODUCT_SCHEMA, days: { type: "integer", minimum: 1, maximum: 365, description: "Days back, default 90." } }, required: ["product"] },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
] as const;

type Id = string | number | null;
type Rpc = { jsonrpc: "2.0"; id: Id; result: unknown } | { jsonrpc: "2.0"; id: Id; error: { code: number; message: string } };
const ok = (id: Id, result: unknown): Rpc => ({ jsonrpc: "2.0", id, result });
const fail = (id: Id, code: number, message: string): Rpc => ({ jsonrpc: "2.0", id, error: { code, message } });
const toolResult = (data: unknown) => ({ content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: data, isError: false });
const toolError = (message: string) => ({ content: [{ type: "text", text: message }], isError: true });

export function callTool(name: string, args: Record<string, unknown>) {
  if (name === "search_products") {
    const query = normaliseQuery(typeof args.query === "string" ? args.query : "");
    if (query.length < QUERY_MIN) return toolError("query must be at least 2 characters");
    const region = args.region ?? "us";
    if (!isRegion(region)) return toolError("region must be us, au, uk, ca or sg");
    const limit = typeof args.limit === "number" && Number.isInteger(args.limit) ? Math.max(1, Math.min(20, args.limit)) : 8;
    const a = searchEverything(query, region, { limit, placement: "mcp" });
    return toolResult({ ...a, note: "Prices are each country's own stores, in its currency, never converted. Links to compareempire.com and its sister sites show every store; the eBay link is a search, not a price." });
  }
  if (name === "compare_prices" || name === "price_history") {
    const product = typeof args.product === "string" ? args.product.trim().slice(0, 300) : "";
    const days = typeof args.days === "number" && Number.isInteger(args.days) ? args.days : 90;
    const out = name === "compare_prices" ? comparePrices(product, "mcp") : priceHistory(product, days);
    return out ? toolResult(out) : toolError("Unknown product. Pass a compareempire.com product URL from search_products (sister-site products are compared on their own sites).");
  }
  return null;
}

/**
 * One JSON-RPC message in, one response out; null for a notification (the route answers 202 with no body).
 * Never throws on bad input: a malformed message gets a JSON-RPC error.
 */
export function handleMcp(msg: unknown): Rpc | null {
  if (!msg || typeof msg !== "object" || Array.isArray(msg)) return fail(null, -32600, "Invalid Request");
  const m = msg as { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown };
  const id: Id = typeof m.id === "string" || typeof m.id === "number" ? m.id : null;
  if (m.jsonrpc !== "2.0" || typeof m.method !== "string") return fail(id, -32600, "Invalid Request");
  const isNotification = !("id" in m);
  const params = (m.params && typeof m.params === "object" ? m.params : {}) as Record<string, unknown>;
  if (isNotification) return null;
  switch (m.method) {
    case "initialize": {
      const asked = typeof params.protocolVersion === "string" ? params.protocolVersion : "";
      const protocolVersion = (MCP_PROTOCOL_VERSIONS as readonly string[]).includes(asked) ? asked : MCP_PROTOCOL_VERSIONS[0];
      return ok(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "compare-empire", title: SITE_NAME, version: "1.0.0", websiteUrl: SITE },
        instructions:
          "Price comparison across independent stores in the US, Australia, UK, Canada and Singapore. Start with search_products; use compare_prices on a compareempire.com result for every store's price. Never present a converted price: each country's prices are in its own currency.",
      });
    }
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, { tools: MCP_TOOLS });
    case "tools/call": {
      const name = typeof params.name === "string" ? params.name : "";
      const args = (params.arguments && typeof params.arguments === "object" ? params.arguments : {}) as Record<string, unknown>;
      const out = callTool(name, args);
      return out ? ok(id, out) : fail(id, -32602, `Unknown tool: ${name.slice(0, 40)}`);
    }
    case "resources/list":
      return ok(id, { resources: [] });
    case "prompts/list":
      return ok(id, { prompts: [] });
    default:
      return fail(id, -32601, "Method not found");
  }
}
