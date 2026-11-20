import { ImageResponse } from "next/og";
import { money, REGION_IDS, type RegionId } from "@/lib/region";

/**
 * The GTA 6 hub's link preview (owner, 2026-11-20: a Reddit link post "where the thumbnail has pretty much all of that
 * people want"). A Vice City sunset card: the headline, then every console Rockstar names with today's cheapest
 * in-stock price at the region's stores. Like /og, everything it draws travels in the query string (gta6OgImage in
 * lib/gta6.ts), so it renders on the edge without the catalogue and a URL changes when its prices do. A console with no
 * tracked price shows "check stores", never a number. Our own art only: palms and a sun drawn here, no Rockstar logo or art.
 *   /og/gta-6?r=us&c=Xbox+Series+S~499.99~1|PlayStation+5~~0&e=US$79.99~US$99.99
 */
export const runtime = "edge";

const archivo = fetch(new URL("../fonts/Archivo-900.ttf", import.meta.url)).then((r) => r.arrayBuffer());
const inter = fetch(new URL("../fonts/Inter-700.ttf", import.meta.url)).then((r) => r.arrayBuffer());
const pacifico = fetch(new URL("../fonts/Pacifico-400.woff", import.meta.url)).then((r) => r.arrayBuffer());

const PINK = "#ff3ea5";
const CYAN = "#2de2e6";
/** A thumbnail travels: say whose dollar it is. */
const CUR: Record<RegionId, string> = { au: "A", us: "US", uk: "", ca: "C", sg: "S" };
const PLACE: Record<RegionId, string> = { au: "Australia", us: "the US", uk: "the UK", ca: "Canada", sg: "Singapore" };

function Palm({ x, scale, flip }: { x: number; scale: number; flip?: boolean }) {
  return (
    <svg width={220 * scale} height={360 * scale} viewBox="0 0 220 360" style={{ position: "absolute", left: x, bottom: -6, ...(flip ? { transform: "scaleX(-1)" } : {}) }}>
      <path d="M112 360 C108 280 104 200 118 120" stroke="#1b0b2e" strokeWidth="14" fill="none" />
      <path d="M118 120 C80 90 40 100 6 130 C46 108 84 112 118 124 Z" fill="#1b0b2e" />
      <path d="M118 120 C150 84 192 86 216 112 C180 98 148 104 120 126 Z" fill="#1b0b2e" />
      <path d="M118 120 C104 76 70 52 30 52 C70 66 98 90 116 126 Z" fill="#1b0b2e" />
      <path d="M118 120 C134 72 168 46 204 44 C170 62 142 88 122 126 Z" fill="#1b0b2e" />
      <path d="M118 120 C116 80 120 40 136 8 C130 48 128 86 122 124 Z" fill="#1b0b2e" />
    </svg>
  );
}

/** The console line-up the world card lists: Rockstar's two families, each model's built-in storage and whether it reads discs. */
const LINEUP: [string, string, boolean][] = [
  ["PlayStation 5", "1TB", true],
  ["PS5 Digital Edition", "1TB", false],
  ["PlayStation 5 Pro", "2TB", false],
  ["Xbox Series X", "1TB", true],
  ["Xbox Series S", "512GB / 1TB", false],
];
const LABEL: Record<string, string> = { us: "US", uk: "UK", au: "Australia" };
const GAME = "US$79.99 · £69.99 · A$129.95";

