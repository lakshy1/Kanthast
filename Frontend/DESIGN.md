---
name: Kanthast
description: Short animated medical lectures organised subject by subject, with resume and progress.
colors:
  stage-navy: "#0B1638"
  stage-deep: "#0A1330"
  stage-night: "#060B1C"
  stage-dusk: "#1A2650"
  stage-mist: "#CFD8EA"
  brand: "#1E3A8A"
  brand-hover: "#172554"
  brand-soft: "#EEF2FF"
  brand-fg: "#FFFFFF"
  school-accent-on-navy: "#FCD34D"
  surface: "#FFFFFF"
  surface-sunken: "#F8FAFC"
  surface-raised: "#FFFFFF"
  ink: "#0F172A"
  ink-muted: "#475569"
  ink-subtle: "#64748B"
  ink-inverse: "#F8FAFC"
  line: "#E2E8F0"
  line-strong: "#CBD5E1"
  positive: "#059669"
  positive-soft: "#ECFDF5"
  critical: "#BE183C"
  critical-soft: "#FFF1F2"
  caution: "#B45309"
  caution-soft: "#FFFBEB"
  disabled-bg: "#E2E8F0"
  disabled-fg: "#64748B"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem (sm 3.75rem, lg 4.5rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  display-sub:
    fontFamily: "Bricolage Grotesque, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem (sm 1.875rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  headline:
    fontFamily: "Bricolage Grotesque, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem (md 3rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Bricolage Grotesque, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem to 1.875rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  figure:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  body-lead:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
  mini:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.125rem
  micro:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1rem
    letterSpacing: "0.01em"
rounded:
  control: "10px"
  card: "16px"
  sheet: "24px"
  pill: "9999px"
spacing:
  touch: "44px"
  gutter-mobile: "24px"
  gutter-desktop: "64px"
  card-pad: "32px"
  section-y: "80px"
  section-y-md: "112px"
  container: "1280px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.brand-fg}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
    height: "{spacing.touch}"
  button-primary-hover:
    backgroundColor: "{colors.brand-hover}"
    textColor: "{colors.brand-fg}"
  button-primary-disabled:
    backgroundColor: "{colors.disabled-bg}"
    textColor: "{colors.disabled-fg}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
    height: "{spacing.touch}"
  button-secondary-hover:
    backgroundColor: "{colors.surface-sunken}"
  button-ghost:
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
    height: "{spacing.touch}"
  button-ghost-hover:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.critical}"
    textColor: "#FFFFFF"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-on-stage:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.stage-navy}"
    rounded: "{rounded.control}"
    padding: "12px 28px"
    height: "{spacing.touch}"
  button-on-stage-hover:
    backgroundColor: "#F1F5F9"
    textColor: "{colors.stage-navy}"
  button-outline-on-stage:
    textColor: "#FFFFFF"
    rounded: "{rounded.control}"
    padding: "12px 28px"
    height: "{spacing.touch}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "{spacing.touch}"
  field-error:
    backgroundColor: "{colors.critical-soft}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-pad}"
  chip-brand:
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.brand}"
    typography: "{typography.mini}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  browser-frame:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
  browser-frame-bar:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.ink-subtle}"
    typography: "{typography.micro}"
    padding: "10px 16px"
---

# Design System: Kanthast

## Overview

**Creative North Star: "The Lit Study Desk"**

Kanthast is a calm, exam-serious study tool shown under a single desk lamp: a deep navy stage, lit by soft white light that opens to white toward its lower edge, holds the real product, and plain white and slate grounds hold everything a student reads closely (syllabus, prices, answers). One navy-blue accent marks what can be acted on. Nothing is decorative; the product screens themselves are the imagery, fed by the real syllabus, framed in a thin browser chrome and lifted on the deepest ambient shadow.

