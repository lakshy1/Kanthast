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
        display: ["Plus Jakarta Sans", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      // ── Semantic color tokens ───────────────────────────────────────────
      // Surfaces/ink resolve per theme via CSS custom properties defined in
      // index.css, so `bg-surface` is correct in light AND dark with no
      // `dark:` variant at the call site.
      colors: {
        mint: "#77E0C0",
        midnight: "#0B1220",
        slatenavy: "#111D30",
        hairline: "#2A3A50",
        softwhite: "#F4F7FB",
        coolgrey: "#B6C2D2",
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
        disabled: {
          DEFAULT: "rgb(var(--disabled-bg) / <alpha-value>)",
          fg: "rgb(var(--disabled-fg) / <alpha-value>)",
        },
      },

      // ── Elevation: 5 levels, replacing 61 one-off shadow values ─────────
      boxShadow: {
        e1: "var(--e1)",
        e2: "var(--e2)",
        e3: "var(--e3)",
        e4: "var(--e4)",
        e5: "var(--e5)",
        // Colored glows are accents, not elevation — they read as "this thing
        // is active/branded", so they get their own scale rather than being
        // folded into e1–e5.
        "glow-brand": "var(--glow-brand)",
        "glow-positive": "var(--glow-positive)",
        "glow-caution": "var(--glow-caution)",
      },

      // ── Micro type scale ────────────────────────────────────────────────
      // The product shipped text at 9px and 10px, below any reasonable
      // legibility floor for a study app read for hours. `micro` (11px) is the
      // smallest size allowed; it carries a little tracking so caps and
      // tabular figures stay readable at that size.
      fontSize: {
        micro: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.01em" }], // 11px
        mini: ["0.75rem", { lineHeight: "1.125rem" }],                          // 12px
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

      // ── Opacity scale ───────────────────────────────────────────────────
      // Tailwind's default opacity scale is 0/5/10/20/25/…/100. A modifier
      // off that scale (bg-white/8, text-white/35, bg-slate-950/92) is NOT
      // treated as an arbitrary value — it silently matches no rule and emits
      // nothing, so the element renders with no background/border/color at
      // all. 58 such classes existed across Navbar, SchoolHomepage and others,
      // including the track-switcher dropdown panel, which had no background.
      // Registering the in-use steps makes them real.
      opacity: {
        6: "0.06",
        8: "0.08",
        12: "0.12",
        14: "0.14",
        15: "0.15",
        18: "0.18",
        35: "0.35",
        45: "0.45",
        55: "0.55",
        62: "0.62",
        65: "0.65",
        85: "0.85",
        92: "0.92",
      },

      // Colored glow as a drop-shadow (for SVG/icon glows, where box-shadow
      // does not apply). boxShadow keys do not generate drop-shadow-*.
      dropShadow: {
        "glow-brand": "0 0 8px rgba(34, 211, 238, 0.6)",
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
