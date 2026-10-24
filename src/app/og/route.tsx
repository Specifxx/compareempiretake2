import { money, REGIONS } from "@/lib/region";
import { ImageResponse } from "next/og";

/**
 * Link-preview card (1200×630) for products, categories and deals. Everything
 * it shows comes in the query string, so it renders on the edge without
 * loading the catalogue, and the CDN caches each card.
 *   /og?t=Title&p=1799&s=12&v=Lowest+price+we've+recorded&i=<image url>&c=Phones
 */
export const runtime = "edge";

export function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const title = (q.get("t") ?? "Compare Empire").slice(0, 90);
  const price = q.get("p");
  const stores = q.get("s");
  const r = q.get("r") === "us" ? "us" : q.get("r") === "uk" ? "uk" : "au";
  const R = REGIONS[r];
  const verdict = q.get("v")?.slice(0, 60);
  const category = q.get("c")?.slice(0, 30);
  const image = q.get("i");
  const safeImage = image && /^https:\/\/[^\s"]+$/.test(image) ? image : undefined;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(135deg,#f6f4ff 0%,#ffffff 60%)", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 0 56px 64px", width: safeImage ? 700 : 1200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="56" height="56" viewBox="0 0 64 64">
              <rect width="64" height="64" rx="16" fill="#5B3DF5" />
              <path d="M14 43V22l9 8 9-12 9 12 9-8v21z" fill="#fff" />
              <rect x="14" y="46.5" width="36" height="5" rx="2.5" fill="#fff" opacity=".65" />
            </svg>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: "#11111a" }}>
              <span>Compare</span>
              <span style={{ color: "#5B3DF5" }}>Empire</span>
            </div>
            {category && <div style={{ display: "flex", marginLeft: 12, fontSize: 22, color: "#707084" }}>{`· ${category}`}</div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: title.length > 50 ? 48 : 60, fontWeight: 800, color: "#11111a", lineHeight: 1.08 }}>{title}</div>
            {price && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
                <div style={{ fontSize: 26, color: "#707084" }}>from</div>
                <div style={{ display: "flex", fontSize: 84, fontWeight: 800, color: "#11111a" }}>{money(Number(price), r)}</div>
              </div>
            )}
            {verdict && (
              <div style={{ display: "flex", alignSelf: "flex-start", background: "#def7ec", color: "#069462", fontSize: 28, fontWeight: 700, padding: "10px 20px", borderRadius: 999 }}>{verdict}</div>
            )}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#404052" }}>
            {stores ? `Compared across ${stores} ${R.adjective} stores · price history included` : "Every price, every store, every day — with the history to spot fake sales"}
          </div>
        </div>
        {safeImage && (
          <div style={{ display: "flex", width: 500, alignItems: "center", justifyContent: "center", padding: 40 }}>
            <img src={safeImage} alt="" width={420} height={420} style={{ objectFit: "contain" }} />
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630, headers: { "cache-control": "public, max-age=86400, s-maxage=86400" } },
  );
}