Density is generous on marketing surfaces (80 to 112px section rhythm, a 5/7 split on a 12-column grid) and compact inside the app, where lists of chapters and lectures run as divided rows. Headings (h1 to h3) are set in Bricolage Grotesque, bold and tightly tracked; Inter carries body text, controls, labels and numbers. Colour is semantic: every surface, ink and line resolves through RGB-triplet custom properties, so one class works in light, dark and system themes without a `dark:` variant. Light is the default appearance.

Medical and School are one brand. A track is told apart by its accent only (amber marks School), never by a second typeface, palette or layout language.

**Key Characteristics:**
- A lit navy stage for hero, product tour, closing call, navbar and footer; white and slate-50 grounds for reading sections.
- Real product screens in browser frames as the only imagery; no illustration, stock or AI art.
- Bricolage Grotesque for headings, Inter for everything else, tabular figures for every number.
- One navy-blue accent with white text on its fills in light; it lifts to pale blue with near-black text in dark.
- White pills with navy ink are the primary action on the stage.
- Five ambient elevation steps; colored glows exist only as active-state accents.
- Three radius roles (10 / 16 / 24px) plus pills.
- 44px touch floor on every control; visible brand focus ring everywhere.

## Colors

A cool slate neutral field with one navy-blue accent, staged on lit deep navy.

### Primary
- **Study Navy** (`brand`): the only action colour on paper grounds. Primary button fills, the active chapter in a list, progress bars, the selected playback speed, the highlighted pricing card border, `brand-soft` chips, the global focus ring. In dark themes it lifts to pale blue (rgb 147 197 253) so it holds contrast (10.1:1) on dark grounds.
- **Midnight Navy** (`brand-hover`): hover state of brand fills only; in dark it lightens to rgb 191 219 254.
- **Navy Wash** (`brand-soft`): background of brand chips ("Best value", "Resumed from 3:12") and the active row in a jump list; in dark it becomes a deep navy (rgb 23 37 84).
- **On Brand** (`brand-fg`): the text on every brand fill. White in light (10.4:1 on Study Navy); near-black (rgb 2 6 23) in dark, where the fill is pale.

### Secondary
- **School Amber** (`school-accent-on-navy`): the School track's accent, seen in the navbar track label. It is the only visual difference a School surface may carry. It has no semantic token yet.

