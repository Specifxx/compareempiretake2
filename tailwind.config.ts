import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "rgb(var(--ink) / <alpha-value>)", soft: "rgb(var(--ink-soft) / <alpha-value>)", mute: "rgb(var(--ink-mute) / <alpha-value>)" },
        bg: { DEFAULT: "rgb(var(--bg) / <alpha-value>)", card: "rgb(var(--card) / <alpha-value>)", sunk: "rgb(var(--sunk) / <alpha-value>)" },
        line: "rgb(var(--line) / <alpha-value>)",
        brand: { DEFAULT: "rgb(var(--brand) / <alpha-value>)", soft: "rgb(var(--brand-soft) / <alpha-value>)", ink: "rgb(var(--brand-ink) / <alpha-value>)" },
        save: { DEFAULT: "rgb(var(--save) / <alpha-value>)", soft: "rgb(var(--save-soft) / <alpha-value>)" },
        hot: "rgb(var(--hot) / <alpha-value>)",
      },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"], display: ["var(--font-display)", "var(--font-sans)", "sans-serif"] },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px -4px rgb(0 0 0 / 0.06)",
        lift: "0 2px 4px rgb(0 0 0 / 0.04), 0 16px 40px -12px rgb(0 0 0 / 0.18)",
      },
      keyframes: { "fade-up": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } } },
      animation: { "fade-up": "fade-up .35s ease-out both" },
    },
  },
  plugins: [],
} satisfies Config;
