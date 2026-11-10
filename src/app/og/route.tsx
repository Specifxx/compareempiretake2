import { parseRows, type ShareRow } from "@/lib/og";
import { money, REGION_IDS, REGIONS, type RegionId } from "@/lib/region";
import { ImageResponse } from "next/og";

/**
 * Link-preview card (1200×630) for the home pages, categories, products and deals. Everything it shows comes in
 * the query string (ogImage in src/lib/og.ts), so it renders on the edge without loading the catalogue, and the CDN
 * keeps each card a day; a card's URL changes when its prices do.
 *
 * Built to read at thumbnail size (owner, 2026-11-03: "even from far distance, people can tell what this website's
 * going to be about"): the brand's violet, a two- or three-word headline, and a white panel of real store prices
 * with the cheapest in green. Every price is a real in-stock store price from the page that links the card; a card
 * without prices draws the panel as empty bars, never invented stores or numbers.
 *
 * No store photos (2026-11-08, the Vercel cost cap): fetching a store's photo (up to 3 MB), decoding it and drawing
 * it made this route ~95% of the site's function CPU (Observability: /og 3 h of Active CPU in 12 h, the product
 * pages 4 min). The card keeps the brand, headline and real price rows; the product tile shows the tag glyph. `i`
 * and `x` are still written by ogImage and ignored here, so every card URL already shared stays valid.
 *   /og?k=home&t=Compare+prices&s=120&n=Galaxy+A17&i=<img>&d=JB+Hi-Fi~297|Harvey+Norman~299&x=<img>
 */
export const runtime = "edge";

const archivo = fetch(new URL("./fonts/Archivo-900.ttf", import.meta.url)).then((r) => r.arrayBuffer());
const inter = fetch(new URL("./fonts/Inter-700.ttf", import.meta.url)).then((r) => r.arrayBuffer());

const VIOLET = "#5B3DF5";
const INK = "#11111a";
const MUTE = "#707084";
const SAVE = "#058a5b";
const SAVE_SOFT = "#d9f6e9";

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <rect width="64" height="64" rx="16" fill="#fff" />
      <path d="M14 43V22l9 8 9-12 9 12 9-8v21z" fill={VIOLET} />
      <rect x="14" y="46.5" width="36" height="5" rx="2.5" fill={VIOLET} opacity=".55" />
    </svg>
  );
}

