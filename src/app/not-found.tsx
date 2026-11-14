import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";

// A friendly dead end (2026-11-14): the same words, then the two ways back a lost visitor needs, search and the
// category list. No new page is linked: /browse and the home page already exist.
export default function NotFound() {
  return (
    <div className="container-x grid place-items-center py-16 text-center sm:py-24">
      <div className="w-full max-w-xl">
        <div className="text-5xl font-bold tracking-tight text-ink-mute sm:text-6xl">404</div>
        <h1 className="page-title mt-3">We couldn&apos;t find that page</h1>
        <p className="mt-2 text-ink-soft">The product may have sold out or been discontinued at every store we check.</p>
        <div className="mt-6 text-left">
          <SearchBox size="lg" />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Link prefetch={false} href="/" className="btn-primary">Go to the home page</Link>
          <Link prefetch={false} href="/browse" className="btn-ghost">Browse every category</Link>
        </div>
      </div>
    </div>
  );
}
