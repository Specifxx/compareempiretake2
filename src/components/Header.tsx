"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { HeartIcon, MenuIcon, MoonIcon, SearchIcon, SunIcon, CloseIcon } from "./icons";
import { SearchPalette } from "./SearchPalette";
import { SearchBox } from "./SearchBox";
import { saved } from "@/lib/store";
import { REGIONS, withRegion, type RegionId } from "@/lib/region";
import { useRegion } from "@/lib/use-region";

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

export function Header({ nav, regions }: { nav: Partial<Record<RegionId, NavDepartment[]>>; regions: RegionId[] }) {
  const region = useRegion();
  const departments = nav[region] ?? nav.au ?? [];
  const NAV = navFor(region);
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
    window.addEventListener("keydown", onKey);
    const openSearch = () => setOpen(true);
    window.addEventListener("ce:search", openSearch);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("ce:search", openSearch);
    };
  }, []);
  useEffect(() => {
    setMenu(false);
    setMega(false);
  }, [path]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
        <div className="container-x flex h-16 items-center gap-1.5 sm:gap-4">
          <Logo />
          <button
            onClick={() => setMega((m) => !m)}
            aria-expanded={mega}
            className={`ml-2 hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition md:inline-flex ${mega ? "bg-brand text-white" : "bg-bg-sunk text-ink hover:bg-brand-soft hover:text-brand"}`}
          >
            <MenuIcon className="h-4 w-4" /> All categories
          </button>
          <nav className="hidden items-center gap-1 xl:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${path.startsWith(n.href) ? "bg-bg-sunk text-ink" : "text-ink-soft hover:text-ink"}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto hidden max-w-sm flex-1 md:block">
            <SearchBox />
          </div>
          <button onClick={() => setOpen(true)} className="ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-bg-card text-sm text-ink-mute shadow-sm sm:flex sm:w-auto sm:min-w-0 sm:flex-1 sm:items-center sm:gap-2 sm:px-3 md:hidden" aria-label="Search">
            <SearchIcon className="h-4 w-4 shrink-0" /> <span className="hidden truncate sm:inline">Search products…</span>
          </button>
          <Link href="/saved" className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-soft hover:bg-bg-sunk hover:text-ink" aria-label="Saved">
            <HeartIcon />
            {savedList.length > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-hot px-1 text-[10px] font-bold text-white">{savedList.length}</span>
            )}
          </Link>
          {regions.length > 1 && <RegionSwitcher regions={regions} nav={nav} />}
          <ThemeToggle />
          <button className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-soft hover:bg-bg-sunk md:hidden" onClick={() => setMenu((m) => !m)} aria-label="Menu">
            {menu ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
        {/* Category bar: every live category one click away, like a department store's aisles. */}
        <div className="hidden border-t border-line/60 md:block">
          <nav className="container-x flex h-11 items-center gap-1 overflow-x-auto text-sm scrollbar-none" aria-label="Categories">
            {flat.filter((c) => c.featured).map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className={`shrink-0 rounded-lg px-3 py-1.5 font-medium transition ${path === c.href || path.startsWith(c.href + "/") ? "bg-brand-soft text-brand" : "text-ink-soft hover:bg-bg-sunk hover:text-ink"}`}
              >
                <span className="mr-1.5">{c.emoji}</span>
                {c.name}
              </Link>
            ))}
            {flat.some((c) => !c.featured) && (
              <button onClick={() => setMega((m) => !m)} className="shrink-0 rounded-lg px-3 py-1.5 font-medium text-ink-soft transition hover:bg-bg-sunk hover:text-ink">
                More ▾
              </button>
            )}
            <span className="mx-2 h-5 w-px shrink-0 bg-line" />
            <Link href={NAV[0].href} className={`shrink-0 rounded-lg px-3 py-1.5 font-semibold transition ${path.startsWith(NAV[0].href) ? "bg-hot/10 text-hot" : "text-hot hover:bg-hot/10"}`}>🔥 Deals</Link>
            {NAV.slice(1).map((n) => (
              <Link key={n.href} href={n.href} className="shrink-0 rounded-lg px-3 py-1.5 font-medium text-ink-soft transition hover:bg-bg-sunk hover:text-ink xl:hidden">{n.label}</Link>
            ))}
          </nav>
        </div>
        {mega && (
          <div className="absolute inset-x-0 top-full hidden md:block" onMouseLeave={() => setMega(false)}>
            <div className="container-x">
              <div className="card mt-2 grid max-h-[75vh] gap-x-8 gap-y-6 overflow-y-auto p-6 shadow-lift animate-fade-up md:grid-cols-3 lg:grid-cols-4">
                {departments.map((d) => (
                  <div key={d.name}>
                    <div className="eyebrow mb-3">{d.name}</div>
                    <ul className="space-y-3">
                      {d.categories.map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} className="group flex items-center gap-2 font-semibold hover:text-brand">
                            <span className="text-lg">{c.emoji}</span> {c.name}
                            <span className="text-xs font-normal text-ink-mute">{c.count.toLocaleString()}</span>
                          </Link>
                          {c.brands.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 pl-7 text-xs text-ink-mute">
                              {c.brands.slice(0, 4).map((b) => (
                                <Link key={b.href} href={b.href} className="hover:text-brand">{b.name}</Link>
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
          <nav className="container-x max-h-[75vh] overflow-y-auto pb-4 md:hidden">
            {departments.map((d) => (
              <div key={d.name} className="border-t border-line py-3 first:border-0">
                <div className="eyebrow mb-1 px-3">{d.name}</div>
                {d.categories.map((c) => (
                  <Link key={c.href} href={c.href} onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium hover:bg-bg-sunk">
                    <span>{c.emoji}</span> {c.name} <span className="ml-auto text-xs text-ink-mute">{c.count}</span>
                  </Link>
                ))}
              </div>
            ))}
            <div className="border-t border-line pt-3">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2.5 text-base font-medium hover:bg-bg-sunk">{n.label}</Link>
              ))}
              <Link href="/forum" onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2.5 text-base font-medium hover:bg-bg-sunk">Community forum</Link>
              <Link href="/about" onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2.5 text-base font-medium hover:bg-bg-sunk">About</Link>
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
    <button onClick={flip} className="hidden h-10 w-10 place-items-center rounded-xl text-ink-soft hover:bg-bg-sunk hover:text-ink sm:grid" aria-label="Toggle dark mode">
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
    const rest = region === "au" ? path : path.slice(REGIONS[region].prefix.length) || "/";
    const cat = rest.split("/")[1];
    const has = (nav[to] ?? []).some((d) => d.categories.some((c) => c.href === withRegion(`/${cat}`, to)));
    if (cat === "deals") return withRegion("/deals", to);
    return has ? withRegion(`/${cat}`, to) : withRegion("/", to);
  };
  const remember = (r: RegionId) => {
    try {
      localStorage.setItem("ce-region", r);
    } catch {}
  };
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={`Country: ${REGIONS[region].name}`} className="flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-ink-soft hover:bg-bg-sunk hover:text-ink">
        <span className="text-lg leading-none">{REGIONS[region].flag}</span>
        <span className="hidden sm:inline">{region.toUpperCase()}</span>
      </button>
      {open && (
        <div className="card absolute right-0 top-full z-50 mt-2 w-56 p-1.5 shadow-lift animate-fade-up">
          {regions.map((r) => (
            <Link key={r} href={target(r)} onClick={() => remember(r)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-bg-sunk ${r === region ? "font-semibold text-brand" : ""}`}>
              <span className="text-lg leading-none">{REGIONS[r].flag}</span>
              <span>{REGIONS[r].name}</span>
              <span className="ml-auto text-xs text-ink-mute">{REGIONS[r].currency}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
