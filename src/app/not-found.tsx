import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x grid place-items-center py-32 text-center">
      <div>
        <div className="font-display text-6xl font-extrabold text-brand">404</div>
        <h1 className="mt-3 font-display text-2xl font-bold">We couldn&apos;t find that page</h1>
        <p className="mt-2 text-ink-mute">The phone may have been discontinued by every store we check.</p>
        <Link href="/phones" className="btn-primary mt-6">Browse phones</Link>
      </div>
    </div>
  );
}
