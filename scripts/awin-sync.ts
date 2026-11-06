/**
 * The Awin programmes that have accepted Compare Empire (publisher 3144410) → data/awin/programmes.json, read by
 * src/lib/awin.ts here and copied at build by every sister site (owner, 2026-11-06). Runs in refresh-prices.yml.
 *
 * Awin's publisher API: GET /publishers/{id}/programmes?relationship=joined (name, displayUrl, validDomains,
 * primaryRegion, currencyCode), then /programmedetails per advertiser for `deeplinkEnabled` (a programme without deep
 * links would send every click to its home page, so it is left out). 20 calls a minute per user: one call each 3.2 s.
 *
 * Never fatal: no AWIN_API_TOKEN, an error or an odd answer keeps yesterday's file. Writes only public facts (what
 * every Awin link already carries); never the token.
 */
import { writeFileSync, mkdirSync, appendFileSync } from "node:fs";
import { dirname } from "node:path";
import { AWIN_PUBLISHER_ID, bareHost, type AwinProgramme } from "../src/lib/awin";

const OUT = "data/awin/programmes.json";
const PROMOS_OUT = "data/awin/promotions.json";
const API = `https://api.awin.com/publishers/${AWIN_PUBLISHER_ID}`;
const MAX_DETAILS = Number(process.env.AWIN_MAX_DETAILS ?? 120);
const token = process.env.AWIN_API_TOKEN?.trim();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function post(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`https://api.awin.com/publisher/${AWIN_PUBLISHER_ID}${path}?accessToken=${encodeURIComponent(token!)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Awin ${path}: HTTP ${res.status}`);
  return res.json();
}

