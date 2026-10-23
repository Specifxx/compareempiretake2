"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CloseIcon } from "./icons";

type Tab = "feedback" | "review";
const KINDS = [
  ["idea", "💡 Idea"],
  ["bug", "🐞 Something's broken"],
  ["wrong-price", "💲 Wrong price or match"],
  ["store", "🏬 Add a store"],
  ["other", "💬 Other"],
] as const;

/** Floating "Feedback" button on every page: send feedback or write a review of the site. */
export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("feedback");
  const path = usePathname();

  useEffect(() => {
    const onOpen = (e: Event) => {
      setTab((e as CustomEvent<Tab>).detail ?? "feedback");
      setOpen(true);
    };
    window.addEventListener("ce:feedback", onOpen);
    return () => window.removeEventListener("ce:feedback", onOpen);
  }, []);
  if (path.startsWith("/admin")) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-bg shadow-lift transition hover:scale-[1.03]"
        aria-label="Send feedback or write a review"
      >
        💬 Feedback
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div className="card w-full max-w-md p-5 animate-fade-up" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Feedback">
            <div className="flex items-center justify-between">
              <div className="inline-flex rounded-xl border border-line bg-bg-sunk p-1">
                {(["feedback", "review"] as Tab[]).map((t) => (
                  <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === t ? "bg-bg-card shadow-sm" : "text-ink-mute"}`}>
                    {t === "feedback" ? "Send feedback" : "Write a review"}
                  </button>
                ))}
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close"><CloseIcon /></button>
            </div>
            {tab === "feedback" ? <FeedbackForm page={path} /> : <ReviewForm />}
          </div>
        </div>
      )}
    </>
  );
}

async function post(url: string, body: unknown): Promise<{ ok: boolean; msg?: string }> {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  const j = r ? await r.json().catch(() => ({})) : {};
  return r?.ok && j.ok ? { ok: true } : { ok: false, msg: j.error ?? "Something went wrong. Please try again." };
}

function FeedbackForm({ page }: { page: string }) {
  const [kind, setKind] = useState("idea");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<{ s: "idle" | "busy" | "ok" | "error"; msg?: string }>({ s: "idle" });
  if (state.s === "ok") return <Thanks>Thanks — we read every message. {email && "We'll reply if we need more detail."}</Thanks>;
  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ s: "busy" });
        const r = await post("/api/feedback", { kind, message, email, page, website: hp });
        setState(r.ok ? { s: "ok" } : { s: "error", msg: r.msg });
      }}
    >
      <div className="flex flex-wrap gap-2">
        {KINDS.map(([k, label]) => (
          <button type="button" key={k} onClick={() => setKind(k)} className={`chip text-xs ${kind === k ? "chip-on" : ""}`}>{label}</button>
        ))}
      </div>
      <textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={4000} placeholder="What should we fix, add or change?" className="w-full rounded-xl border border-line bg-bg p-3 text-sm outline-none focus:border-brand" />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional, if you'd like a reply)" className="h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm outline-none focus:border-brand" />
      <input value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state.s === "error" && <p className="text-sm text-hot">{state.msg}</p>}
      <button className="btn-primary w-full" disabled={state.s === "busy"}>{state.s === "busy" ? "Sending…" : "Send feedback"}</button>
    </form>
  );
}

function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<{ s: "idle" | "busy" | "ok" | "error"; msg?: string }>({ s: "idle" });
  if (state.s === "ok") return <Thanks>Thank you! Your review will appear once we&apos;ve checked it isn&apos;t spam — usually within a day.</Thanks>;
  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ s: "busy" });
        const r = await post("/api/reviews", { rating, name, body, email, website: hp });
        setState(r.ok ? { s: "ok" } : { s: "error", msg: r.msg });
      }}
    >
      <div>
        <div className="text-sm font-medium">How was Compare Empire for you?</div>
        <div className="mt-1 flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} onClick={() => setRating(n)} role="radio" aria-checked={rating === n} aria-label={`${n} stars`} className={`text-3xl leading-none transition ${n <= rating ? "text-[#E7A600]" : "text-line hover:text-[#E7A600]/60"}`}>★</button>
          ))}
        </div>
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Your first name (shown with your review)" className="h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm outline-none focus:border-brand" />
      <textarea required value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={2000} placeholder="What did you use it for? Did it save you money? What's missing?" className="w-full rounded-xl border border-line bg-bg p-3 text-sm outline-none focus:border-brand" />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional, never shown)" className="h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm outline-none focus:border-brand" />
      <input value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state.s === "error" && <p className="text-sm text-hot">{state.msg}</p>}
      <button className="btn-primary w-full" disabled={state.s === "busy" || !rating}>{state.s === "busy" ? "Sending…" : "Post review"}</button>
      <p className="text-[11px] text-ink-mute">We publish every genuine review, good or bad. We only remove spam, abuse or personal details.</p>
    </form>
  );
}

function Thanks({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 rounded-xl bg-save-soft p-4 text-sm font-medium text-save">{children}</p>;
}