async function world(q: URLSearchParams) {
  const cheap = (q.get("s") ?? "").split("|").filter(Boolean).slice(0, 3).flatMap((s) => {
    const [r, name, price] = s.split("~");
    const n = Number(price);
    return (REGION_IDS as readonly string[]).includes(r) && n > 0 ? [{ r: r as RegionId, name: (name ?? "").slice(0, 28), price: n }] : [];
  });
  const [archivoData, interData, pacificoData] = await Promise.all([archivo, inter, pacifico]);
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: 1200, height: 630, position: "relative", fontFamily: "Inter", background: "linear-gradient(180deg, #2a0a4a 0%, #7a1e78 42%, #ff5f8f 72%, #ffb347 100%)", overflow: "hidden" }}>
        <div style={{ display: "flex", position: "absolute", left: 70, top: 300, width: 300, height: 300, borderRadius: 300, background: "linear-gradient(180deg, #ffe66d 0%, #ff8a5c 100%)" }} />
        {[0, 1, 2, 3].map((i) => <div key={i} style={{ display: "flex", position: "absolute", left: 60, top: 470 + i * 30, width: 320, height: 8 + i * 3, background: "#ff5f8f" }} />)}
        <Palm x={-30} scale={1.15} />
        <Palm x={300} scale={0.8} flip />

        <div style={{ display: "flex", flexDirection: "column", position: "absolute", left: 56, top: 40, width: 470 }}>
          <div style={{ display: "flex", fontFamily: "Pacifico", fontSize: 92, color: "#fff", lineHeight: 1.05, textShadow: `0 0 18px ${PINK}, 4px 4px 0 ${CYAN}` }}>GTA 6</div>
          <div style={{ display: "flex", fontFamily: "Archivo", fontSize: 40, color: "#fff", lineHeight: 1.08, marginTop: 8 }}>Every console that plays it, and what it costs</div>
          <div style={{ display: "flex", fontSize: 22, color: "#ffe1f0", marginTop: 12 }}>Out now · no PS6, no PC version yet</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", position: "absolute", right: 40, top: 34, width: 610, background: "rgba(16,6,32,0.9)", border: `3px solid ${CYAN}`, borderRadius: 26, padding: "16px 26px 18px", boxShadow: `0 0 34px ${PINK}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, color: "#c7b6e0", paddingBottom: 6 }}>
            <span>Console</span>
            <div style={{ display: "flex" }}><span style={{ width: 150, textAlign: "right" }}>Storage</span><span style={{ width: 110, textAlign: "right" }}>Disc drive</span></div>
          </div>
          {LINEUP.map(([name, storage, disc]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 44, borderTop: "2px solid rgba(255,255,255,0.12)" }}>
              <span style={{ fontSize: 26, color: "#fff" }}>{name}</span>
              <div style={{ display: "flex" }}>
                <span style={{ width: 150, textAlign: "right", fontSize: 24, color: "#fff" }}>{storage}</span>
                <span style={{ width: 110, textAlign: "right", fontFamily: "Archivo", fontSize: 24, color: disc ? CYAN : "#c7b6e0" }}>{disc ? "Yes" : "No"}</span>
              </div>
            </div>
          ))}
          {cheap.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 10, paddingTop: 10, borderTop: `2px solid ${CYAN}` }}>
              <span style={{ fontSize: 18, color: "#ffd0e8" }}>{`Cheapest in stock today${cheap.every((c) => c.name === cheap[0].name) ? ` (${cheap[0].name})` : ""}`}</span>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                {cheap.map((c) => (
                  <div key={c.r} style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontFamily: "Archivo", fontSize: 34, color: CYAN }}>{`${CUR[c.r]}${money(c.price, c.r)}`}</span>
                    <span style={{ fontSize: 16, color: "#c7b6e0" }}>{LABEL[c.r]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: "flex", marginTop: 10, fontSize: 19, color: "#ffd0e8" }}>{`The game, Standard: ${GAME}`}</div>
        </div>
        <div style={{ display: "flex", position: "absolute", right: 44, bottom: 26, fontFamily: "Archivo", fontSize: 30, color: "#fff" }}>compareempire.com</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Archivo", data: archivoData, weight: 900, style: "normal" },
        { name: "Inter", data: interData, weight: 700, style: "normal" },
        { name: "Pacifico", data: pacificoData, weight: 400, style: "normal" },
      ],
      headers: { "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" },
    },
  );
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  if (q.get("w")) return world(q);
  const r = (REGION_IDS as readonly string[]).includes(q.get("r") ?? "") ? (q.get("r") as RegionId) : "au";
  const rows = (q.get("c") ?? "").split("|").filter(Boolean).slice(0, 5).map((s) => {
    const [name, price, stores] = s.split("~");
    return { name: (name ?? "").slice(0, 32), price: Number(price) || 0, stores: Number(stores) || 0 };
  });
  const [std, ult] = (q.get("e") ?? "").split("~");
  const [archivoData, interData, pacificoData] = await Promise.all([archivo, inter, pacifico]);

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: 1200, height: 630, position: "relative", fontFamily: "Inter", background: "linear-gradient(180deg, #2a0a4a 0%, #7a1e78 42%, #ff5f8f 72%, #ffb347 100%)", overflow: "hidden" }}>
        {/* the sun, striped like an old poster */}
        <div style={{ display: "flex", position: "absolute", left: 70, top: 300, width: 300, height: 300, borderRadius: 300, background: "linear-gradient(180deg, #ffe66d 0%, #ff8a5c 100%)" }} />
        {[0, 1, 2, 3].map((i) => <div key={i} style={{ display: "flex", position: "absolute", left: 60, top: 470 + i * 30, width: 320, height: 8 + i * 3, background: "#ff5f8f" }} />)}
        <Palm x={-30} scale={1.15} />
        <Palm x={300} scale={0.8} flip />

        <div style={{ display: "flex", flexDirection: "column", position: "absolute", left: 56, top: 40, width: 470 }}>
          <div style={{ display: "flex", fontFamily: "Pacifico", fontSize: 92, color: "#fff", lineHeight: 1.05, textShadow: `0 0 18px ${PINK}, 4px 4px 0 ${CYAN}` }}>GTA 6</div>
          <div style={{ display: "flex", fontFamily: "Archivo", fontSize: 40, color: "#fff", lineHeight: 1.08, marginTop: 8 }}>Every console that plays it, cheapest today</div>
          <div style={{ display: "flex", fontSize: 22, color: "#ffe1f0", marginTop: 12 }}>{`Store prices in ${PLACE[r]} · no PS6 yet`}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", position: "absolute", right: 40, top: 40, width: 600, background: "rgba(16,6,32,0.88)", border: `3px solid ${CYAN}`, borderRadius: 26, padding: "20px 26px", boxShadow: `0 0 34px ${PINK}` }}>
          {rows.map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 70, borderBottom: i < rows.length - 1 ? "2px solid rgba(255,255,255,0.12)" : "none" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: row.name.length > 24 ? 25 : 28, color: "#fff" }}>{row.name}</span>
                <span style={{ fontSize: 18, color: "#c7b6e0" }}>{row.price ? `${row.stores} ${row.stores === 1 ? "store" : "stores"}` : "not in stock at stores we track"}</span>
              </div>
              <span style={{ fontFamily: "Archivo", fontSize: row.price ? 40 : 24, color: row.price ? CYAN : "#c7b6e0", whiteSpace: "nowrap", marginLeft: 16 }}>{row.price ? `${CUR[r]}${money(row.price, r)}` : "check stores"}</span>
            </div>
          ))}
          {std && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 22, color: "#ffd0e8" }}>
              <span>{`Game: ${std} Standard · ${ult} Ultimate`}</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", position: "absolute", right: 44, bottom: 26, fontFamily: "Archivo", fontSize: 30, color: "#fff" }}>compareempire.com</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Archivo", data: archivoData, weight: 900, style: "normal" },
        { name: "Inter", data: interData, weight: 700, style: "normal" },
        { name: "Pacifico", data: pacificoData, weight: 400, style: "normal" },
      ],
      headers: { "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" },
    },
  );
}