### Neutral
- **The Stage** (`stage-navy`, `stage-night`, `stage-dusk`, `stage-mist`, `stage-deep`): the brand stage, fixed in both themes and applied only through four named backgrounds:
  - **Lit stage** (hero): Stage Navy under a 172deg run from Stage Night through Stage Navy and Stage Dusk to Stage Mist, lit by a soft white radial at the top right, a faint slate radial at the top left, and a broad white radial rising from below, so the band opens to white light at its foot.
  - **Deep stage** (product tour, closing call): Stage Deep under a 180deg run from Stage Navy to Stage Night with two faint light radials; no white foot, so white text stays crisp end to end.
  - **Bar** (navbar): a 90deg run from Stage Night through Stage Navy to a lifted navy (#16224A).
  - **Footer**: Stage Night under a 160deg run from Stage Navy, with one faint white radial at the top right.
  Text on the stage is white, with white at 70% for supporting lines and slate-200 / slate-300 for the hero sub-line and lead. Text sits in the dark upper region (white on Stage Navy is 16:1).
- **Paper** (`surface`) and **Slate Paper** (`surface-sunken`): reading grounds. Sections alternate between them (syllabus and FAQ on `surface`, pricing on `surface-sunken`); `surface-sunken` also fills the inside of product screens and browser bars.
- **Raised** (`surface-raised`): menus and sheets above a surface; identical to `surface` in light, one step lighter in dark.
- **Ink** (`ink`), **Muted Ink** (`ink-muted`), **Subtle Ink** (`ink-subtle`): headings and strong text, body and descriptions, metadata and placeholders. `ink-subtle` is the lightest grey allowed for text (4.76:1 on white).
- **Hairline** (`line`) and **Rule** (`line-strong`): dividers between list rows and card borders; secondary button borders and browser dots.
- **Positive / Critical / Caution** (each with a `-soft` wash): status only. Caution also marks locked lecture actions.
- **Disabled** (`disabled-bg` / `disabled-fg`): a solid muted neutral for disabled controls.

### Named Rules
**The On Brand Rule.** Text on a brand fill is always `brand-fg`: white on Study Navy in light, near-black on pale blue in dark. Never hard-code either.

**The Named Stage Rule.** The navy stage comes only from the four stage backgrounds (lit stage, deep stage, bar, footer). No new flat navy hex, no new gradient recipe. Its light is white and slate, never a hue.

**The Token Only Rule.** New work on paper grounds colours through `surface`, `ink`, `line`, `brand` and the status tokens, never raw palette classes or hex. That is what makes dark mode free.

**The Solid Disabled Rule.** Disabled controls use the disabled pair, never an opacity-dimmed brand fill; opacity pulls fill and text toward each other and drops below AA.

**The Accent Only Rule.** A track differs from another only by its accent hue. Same type, same greys, same shapes.

## Typography

**Display Font:** Bricolage Grotesque (variable, optical size 12 to 96, weight 500 to 800; falls back to Inter)
**Body Font:** Inter (with ui-sans-serif, system-ui)
**Label Font:** Inter

**Character:** A characterful grotesque with optical sizing for every heading, over a neutral, highly legible Inter for reading and controls. Hierarchy comes from the face change plus weight and tight negative tracking; the wordmark, figures and all UI stay in Inter.

### Hierarchy
- **Display** (Bricolage 700, 36 / 60 / 72px across breakpoints, line-height 1.05, tracking -0.025em): the single page H1.
- **Display sub-line** (Bricolage 600, 24 / 30px): the line inside the H1 that names the exams, slate-200 on the stage.
- **Headline** (Bricolage 700, 30 / 48px, tracking -0.025em): every section H2. Max width about 42rem.
- **Title** (Bricolage 700, 20 to 30px, tracking -0.025em): tour step titles (balanced wrapping), card and plan titles (h3).
- **Figure** (Inter 900, 36 to 48px, tabular numerals): prices and stats.
- **Body lead** (400, 18px, line-height 1.625, max width about 32 to 36rem): the sentence under a headline.
- **Body** (400, 16px, line-height 1.625): answers, descriptions.
- **Label** (600, 14px): buttons, list names, FAQ questions at 18px semibold.
- **Mini** (12px) and **Micro** (11px, +0.01em tracking): captions, chips, browser URL bars, dock labels.

### Named Rules
**The Heading Face Rule.** Bricolage Grotesque is applied by the base rule to h1, h2 and h3 with optical sizing on; everything else is Inter. Use real heading elements to get the display face, and never set body, labels or numbers in Bricolage.

**The Micro Floor Rule.** 11px (`micro`) is the smallest text allowed. Nothing ships at 9 or 10px.

**The Tabular Figures Rule.** Every price, duration, count and percentage uses tabular numerals.

## Layout

Content sits in a 1280px container with 24px gutters on mobile and 64px from `md`. Marketing sections use 80px vertical padding, 112px from `md`. Two-part sections split a 12-column grid 5 / 7 (text left, product or list right) with 40 to 64px gaps, and stack to one column below `lg`. The hero frame is nudged down past the fold on desktop so the next band is visibly continued.

The product tour is a sticky two-column scene on desktop: a step list (each step at least 70vh tall, separated by top rules) beside a frame that stays pinned and swaps screens. On mobile the steps stack, each with its own frame. Lists of subjects, FAQ items and lecture rows are divided rows between top and bottom hairlines, not cards. The navbar is fixed: from 768px it stays pinned; on phones it hides on scroll down and returns on a deliberate scroll up (80px), and a fixed bottom dock carries primary navigation. `html` and `body` clip horizontal overflow with `clip`, not `hidden`, so sticky positioning keeps working.

## Elevation & Depth

Depth is ambient and layered: slate-tinted shadows that widen and soften as they rise, paired with hairline borders so surfaces read even where the shadow is faint. In dark themes the same five steps switch to black shadows at higher opacity. Colored glows are a separate scale that means "active", not "higher". The stage's white light is a background material, not a shadow or glow.

### Shadow Vocabulary
- **e1**: resting hairline lift for small controls.
- **e2**: default for cards, inner product panels, primary buttons, the selected tab.
- **e3**: the highlighted pricing card and the white pill on the stage.
- **e4**: product browser frames and floating menus.
- **e5**: sheets and modals.
- **glow-brand / glow-positive / glow-caution**: an active indicator (the selected track dot, the active dock icon as a drop-shadow). Never decoration.

### Named Rules
**The Five Steps Rule.** Shadows come from e1 to e5 only. No one-off shadow values.

**The Glow Means Active Rule.** A glow marks the one thing currently selected. Marketing sections carry no glow shadows; the stage's light lives in its background, not on elements.

## Shapes

Softly rounded rectangles with three radius roles: controls (buttons, fields, tabs, list rows) at 10px, cards and frames at 16px, sheets at 24px. Chips, speed toggles, progress tracks, avatars, icon buttons and the browser URL bar are full pills. Borders are 1px hairlines; the only 2px border is the highlighted pricing card. Product frames clip their content to the card radius.

## Components

### Buttons
Solid and plain, never gradient.
- **Shape:** gently rounded (10px), at least 44px tall, 14px semibold with 8px icon gap; hero and closing calls widen to 28px side padding at 16px.
- **Primary:** brand fill, `brand-fg` text, e2 shadow. One per view region on paper grounds.
- **Hover / Focus:** fill steps to `brand-hover` over 150ms on the brand curve; focus shows the global 2px brand outline, 2px offset.
- **On stage (white pill):** the primary action on the navy stage (hero, closing call, navbar Sign Up): white fill, Stage Navy text, e3 shadow; hover to slate-100.
- **Outline on stage:** the secondary action on the stage: white text, white 40% border over a white 10% fill with a light backdrop blur; hover to white 20%.
- **Secondary:** paper fill, `line-strong` border, ink text; hover to `surface-sunken`.
- **Ghost:** muted ink, no fill; hover adds `surface-sunken` and full ink.
- **Danger:** critical fill, white text.
- **Icon:** 44px circle.

### Chips
- **Style:** `brand-soft` pill with brand text at 12px semibold ("Best value", resume notices); neutral pills use `surface-sunken` with muted ink.
- **State:** selected speed or filter pills take the brand fill with `brand-fg` text.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** `surface` on `surface-sunken` grounds.
- **Shadow Strategy:** e2 at rest; e3 plus a 2px brand border for the one recommended option.
- **Border:** 1px `line`.
- **Internal Padding:** 32px on pricing cards, 16px inside product panels.

### Inputs / Fields
- **Style:** 1px `line` border, `surface` fill, 10px radius, 12 / 16px padding, 44px minimum height, `ink-subtle` placeholder.
- **Focus:** border shifts to brand plus the global focus outline at 1px offset.
- **Error / Disabled:** critical border on a `critical-soft` fill. Form labels are 12px semibold uppercase at 0.12em tracking in muted ink.

### Navigation
- **Style:** a 64px bar on the stage's bar gradient with a white 8% bottom hairline; the Kanthast wordmark (Inter 900, tight) followed inline by the track name as a 44px switcher, tinted by track accent.
- **Links:** 18px, white at 60%, hover to white; the active link is semibold.
- **Account actions:** Log In as a translucent white outline, Sign Up as the white stage pill with Stage Navy text.
- **Behaviour:** pinned from 768px; hides on scroll down only on phones.
- **Mobile:** a fixed bottom dock of icon plus micro label; the active item carries a 2px top indicator.

### Browser Frame (signature)
The way the product is shown. A 16px card on `surface` with a white 12% border and e4 shadow; a `surface-sunken` bar with three `line-strong` dots and a pill URL in micro `ink-subtle`; below it a scaled replica of a real app screen fed by real syllabus data, `aria-hidden` and described once by a mini caption in white 65%. In the desktop tour, stacked frames wipe in from the top with a clip-path over 550ms on the brand curve, and a fully covered frame hides once the wipe lands so the stack needs no opaque backing; reduced motion removes the transition.

### Divided List
Subjects, FAQ items and lecture rows: rows between hairline top and bottom borders, a bold ink name with a subtle tabular count, and muted supporting text. FAQ rows are native disclosure elements with a chevron that rotates over 250ms.

## Do's and Don'ts

### Do:
- **Do** put the hero on the lit stage and the product tour and closing call on the deep stage, and reading content (syllabus, pricing, FAQ) on `surface` or `surface-sunken`.
- **Do** use the white stage pill for the main action on navy and the brand fill for the main action on paper.
- **Do** show the product through browser frames built from real app screens and real data.
- **Do** colour with semantic tokens so the same class works in light, dark and system themes.
- **Do** use `brand-fg` on every brand fill.
- **Do** set headings as real h1 / h2 / h3 elements so they take Bricolage Grotesque.
- **Do** keep every control at least 44px and rely on the global brand focus ring.
- **Do** animate with the brand curve (`cubic-bezier(0.22, 1, 0.36, 1)`) at 150 / 250 / 400ms and honour reduced motion.
- **Do** set every number in tabular figures.

### Don't:
- **Don't** use AI-generated, stock or illustrative imagery in place of the product.
- **Don't** use gradient text, eyebrow or kicker labels above headings, numbered circles, or coloured decorative glows; the stage's white and slate light is the only atmospheric gradient.
- **Don't** invent a new navy or a new stage gradient; use the four stage backgrounds.
- **Don't** give the School track its own typeface, palette or shape language; change the accent only.
- **Don't** set text below 11px.
- **Don't** dim a brand button with opacity to disable it.
- **Don't** add shadow values outside e1 to e5, or radii outside 10 / 16 / 24px and pills.
- **Don't** use opacity modifiers outside the registered scale (6, 8, 12, 14, 15, 18, 35, 45, 55, 62, 65, 85, 92 plus Tailwind's defaults); off-scale modifiers emit no CSS and the element renders unstyled.