function Rows({ rows, region }: { rows: ShareRow[]; region: RegionId }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r, i) => {
        const first = i === 0;
        const last = i === rows.length - 1 && rows.length > 1 && r.p > rows[0].p;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: 64,
              padding: "0 22px",
              borderRadius: 16,
              background: first ? SAVE_SOFT : "#f3f3f8",
              border: first ? `3px solid ${SAVE}` : "3px solid transparent",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "Inter", fontSize: 27, color: first ? SAVE : "#404052", flex: 1, minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
              {first && <div style={{ display: "flex", width: 30, height: 30, borderRadius: 999, background: SAVE, color: "#fff", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✓</div>}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{r.s}</span>
            </div>
            <div style={{ display: "flex", flexShrink: 0, marginLeft: 14, fontFamily: "Archivo", fontSize: first ? 36 : 32, color: first ? SAVE : last ? "#9a9aae" : INK }}>
              {money(r.p, region)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Grey bars in place of rows, for a card with no prices of its own (deals and sale pages). */
function EmptyRows() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, padding: "0 22px", borderRadius: 16, background: i === 0 ? SAVE_SOFT : "#f3f3f8", border: i === 0 ? `3px solid ${SAVE}` : "3px solid transparent" }}>
          <div style={{ display: "flex", width: [190, 150, 210, 170][i], height: 18, borderRadius: 9, background: i === 0 ? "#9fe3c6" : "#dcdce6" }} />
          <div style={{ display: "flex", width: [110, 120, 120, 130][i], height: 24, borderRadius: 12, background: i === 0 ? SAVE : "#c9c9d6" }} />
        </div>
      ))}
    </div>
  );
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const kind = q.get("k") === "home" ? "home" : q.get("k") === "category" ? "category" : q.get("k") === "product" ? "product" : undefined;
  const title = (q.get("t") ?? "Compare prices").slice(0, 90);
  const price = Number(q.get("p")) || undefined;
  const stores = Number(q.get("s")) || undefined;
  const r: RegionId = REGION_IDS.find((x) => x === q.get("r")) ?? "au";
  const R = REGIONS[r];
  const verdict = q.get("v")?.slice(0, 48);
  const category = q.get("c")?.slice(0, 30);
  const product = q.get("n")?.slice(0, 70);
  const rows = parseRows(q.get("d"));
  const [archivoData, interData] = await Promise.all([archivo, inter]);
  const lo = rows[0]?.p;
  const hi = rows.at(-1)?.p;
  // The band only when the gap is worth saying: at least 3% (and a whole unit) between the cheapest and the dearest.
  const save = rows.length > 1 && lo && hi && hi - lo >= Math.max(1, lo * 0.03) ? hi - lo : 0;

  // Left column: what the site is, readable as a thumbnail.
  const kicker = kind === "home" ? undefined : kind === "category" ? "Compare prices" : category;
  const head = kind === "home" ? "Compare prices." : kind === "category" ? (category ?? title) : title;
  const headSize = head.length <= 14 ? (kind === "category" ? 92 : 104) : head.length <= 22 ? 84 : head.length <= 40 ? 64 : 52;
  const sub =
    kind === "home"
      ? stores
        ? `${stores} ${R.adjective} stores, one page.`
        : `Every ${R.adjective} store, one page.`
      : stores
        ? `${stores} ${R.adjective} stores compared`
        : "Real prices, checked daily";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: `linear-gradient(135deg, #6B4DFF 0%, ${VIOLET} 45%, #3A1FC9 100%)`, fontFamily: "Inter", position: "relative" }}>
        {/* soft light behind the panel */}
        <div style={{ display: "flex", position: "absolute", right: -120, top: -160, width: 760, height: 760, borderRadius: 999, background: "rgba(255,255,255,0.10)" }} />

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "50px 0 46px 60px", width: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Mark size={58} />
            <div style={{ display: "flex", fontFamily: "Archivo", fontSize: 36, color: "#fff", letterSpacing: -0.5 }}>
              <span>Compare</span>
              <span style={{ color: "#d8ceff" }}>Empire</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {kicker && (
              <div style={{ display: "flex", alignSelf: "flex-start", background: "#FFD43B", color: INK, fontSize: 26, padding: "8px 18px", borderRadius: 12, textTransform: "uppercase", letterSpacing: 1 }}>{kicker}</div>
            )}
            <div style={{ display: "flex", fontFamily: "Archivo", fontSize: headSize, lineHeight: 1.0, color: "#fff", letterSpacing: -1.5 }}>{head}</div>
            {kind === "product" && price ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, color: "#fff" }}>
                <span style={{ fontSize: 30, opacity: 0.8 }}>from</span>
                <span style={{ fontFamily: "Archivo", fontSize: 76 }}>{money(price, r)}</span>
              </div>
            ) : (
              <div style={{ display: "flex", fontSize: 34, color: "#ece8ff", lineHeight: 1.2 }}>{sub}</div>
            )}
            {kind === "product" && verdict && (
              <div style={{ display: "flex", alignSelf: "flex-start", background: SAVE_SOFT, color: SAVE, fontSize: 26, padding: "8px 18px", borderRadius: 999 }}>{verdict}</div>
            )}
          </div>

          <div style={{ display: "flex", fontSize: 26, color: "#d8ceff" }}>compareempire.com</div>
        </div>

        {/* Right: the comparison panel */}
        <div style={{ display: "flex", position: "relative", width: 600, alignItems: "center", justifyContent: "center", paddingRight: 30 }}>
          <div style={{ display: "flex", flexDirection: "column", width: 500, background: "#fff", borderRadius: 30, padding: 26, gap: 16, boxShadow: "0 30px 70px rgba(20,10,80,0.45)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ display: "flex", width: 150, height: 150, borderRadius: 20, background: "#f3f3f8", alignItems: "center", justifyContent: "center" }}>
                <svg width="64" height="64" viewBox="0 0 24 24"><path d="M3 12l9-9h8v8l-9 9z" fill="none" stroke={VIOLET} strokeWidth="2" /><circle cx="16" cy="8" r="1.6" fill={VIOLET} /></svg>
              </div>
              <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 6 }}>
                <div style={{ display: "flex", fontSize: product && product.length > 34 ? 24 : 28, color: INK, lineHeight: 1.15, maxHeight: 96, overflow: "hidden" }}>{product ?? (kind === "product" ? title : "Same product, every store")}</div>
                <div style={{ display: "flex", fontSize: 20, color: MUTE }}>{rows.length ? "In stock today" : "Cheapest first, checked daily"}</div>
              </div>
            </div>
            {rows.length ? <Rows rows={rows} region={r} /> : <EmptyRows />}
            {save > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, height: 58, borderRadius: 16, background: SAVE, color: "#fff" }}>
                <span style={{ fontFamily: "Archivo", fontSize: 32, whiteSpace: "nowrap" }}>{`Save ${money(Math.floor(save), r)}`}</span>
                <span style={{ fontSize: 22, opacity: 0.9, whiteSpace: "nowrap" }}>vs the dearest store</span>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Archivo", data: archivoData, weight: 900, style: "normal" },
        { name: "Inter", data: interData, weight: 700, style: "normal" },
      ],
      // A card's URL carries everything it draws, so a URL never needs redrawing: the CDN keeps it a week (CE-1, 2026-11-10;
      // a day until then). Browsers still keep a day.
      headers: { "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" },
    },
  );
}
