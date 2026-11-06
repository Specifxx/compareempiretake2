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
const API = `https://api.awin.com/publishers/${AWIN_PUBLISHER_ID}`;
const MAX_DETAILS = Number(process.env.AWIN_MAX_DETAILS ?? 120);
const token = process.env.AWIN_API_TOKEN?.trim();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
}

if (process.argv[1]?.endsWith("awin-sync.ts")) {
  main().catch((e) => {
    summary(`Awin sync failed, keeping yesterday's list: ${(e as Error).message}`);
  });
}
