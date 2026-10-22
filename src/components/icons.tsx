type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24" };

export const SearchIcon = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const HeartIcon = ({ className = "h-5 w-5", filled }: P & { filled?: boolean }) => (
  <svg {...base} fill={filled ? "currentColor" : "none"} className={className}><path d="M19.5 12.6 12 20l-7.5-7.4A4.9 4.9 0 0 1 12 6a4.9 4.9 0 0 1 7.5 6.6Z" /></svg>
);
export const ArrowRight = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const ExternalIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
);
export const SunIcon = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const MoonIcon = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></svg>
);
export const CompareIcon = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><rect x="3" y="4" width="7" height="16" rx="2" /><rect x="14" y="4" width="7" height="16" rx="2" /></svg>
);
export const FlameIcon = ({ className = "h-4 w-4" }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2s1 3.5-1.5 6.2C8.7 10.2 7 11.8 7 14.6A5 5 0 0 0 12 20a5 5 0 0 0 5-5.2c0-2.3-1.2-3.7-2-4.6.2 1.6-.4 2.8-1.4 3.3.5-3.6-1.6-8-1.6-11.5Z" /></svg>
);
export const CheckIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}><path d="m5 12 5 5 9-10" /></svg>
);
export const CloseIcon = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const ShareIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}><path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></svg>
);
export const TrendDown = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}><path d="M3 7l6 6 4-4 8 8M21 11v6h-6" /></svg>
);
export const FilterIcon = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}><path d="M4 6h16M7 12h10M10 18h4" /></svg>
);
export const MenuIcon = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
