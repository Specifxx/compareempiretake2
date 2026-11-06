import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x grid place-items-center py-32 text-center">
      <div>
        <div className="font-display text-6xl font-extrabold text-brand">404</div>
        <h1 className="mt-3 font-display text-2xl font-bold">We couldn&apos;t find that page</h1>
        <p className="mt-2 text-ink-mute">The product may have sold out or been discontinued at every store we check.</p>
        <Link prefetch={false} href="/" className="btn-primary mt-6">Go to the home page</Link>
      </div>
    </div>
  );
}