async function get(path: string): Promise<unknown> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${API}${path}${sep}accessToken=${encodeURIComponent(token!)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Awin ${path.split("?")[0]}: HTTP ${res.status}`);
  return res.json();
}

interface ApiProgramme {
  id?: number;
  name?: string;
  displayUrl?: string;
  clickThroughUrl?: string;
  currencyCode?: string;
  primaryRegion?: { countryCode?: string };
  validDomains?: { domain?: string }[] | string[];
  status?: string;
}

/** Pure, for the tests: one API programme → our record (null when it has no usable domain). */
export function toProgramme(p: ApiProgramme): AwinProgramme | null {
  if (typeof p.id !== "number" || !p.name) return null;
  const raw = [
    ...(Array.isArray(p.validDomains) ? p.validDomains.map((d) => (typeof d === "string" ? d : d?.domain ?? "")) : []),
    p.displayUrl ?? "",
  ];
  const domains = [...new Set(raw.map(bareHost).filter((d) => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d)))];
  if (!domains.length) return null;
  return {
    id: p.id,
    name: p.name.trim(),
    domains,
    ...(p.primaryRegion?.countryCode ? { region: p.primaryRegion.countryCode } : {}),
    ...(p.currencyCode ? { currency: p.currencyCode } : {}),
  };
}

/** One store offer from Awin's Offers API (POST /publisher/{id}/promotions), as the advertiser wrote it. */
export interface AwinPromotion {
  id: number;
  advertiserId: number;
  type: "promotion" | "voucher";
  title: string;
  /** the advertiser's own description, trimmed to 240 characters */
  description: string;
  /** ISO dates (UTC): never shown before start or after end */
  start: string;
  end: string;
  /** "all" or ISO 3166 country codes ("GB", "AU", "DE") */
  regions: "all" | string[];
  /** the code to type at checkout; only for a voucher Awin gives us (null when we are not a member) */
  code?: string;
}

interface ApiPromotion {
  promotionId?: number;
  type?: string;
  advertiser?: { id?: number; joined?: boolean };
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  regions?: { all?: boolean; list?: { countryCode?: string }[] };
  voucher?: { code?: string | null };
}

const clean = (s: string | undefined, n: number) => (s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
/** Awin writes "2026-11-30T00:00:00.000" in UTC without a zone. */
const utc = (s: string | undefined) => (s && !Number.isNaN(Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`)) ? new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`).toISOString() : null);

/** Pure, for the tests: one API offer → our record, or null when it is not one we can state honestly
 *  (no title, no end date, already over, an advertiser we have not joined, a voucher without its code). */
export function toPromotion(p: ApiPromotion, now = Date.now()): AwinPromotion | null {
  if (typeof p.promotionId !== "number" || typeof p.advertiser?.id !== "number") return null;
  if (p.advertiser.joined === false) return null;
  const type = p.type === "voucher" ? "voucher" : p.type === "promotion" ? "promotion" : null;
  const title = clean(p.title, 120);
  const start = utc(p.startDate);
  const end = utc(p.endDate);
  if (!type || !title || !start || !end || Date.parse(end) <= now) return null;
  const code = type === "voucher" ? clean(p.voucher?.code ?? "", 40) : "";
  if (type === "voucher" && !code) return null;
  const list = [...new Set((p.regions?.list ?? []).map((r) => (r.countryCode ?? "").toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c)))];
  const regions = p.regions?.all ? "all" : list;
  if (regions !== "all" && !regions.length) return null;
  return {
    id: p.promotionId,
    advertiserId: p.advertiser.id,
    type,
    title,
    description: clean(p.description, 240),
    start,
    end,
    regions,
    ...(code ? { code } : {}),
  };
}

/** Every live offer of the programmes that accepted us (membership "joined", status "active"), a few pages at most. */
async function promotions(): Promise<AwinPromotion[]> {
  const out: AwinPromotion[] = [];
  for (let page = 1; page <= 10; page++) {
    await sleep(3200);
    const r = (await post("/promotions", { filters: { membership: "joined", status: "active", type: "all" }, pagination: { page, pageSize: 200 } })) as { data?: ApiPromotion[] } | ApiPromotion[];
    const rows = Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : null;
    if (!rows) throw new Error("Awin /promotions: not a list");
    for (const row of rows) {
      const p = toPromotion(row);
      if (p) out.push(p);
    }
    if (rows.length < 200) break;
  }
  return out.sort((a, b) => a.advertiserId - b.advertiserId || a.end.localeCompare(b.end));
}

function summary(line: string) {
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, line + "\n");
}

async function main() {
  if (!token) {
    summary("Awin: no AWIN_API_TOKEN secret yet, keeping data/awin/programmes.json as it is.");
    return;
  }
  const list = await get("/programmes?relationship=joined");
  if (!Array.isArray(list)) throw new Error("Awin /programmes: not a list");
  const joined = (list as ApiProgramme[]).map(toProgramme).filter((p): p is AwinProgramme => !!p);

  // Deep links: keep a programme unless Awin says outright that it does not allow them.
  const kept: AwinProgramme[] = [];
  for (const [i, p] of joined.entries()) {
    if (i >= MAX_DETAILS) {
      kept.push(p);
      continue;
    }
    await sleep(3200);
    try {
      const d = (await get(`/programmedetails?advertiserId=${p.id}&relationship=joined`)) as { programmeInfo?: { deeplinkEnabled?: boolean } };
      if (d?.programmeInfo?.deeplinkEnabled === false) {
        summary(`Awin: ${p.name} (${p.id}) does not allow deep links, left out.`);
        continue;
      }
    } catch (e) {
      console.warn(`Awin details for ${p.id}: ${(e as Error).message}; kept.`);
    }
    kept.push(p);
  }
  kept.sort((a, b) => a.name.localeCompare(b.name));

  let pending = 0;
  try {
    await sleep(3200);
    const p = await get("/programmes?relationship=pending");
    if (Array.isArray(p)) pending = p.length;
  } catch {}

  mkdirSync(dirname(OUT), { recursive: true });
  // checkedAt says the list is live (RiftCompare's ops monitor warns when it is three days old).
  writeFileSync(OUT, JSON.stringify({ publisherId: AWIN_PUBLISHER_ID, checkedAt: new Date().toISOString(), joined: kept }, null, 2) + "\n");
  summary(`Awin: ${kept.length} joined programmes with deep links, ${pending} applications pending.`);
  for (const p of kept) summary(`- ${p.name} (${p.region ?? "?"}, ${p.domains.join(", ")})`);

  // The joined programmes' live offers and vouchers (owner, 2026-11-06: "promotions … captured in our price
  // comparison"), read by every sister site's build beside the store's row. Its own try: a failure here keeps
  // yesterday's offers file and never the programme list above. Each offer keeps its end date, and sites drop it then.
  try {
    const promos = await promotions();
    writeFileSync(PROMOS_OUT, JSON.stringify({ publisherId: AWIN_PUBLISHER_ID, checkedAt: new Date().toISOString(), promotions: promos }, null, 2) + "\n");
    summary(`Awin: ${promos.length} live offers and vouchers from joined programmes.`);
  } catch (e) {
    summary(`Awin offers not read, keeping yesterday's file: ${(e as Error).message}`);
  }
}

if (process.argv[1]?.endsWith("awin-sync.ts")) {
  main().catch((e) => {
    summary(`Awin sync failed, keeping yesterday's list: ${(e as Error).message}`);
  });
}
