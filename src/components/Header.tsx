"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { HeartIcon, MenuIcon, MoonIcon, SearchIcon, SunIcon, CloseIcon } from "./icons";
import { SearchPalette } from "./SearchPalette";
import { SearchBox } from "./SearchBox";
import { saved } from "@/lib/store";
import { HOME_PATH, isNeutralPath, REGIONS, withRegion, type RegionId } from "@/lib/region";
import { rememberRegion, useRegion } from "@/lib/use-region";
import { Flag } from "./Flag";
import { CartHeaderLink } from "./cart/CartHeaderLink";

const AU_NAV = [
  { href: "/deals", label: "Deals" },
  { href: "/brands", label: "Brands" },
  { href: "/compare", label: "Compare" },
  { href: "/guides", label: "Guides" },
  { href: "/reviews", label: "Reviews" },
];
const navFor = (region: RegionId) =>
  region === "au" ? AU_NAV : [{ href: withRegion("/deals", region), label: "Deals" }, { href: withRegion("/stores", region), label: "Stores" }, { href: "/reviews", label: "Reviews" }];

export interface NavDepartment {
  name: string;
  categories: { name: string; href: string; emoji: string; count: number; featured: boolean; brands: { name: string; href: string }[] }[];
}

/** `sale`: Black Friday or Cyber Monday while the strip shows (lib/black-friday.ts saleStrip, decided by the layout): the nav's first link. */
export function Header({ nav, regions, sale = null }: { nav: Partial<Record<RegionId, NavDepartment[]>>; regions: RegionId[]; sale?: { path: string; name: string } | null }) {
  const region = useRegion();
  const departments = nav[region] ?? nav.au ?? [];
  const NAV = [...(sale ? [{ href: withRegion(sale.path, region), label: sale.name }] : []), ...navFor(region)];
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [mega, setMega] = useState(false);
  const flat = departments.flatMap((d) => d.categories);
  const path = usePathname();
  const savedList = saved.use();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /input|textarea|select/i.test((e.target as HTMLElement)?.tagName);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        // Desktop has the inline box; small screens use the full-screen palette.
        if (window.matchMedia("(min-width: 768px)").matches) window.dispatchEvent(new Event("ce:focus-search"));
        else setOpen(true);
      }
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && (setMega(false), setMenu(false));
    window.addEventListener("keydown", onKey);
    window.addEventListener("keydown", onEsc);
    const openSearch = () => setOpen(true);
    window.addEventListener("ce:search", openSearch);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keydown", onEsc);
      window.removeEventListener("ce:search", openSearch);
    };
  }, []);
  useEffect(() => {
    setMenu(false);
    setMega(false);
  }, [path]);

  return (
    <>
      {/* One white bar like a big comparison site's (owner, 2026-11-10): logo, a wide search in the middle, the
          visitor's lists and country on the right; the aisles below it. On a phone the search is its own row. */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg-card">
        <div className="container-x flex h-16 items-center gap-1.5 sm:gap-3">
          <Logo wordmark="hidden min-[480px]:inline" />
          <div className="mx-auto hidden max-w-2xl flex-1 px-4 md:block">
            <SearchBox />
          </div>
          <div className="ml-auto flex items-center gap-0.5 md:ml-0">
            <Link prefetch={false} href="/saved" className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-bg-sunk hover:text-ink" aria-label="Saved">
              <HeartIcon />
              {savedList.length > 0 && (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-hot px-1 text-[10px] font-bold text-white">{savedList.length}</span>
              )}
            </Link>
            {/* The cart list (components/cart, owner 2026-11-06): every width, with its count. */}
            <CartHeaderLink className="shrink-0 text-ink-soft hover:text-ink" />
            {regions.length > 1 && <RegionSwitcher regions={regions} nav={nav} />}
            <ThemeToggle />
            <button className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-bg-sunk md:hidden" onClick={() => setMenu((m) => !m)} aria-label="Menu">
              {menu ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
        {/* Phones: the search box is always in sight, under the logo. */}
        <div className="container-x pb-2.5 md:hidden">
          <button onClick={() => setOpen(true)} className="flex h-11 w-full items-center gap-2 rounded-lg border border-line bg-bg-sunk px-3 text-left text-sm text-ink-mute" aria-label="Search">
            <SearchIcon className="h-4 w-4 shrink-0" /> <span className="truncate">Search phones, TVs, laptops…</span>
          </button>
        </div>
        {/* Category bar: every department behind "All categories", the most visited aisles beside it. */}
        <div className="hidden border-t border-line/70 md:block">
          <nav className="container-x flex h-11 items-center gap-0.5 overflow-x-auto text-sm scrollbar-none" aria-label="Categories">
            <button
              onClick={() => setMega((m) => !m)}
              onMouseEnter={() => window.matchMedia("(hover: hover)").matches && setMega(true)}
              aria-expanded={mega}
              aria-controls="mega-menu"
              className={`mr-1 inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 font-semibold transition ${mega ? "bg-ink text-bg-card" : "text-ink hover:bg-bg-sunk"}`}
            >
              <MenuIcon className="h-4 w-4" /> All categories
            </button>
            {/* Deals (or Black Friday while it runs) next to the menu, so a narrow screen never scrolls it out of sight. */}
            <Link prefetch={false} href={NAV[0].href} className="shrink-0 rounded-md px-2.5 py-1.5 font-semibold text-hot transition hover:bg-hot/10">{NAV[0].label}</Link>
            {flat.filter((c) => c.featured).map((c) => (
              <Link prefetch={false}
                key={c.href}
                href={c.href}
                className={`shrink-0 rounded-md px-2.5 py-1.5 font-medium transition ${path === c.href || path.startsWith(c.href + "/") ? "text-brand underline decoration-2 underline-offset-[14px]" : "text-ink-soft hover:text-ink"}`}
              >
                {c.name}
              </Link>
            ))}
            <span className="mx-2 h-5 w-px shrink-0 bg-line" />
            {NAV.slice(1).map((n) => (
              <Link prefetch={false} key={n.href} href={n.href} className="shrink-0 rounded-md px-2.5 py-1.5 font-medium text-ink-soft transition hover:text-ink">{n.label}</Link>
            ))}
          </nav>
        </div>
        {/* Always rendered (hidden until opened) so every department, category and brand link is in the server HTML. */}
        {(
          <div id="mega-menu" className={`absolute inset-x-0 top-full ${mega ? "hidden md:block" : "hidden"}`} onMouseLeave={() => setMega(false)}>
            <div className="container-x">
              <div className="card mt-2 grid max-h-[75vh] gap-x-8 gap-y-6 overflow-y-auto p-6 shadow-lift animate-fade-up md:grid-cols-3 lg:grid-cols-4">
                {departments.map((d) => (
                  <div key={d.name}>
                    <div className="eyebrow mb-3">{d.name}</div>
                    <ul className="space-y-3">
                      {d.categories.map((c) => (
                        <li key={c.href}>
                          <Link prefetch={false} href={c.href} aria-current={path === c.href || path.startsWith(c.href + "/") ? "page" : undefined} className={`group flex items-center gap-2 font-semibold hover:text-brand ${path === c.href || path.startsWith(c.href + "/") ? "text-brand" : ""}`}>
                            {c.name}
                            <span className="text-xs font-normal text-ink-mute">{c.count.toLocaleString()}</span>
                          </Link>
                          {c.brands.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 pl-7 text-xs text-ink-mute">
                              {c.brands.slice(0, 4).map((b) => (
                                <Link prefetch={false} key={b.href} href={b.href} className="hover:text-brand">{b.name}</Link>
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {menu && (
          <nav className="container-x max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain pb-6 md:hidden" aria-label="Menu">
            <button onClick={() => { setMenu(false); setOpen(true); }} className="mb-2 mt-1 flex h-11 w-full items-center gap-2 rounded-xl border border-line bg-bg-card px-3 text-left text-sm text-ink-mute">
              <SearchIcon className="h-4 w-4 shrink-0" /> Search products…
            </button>
            {departments.map((d) => (
              <div key={d.name} className="border-t border-line py-3 first:border-0">
                <div className="eyebrow mb-1 px-3">{d.name}</div>
                {d.categories.map((c) => (
                  <Link prefetch={false} key={c.href} href={c.href} onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium hover:bg-bg-sunk">
                    {c.name} <span className="ml-auto text-xs text-ink-mute">{c.count}</span>
                  </Link>
                ))}
              </div>
            ))}
            <div className="border-t border-line pt-3">
              <Link prefetch={false} href={region === "au" ? "/categories" : withRegion("/browse", region)} onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2.5 text-base font-medium hover:bg-bg-sunk">All categories A to Z</Link>
              {NAV.map((n) => (
                <Link prefetch={false} key={n.href} href={n.href} onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2.5 text-base font-medium hover:bg-bg-sunk">{n.label}</Link>
              ))}
              <Link prefetch={false} href="/forum" onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2.5 text-base font-medium hover:bg-bg-sunk">Community forum</Link>
              <Link prefetch={false} href="/about" onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2.5 text-base font-medium hover:bg-bg-sunk">About</Link>
            </div>
          </nav>
        )}
      </header>
      <SearchPalette open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const flip = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("ce-theme", next ? "dark" : "light");
    } catch {}
  };
  return (
    <button onClick={flip} className="hidden h-10 w-10 place-items-center rounded-lg text-ink-soft hover:bg-bg-sunk hover:text-ink sm:grid" aria-label="Toggle dark mode">
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

/** Flag button that switches country, staying on the same category when the other country has it. */
function RegionSwitcher({ regions, nav }: { regions: RegionId[]; nav: Partial<Record<RegionId, NavDepartment[]>> }) {
  const region = useRegion();
  const path = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const target = (to: RegionId) => {
    if (isNeutralPath(path)) return path;
    const rest = path === HOME_PATH[region] ? "/" : region === "au" ? path : path.slice(REGIONS[region].prefix.length) || "/";
    const cat = rest.split("/")[1];
    const has = (nav[to] ?? []).some((d) => d.categories.some((c) => c.href === withRegion(`/${cat}`, to)));
    if (cat === "deals") return withRegion("/deals", to);
    return has ? withRegion(`/${cat}`, to) : withRegion("/", to);
  };
  const remember = rememberRegion;
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={`Country: ${REGIONS[region].name}`} className="flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-ink-soft hover:bg-bg-sunk hover:text-ink">
        <Flag code={region} className="text-lg" />
        <span className="hidden sm:inline">{region.toUpperCase()}</span>
      </button>
      {open && (
        <div className="card absolute right-0 top-full z-50 mt-2 w-56 p-1.5 shadow-lift animate-fade-up">
          {regions.map((r) => (
            <Link prefetch={false} key={r} href={target(r)} onClick={() => remember(r)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-bg-sunk ${r === region ? "font-semibold text-brand" : ""}`}>
              <Flag code={r} className="text-lg" />
              <span>{REGIONS[r].name}</span>
              <span className="ml-auto text-xs text-ink-mute">{REGIONS[r].currency}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