## Known Drift

Recorded as of 2026-09-29, not yet repaired:
- Cyan from the old accent survives on the stage: the navbar active link and dock item (cyan-400), the Medical track label and first-visit pulse (cyan-300), the tour's active step rule (cyan-300), a frame replica's progress fill and sub-line (cyan-300 / cyan-200), and the `drop-shadow-glow-brand` value in tailwind.config.js (rgba 34, 211, 238). None follow the navy brand; the on-stage active colour is undecided. The `brand.fg` comment in tailwind.config.js still describes cyan.
- The navbar Sign Up restates the stage pill inline (12px `rounded-xl`, raw white / slate-100 / #0b1638) instead of using the shared class; Log In uses `rounded-xl` too. The stage pill's hover (slate-100) and ink (#0B1638) are raw values inside the component layer rather than tokens.
- Chatbot's sidebar and overlays still use raw navy fills and text (slate-950, slate-300/400, white-alpha), not theme tokens.
- SchoolHomepage still uses a broad amber palette (about 133 raw palette classes and 44 hex values) instead of the shared system plus an amber accent.
- Nine other pages and components still colour with raw slate/gray classes, and 17 JSX files hard-code hex (among them About, Courses, Contact, Login, Signup, Profile, SubscriptionPage, SummaryPage, NotFound, Navbar, ProductFrames).
- Navbar menus use white and slate fills, `rounded-2xl`, `shadow-2xl` and a 300ms Material curve, none of which are system values or theme-aware; the track menu adds glass blur, cyan and pink radial washes and an uppercase "Explore" kicker.
- Product frame replicas and one Homepage element set text at 9 and 10px, and a replica uses a hard-coded player navy (#0F1D42).
- The `theme-color` meta in index.html is still the retired flat navy #0B1120.
