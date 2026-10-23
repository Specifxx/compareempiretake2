import type { Metadata } from "next";
import statusJson from "../../../data/status.json";
import { isAdmin } from "@/lib/admin-auth";
import { categoryById } from "@/lib/categories";
import { dbConfigured, ensureSchema } from "@/lib/db";
import { RETAILERS } from "@/lib/retailers";
import type { RetailerId } from "@/lib/types";

/**
 * Owner dashboard. Unlisted (nothing links here, noindex, not in the sitemap)
 * and behind ADMIN_PASSWORD, because it shows visitors' email addresses.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

type Tab = "overview" | "feedback" | "reviews" | "alerts" | "scrapers";
const TABS: Tab[] = ["overview", "feedback", "reviews", "alerts", "scrapers"];
const status = statusJson as { builtAt: string; scrapes: { category: string; retailer: string; offers: number; scrapedAt: string }[] };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; error?: string }> }) {
  const q = await searchParams;
  if (!process.env.ADMIN_PASSWORD) return <Shell><Note>Set an <code>ADMIN_PASSWORD</code> environment variable in Vercel (Settings → Environment Variables), redeploy, then come back.</Note></Shell>;
  if (!(await isAdmin())) {
    return (
      <Shell>
        <form action="/api/admin/login" method="post" className="card mx-auto max-w-sm p-6">
          <div className="font-display text-xl font-bold">Admin</div>
          <input type="password" name="password" required autoFocus placeholder="Password" className="mt-4 h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm outline-none focus:border-brand" />
          {q.error && <p className="mt-2 text-sm text-hot">Wrong password.</p>}
          <button className="btn-primary mt-4 w-full">Sign in</button>
        </form>
      </Shell>
    );
  }
  const tab: Tab = TABS.includes(q.tab as Tab) ? (q.tab as Tab) : "overview";
  const sql = await ensureSchema().catch(() => null);
  return (
    <Shell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold">Admin</h1>
        <form action="/api/admin/action" method="post">
          <input type="hidden" name="action" value="logout" />
          <button className="btn-ghost py-2 text-xs">Sign out</button>
        </form>
      </div>
      <nav className="mt-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <a key={t} href={`/admin?tab=${t}`} className={`chip capitalize ${t === tab ? "chip-on" : ""}`}>{t}</a>
        ))}
      </nav>
      {!dbConfigured() && tab !== "scrapers" && (
        <Note>No database connected yet. In Vercel → Storage, add a free Neon Postgres database to this project (it sets <code>DATABASE_URL</code>), then redeploy.</Note>
      )}
      <div className="mt-6">
        {tab === "overview" && <Overview sql={sql} />}
        {tab === "feedback" && sql && <Feedback sql={sql} />}
        {tab === "reviews" && sql && <Reviews sql={sql} />}
        {tab === "alerts" && sql && <Alerts sql={sql} />}
        {tab === "scrapers" && <Scrapers />}
      </div>
    </Shell>
  );
}

type Sql = NonNullable<Awaited<ReturnType<typeof ensureSchema>>>;

async function Overview({ sql }: { sql: Sql | null }) {
  const n = async (query: Promise<unknown>) => ((await query) as { n: number }[])[0]?.n ?? 0;
  const stats = sql
    ? {
        newFeedback: await n(sql`SELECT count(*)::int AS n FROM feedback WHERE NOT resolved`),
        pendingReviews: await n(sql`SELECT count(*)::int AS n FROM reviews WHERE status = 'pending'`),
        approvedReviews: await n(sql`SELECT count(*)::int AS n FROM reviews WHERE status = 'approved'`),
        liveAlerts: await n(sql`SELECT count(*)::int AS n FROM alerts WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL`),
        unconfirmedAlerts: await n(sql`SELECT count(*)::int AS n FROM alerts WHERE confirmed_at IS NULL AND unsubscribed_at IS NULL`),
        alertEmails: await n(sql`SELECT count(DISTINCT email)::int AS n FROM alerts WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL`),
        notified7d: await n(sql`SELECT count(*)::int AS n FROM alerts WHERE last_notified_at > now() - interval '7 days'`),
      }
    : null;
  const stale = status.scrapes.filter((s) => Date.now() - Date.parse(s.scrapedAt) > 36 * 3600e3);
  const tiles: [string, string | number, string?][] = [
    ["Unresolved feedback", stats?.newFeedback ?? "—", "feedback"],
    ["Reviews to approve", stats?.pendingReviews ?? "—", "reviews"],
    ["Published reviews", stats?.approvedReviews ?? "—", "reviews"],
    ["Live price alerts", stats?.liveAlerts ?? "—", "alerts"],
    ["Alert subscribers", stats?.alertEmails ?? "—", "alerts"],
    ["Awaiting confirmation", stats?.unconfirmedAlerts ?? "—", "alerts"],
    ["Alerts sent (7 days)", stats?.notified7d ?? "—", "alerts"],
    ["Stale scrapes (>36h)", stale.length, "scrapers"],
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map(([label, value, href]) => (
          <a key={label} href={href ? `/admin?tab=${href}` : undefined} className="card p-4 transition hover:shadow-lift">
            <div className="text-xs text-ink-mute">{label}</div>
            <div className="price mt-1 text-3xl">{value}</div>
          </a>
        ))}
      </div>
      <p className="mt-6 text-sm text-ink-mute">
        Catalogue built {fmt(status.builtAt)} from {status.scrapes.length} store/category scrapes. Traffic is in Vercel → Analytics; search is in Google Search Console.
      </p>
    </>
  );
}

async function Feedback({ sql }: { sql: Sql }) {
  const rows = (await sql`SELECT id, created_at, kind, message, email, page, resolved FROM feedback ORDER BY resolved, created_at DESC LIMIT 300`) as {
    id: number; created_at: string; kind: string; message: string; email: string | null; page: string | null; resolved: boolean;
  }[];
  if (!rows.length) return <Note>No feedback yet.</Note>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id} className={`card p-4 ${r.resolved ? "opacity-50" : ""}`}>
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-mute">
            <span className="chip py-0.5 text-[11px]">{r.kind}</span>
            <span>{fmt(r.created_at)}</span>
            {r.page && <a href={r.page} className="text-brand hover:underline">{r.page}</a>}
            {r.email && <a href={`mailto:${r.email}`} className="text-brand hover:underline">{r.email}</a>}
          </div>
          <p className="mt-2 whitespace-pre-line text-sm">{r.message}</p>
          <Act id={r.id} action="resolve" label={r.resolved ? "Reopen" : "Mark resolved"} />
        </li>
      ))}
    </ul>
  );
}

async function Reviews({ sql }: { sql: Sql }) {
  const rows = (await sql`SELECT id, created_at, name, rating, body, email, status FROM reviews ORDER BY (status = 'pending') DESC, created_at DESC LIMIT 300`) as {
    id: number; created_at: string; name: string; rating: number; body: string; email: string | null; status: string;
  }[];
  return (
    <>
      <Note>
        Approve every genuine review, including negative ones. Australian Consumer Law treats hiding real negative reviews as misleading. Hide only spam,
        abuse, personal details or reviews that aren&apos;t about the site.
      </Note>
      {!rows.length && <Note>No reviews yet.</Note>}
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="card p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-mute">
              <span className={`chip py-0.5 text-[11px] ${r.status === "approved" ? "chip-on" : ""}`}>{r.status}</span>
              <span className="text-[#E7A600]">{"★".repeat(r.rating)}</span>
              <span>{r.name}</span>
              <span>{fmt(r.created_at)}</span>
              {r.email && <span>{r.email}</span>}
            </div>
            <p className="mt-2 whitespace-pre-line text-sm">{r.body}</p>
            <div className="mt-3 flex gap-2">
              {r.status !== "approved" && <Act id={r.id} action="approve" label="Approve" primary />}
              {r.status !== "hidden" && <Act id={r.id} action="hide" label="Hide" />}
              <Act id={r.id} action="delete-review" label="Delete" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

async function Alerts({ sql }: { sql: Sql }) {
  const top = (await sql`SELECT product, product_name, count(*)::int AS n, min(target)::float AS lowest FROM alerts WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL GROUP BY product, product_name ORDER BY n DESC LIMIT 25`) as {
    product: string; product_name: string; n: number; lowest: number;
  }[];
  const recent = (await sql`SELECT created_at, email, product, product_name, variant_label, target::float, price_at_signup::float, confirmed_at, unsubscribed_at, last_notified_at FROM alerts ORDER BY created_at DESC LIMIT 200`) as {
    created_at: string; email: string; product: string; product_name: string; variant_label: string | null; target: number; price_at_signup: number; confirmed_at: string | null; unsubscribed_at: string | null; last_notified_at: string | null;
  }[];
  return (
    <>
      <h2 className="mb-3 font-display text-lg font-bold">Most-watched products</h2>
      {top.length ? (
        <ul className="card divide-y divide-line">
          {top.map((t) => (
            <li key={t.product} className="flex justify-between px-4 py-2.5 text-sm">
              <a href={t.product} className="hover:text-brand">{t.product_name}</a>
              <span className="text-ink-mute">{t.n} watching · lowest target ${t.lowest.toLocaleString("en-AU")}</span>
            </li>
          ))}
        </ul>
      ) : (
        <Note>No live alerts yet.</Note>
      )}
      <h2 className="mb-3 mt-8 font-display text-lg font-bold">Latest sign-ups</h2>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs text-ink-mute">
            <tr>{["When", "Email", "Product", "Target", "Price then", "Status"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {recent.map((r, i) => (
              <tr key={i} className="border-t border-line">
                <td className="px-3 py-2">{fmt(r.created_at)}</td>
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2"><a href={r.product} className="hover:text-brand">{r.product_name}{r.variant_label ? ` · ${r.variant_label}` : ""}</a></td>
                <td className="px-3 py-2">${r.target.toLocaleString("en-AU")}</td>
                <td className="px-3 py-2">${r.price_at_signup.toLocaleString("en-AU")}</td>
                <td className="px-3 py-2">{r.unsubscribed_at ? "Unsubscribed" : r.last_notified_at ? `Emailed ${fmt(r.last_notified_at)}` : r.confirmed_at ? "Live" : "Unconfirmed"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Scrapers() {
  const rows = [...status.scrapes].sort((a, b) => a.scrapedAt.localeCompare(b.scrapedAt));
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="text-left text-xs text-ink-mute">
          <tr>{["Category", "Store", "Listings", "Last scraped"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const hours = (Date.parse(status.builtAt) - Date.parse(r.scrapedAt)) / 3600e3;
            return (
              <tr key={`${r.category}/${r.retailer}`} className="border-t border-line">
                <td className="px-3 py-2">{categoryById(r.category)?.name ?? r.category}</td>
                <td className="px-3 py-2">{RETAILERS[r.retailer as RetailerId]?.name ?? r.retailer}</td>
                <td className="px-3 py-2 tabular-nums">{r.offers}</td>
                <td className={`px-3 py-2 ${hours > 36 ? "font-semibold text-hot" : ""}`}>{fmt(r.scrapedAt)}{hours > 36 ? ` · ${Math.round(hours / 24)}d old` : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Act({ id, action, label, primary }: { id: number; action: string; label: string; primary?: boolean }) {
  return (
    <form action="/api/admin/action" method="post" className="mt-3 inline-block">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={action} />
      <button className={primary ? "btn-primary py-1.5 text-xs" : "btn-ghost py-1.5 text-xs"}>{label}</button>
    </form>
  );
}

const Shell = ({ children }: { children: React.ReactNode }) => <div className="container-x max-w-5xl py-10">{children}</div>;
const Note = ({ children }: { children: React.ReactNode }) => <div className="mt-4 rounded-xl bg-bg-sunk p-4 text-sm text-ink-soft">{children}</div>;
const fmt = (d: string) => new Date(d).toLocaleString("en-AU", { timeZone: "Australia/Sydney", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
