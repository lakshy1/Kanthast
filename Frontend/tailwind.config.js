/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Dark mode is driven by <html data-theme="dark">, set from the Appearance
  // setting in App.jsx. 'class' strategy + attribute selector so the in-app
  // toggle wins over the OS preference in both directions.
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["Nunito", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      // ── Semantic color tokens ───────────────────────────────────────────
      // Surfaces/ink resolve per theme via CSS custom properties defined in
      // index.css, so `bg-surface` is correct in light AND dark with no
      // `dark:` variant at the call site.
      colors: {
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          sunken: "rgb(var(--surface-sunken) / <alpha-value>)",
          raised: "rgb(var(--surface-raised) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
          subtle: "rgb(var(--ink-subtle) / <alpha-value>)",
          inverse: "rgb(var(--ink-inverse) / <alpha-value>)",
        },
        line: {
          DEFAULT: "rgb(var(--line) / <alpha-value>)",
          strong: "rgb(var(--line-strong) / <alpha-value>)",
        },
        brand: {
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
          hover: "rgb(var(--brand-hover) / <alpha-value>)",
          soft: "rgb(var(--brand-soft) / <alpha-value>)",
          // Foreground that sits ON brand fill. Near-black: 8.31:1 on cyan-500,
          // where white would be 2.43:1 and fail AA.
          fg: "rgb(var(--brand-fg) / <alpha-value>)",
        },
        positive: {
          DEFAULT: "rgb(var(--positive) / <alpha-value>)",
          soft: "rgb(var(--positive-soft) / <alpha-value>)",
        },
        critical: {
          DEFAULT: "rgb(var(--critical) / <alpha-value>)",
          soft: "rgb(var(--critical-soft) / <alpha-value>)",
        },
        caution: {
          DEFAULT: "rgb(var(--caution) / <alpha-value>)",
          soft: "rgb(var(--caution-soft) / <alpha-value>)",
        },
      },

      // ── Elevation: 5 levels, replacing 61 one-off shadow values ─────────
      boxShadow: {
        e1: "var(--e1)",
        e2: "var(--e2)",
        e3: "var(--e3)",
        e4: "var(--e4)",
        e5: "var(--e5)",
      },

      // ── Radii: 3 roles, replacing 14 mixed values ───────────────────────
      borderRadius: {
        control: "10px",
        card: "16px",
        sheet: "24px",
      },

      // ── Motion: 3 durations + 1 curve ───────────────────────────────────
      transitionTimingFunction: {
        brand: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        fast: "150ms",
        base: "250ms",
        slow: "400ms",
      },

      // Minimum comfortable touch target (WCAG 2.5.5 / Apple HIG).
      spacing: {
        touch: "44px",
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
    },
  },
  plugins: [],
}
