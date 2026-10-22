# Kanthast UI Audit (web app, 2026-10-22)

**Method and limits.** Static audit of `Frontend/` source (grep metrics, component and CSS review, route map), checked against `DESIGN.md`, `PRODUCT.md` and the prior critique in `Frontend/.impeccable/critique/` (2026-09-28, scored 16/40). I did not run the app (no `node_modules`; the backend also blocks localhost via CORS), so nothing here is verified visually, and contrast and layout claims need a browser pass. The Expo app is out of scope.

## Summary
The UI has improved a lot since the Sept critique (design tokens, a `Button`/`Modal`/`Field` primitive set, 44px targets, focus rings, reduced-motion, Terms/Privacy/Refund pages, Lists search). The main remaining problems are **trust and honesty** (fake proof, a demo checkout that collects card data), **design-system drift** (the documented fonts and colors don't match the code), and **gaps in the learning loop**.

Severity: **P0** blocks launch or damages trust, **P1** fix before marketing, **P2** polish.

---

## P0

**P0-1. Demo checkout collects card number and CVV and prints the OTP on screen.**
`SubscriptionPage.jsx:78-146`: the form validates a card and CVV, and the notice says "OTP sent to ... Demo OTP: ${otp}". Users will type real card details into a fake form. Remove the card fields until Razorpay is wired, or replace the form with a clear "payments opening soon / join waitlist" state.

**P0-2. Unverified proof on the School page.**
`SchoolHomepage.jsx:162-165, 1038`: "50,000+ students", "4.8/5", and "Join 50,000+ students" are hardcoded, along with first-name testimonials. PRODUCT.md says to never fabricate these. Remove them or source them from real data.

**P0-3. The product presents a library it doesn't have.**
Lists shows many "Coming soon" rows with only 3 playable YouTube videos. This is a UI problem as well as a content one: a state that is 99% empty needs a deliberate design (see P1-5).

## P1

**P1-1. Typography does not match the design system.**
`DESIGN.md` and the `index.css:145` comment specify Bricolage Grotesque for headings. `tailwind.config.js:15` and `index.html:28` load Plus Jakarta Sans instead, and Bricolage is not loaded anywhere. Either update DESIGN.md to match the code or load the intended font. The `.impeccable/config.json` ignore rules were added to silence detector warnings, so the drift has been hidden rather than fixed.

**P1-2. Hardcoded colors bypass the tokens.**
Hex values in JSX: `FaqStudent.jsx` 100, `HeroScreens.jsx` 50, `SchoolHomepage.jsx` 44, `TourScreen.jsx` 31, `Navbar.jsx` 10, plus `Profile`, `NotFound` and `ComingSoon` (7 each). `TourScreen.jsx` has 75 inline `style={{}}` objects. `SchoolHomepage` uses `#1A2438` and `rounded-[26px]/[28px]/[32px]` instead of the `card` and `sheet` radii. These break theming, and the landing components are effectively a second design system.

**P1-3. Dark mode is incomplete and unverifiable.**
There are 0 `dark:` variants. Theming relies on CSS variables plus `data-theme`, which can work, but all the hardcoded hexes above won't switch. PRODUCT.md says "System" must not be the default until both themes are complete, but `App.jsx:241` already supports a "system" mode. Test every route in both themes, and treat dark-on-dark hardcoded cards as likely defects.

**P1-4. Accent and CTA inconsistency.**
The design system says the primary is `brand` navy (#1E3A8A), but the Navbar Sign Up pill and the mobile menu CTA use `bg-mint text-midnight` (`Navbar.jsx:499, 738`). Mint is a landing/dark-surface accent. A primary action that is navy in the app and mint in the nav is a recognizable inconsistency. Choose one rule: primary on light is brand navy, on dark it is mint, and apply it everywhere.

**P1-5. Empty and "coming soon" states.**
Make the unreleased state honest and useful: group lectures into "Available now / In production", add a "notify me" action, and show the release status once per page instead of on every row. `Lists.jsx:416-439` repeats "Coming soon" and "Video coming soon" per row, which makes the list noisy.

**P1-6. Login lacks a "Forgot password" link.**
`Login.jsx` has no reset entry point, although the backend has `ResetPassword.js`. This was flagged in the Sept critique and is still open.

**P1-7. Unused heavy assets, and the flagged ones still ship in the repo.**
`src/assets/videos` is about 15 MB (`Kanthast.mp4` with the Veo watermark, `Video-2.mp4` with misspellings, plus `compressed_Video-2.mp4`). `Image-1..5.png` and `Card-Thumb-1..5.png` ("[cite: 1]" artifacts) are not imported in any JSX I found (only a comment in `Dashboard.jsx:16` mentions them). Delete the flagged assets so nobody re-imports them. Check `School-Hero-I.png` (1.9 MB) for compression and for AI artifacts.

**P1-8. Learning loop (UI side).**
`/video` and `/summary` require login. Prior critique items still unverified as fixed: a title while playing, up-next, keyboard shortcuts, labelled row actions. Pricing is public now (`/pricing`), which is good, but check that checkout from it doesn't dump an unauthenticated user on a silent `/login` redirect (`RequireAuth` on `/subscription`).

## P2

**P2-1. Tiny text.** 108 uses of `text-xs` or `text-[9–12px]`. Fine for badges, but check body-adjacent copy against WCAG and the "mini/micro" tokens (11–12px). Don't use micro for anything a student must read.

**P2-2. Three images lack a reliable `alt`.** `DeviceShowcase.jsx:47` (alt comes from a prop, so verify callers pass one; the device frame should probably be `alt=""` with `aria-hidden`), `Homepage.jsx:258` (faculty photo, alt is the person's name, which is fine) and `SchoolHomepage.jsx:546` (alt is generic: "lesson preview"). Describe what's shown.

**P2-3. Focus handling.** `Profile.jsx:311` uses `outline-none focus:ring-2 focus:ring-cyan-400` (cyan, off-brand, and `focus:` rather than `focus-visible:`). `Chatbot.jsx:805` removes the outline from the composer textarea; confirm the wrapper shows a visible focus state. The global ring in `index.css` is otherwise good.

**P2-4. Inconsistent button usage.** 77 raw `<button>` elements versus 35 `<Button>`. Migrate the rest so sizing, loading and focus stay consistent.

**P2-5. Page weight and structure.** `VideoPage` (1,635 lines), `AdminPanel`, `SchoolHomepage` and `Settings` (1,000+ each) are hard to keep consistent. Split them into section components; that makes the token migration in P1-2 feasible.

**P2-6. Two homepages, two visual languages.** `/` and `/school` share one brand per PRODUCT.md, but `SchoolHomepage` uses its own dark navy cards, amber accents and custom radii. Confirm it reads as the same brand, not a sibling product.

**P2-7. Heading hierarchy.** The Sept critique found an h1→h3 skip on `/courses` and an h1-less state on others. Re-check with a heading outline per route.

**P2-8. Minor carry-overs from the Sept critique to re-check:** the "Medical" script overlapping the wordmark, "How Kanthast Works?" copy, typewriter layout shift, footer social links pointing at generic homepages, an off-brand blue 404.

## What's working (keep)
- Single semantic token layer (`index.css`, `tailwind.config.js`), documented in `DESIGN.md`.
- `ui/` primitives: `Button`, `Modal`, `Field`, `Select`, `Toggle`, `EmptyState`, `LiveRegion`.
- Accessibility baseline: 227 `aria-*` usages, skip link, `prefers-reduced-motion`, 44px touch minimum, no click handlers on bare `div`/`span`.
- Responsive coverage: heavy use of `md:` (194) and `lg:` (132) breakpoints.
- Legal routes (`/terms`, `/privacy`, `/refunds`) exist and are linked from the footer.
- Honest-copy discipline is written down in PRODUCT.md; the code just needs to follow it (P0-2).

## Suggested order of work
1. P0-1 and P0-2 (remove the card form and the fake stats).
2. P1-1 and P1-4 (decide the type and primary-accent rules, then align DESIGN.md and code).
3. P1-6 (forgot password) and P1-7 (delete bad assets).
4. P1-5 and P1-8 (honest "in production" library and the player loop).
5. P1-2 and P1-3 (token migration, both themes), then P2 polish.
6. Do a browser pass (Lighthouse, axe, 390px and 1280px screenshots, both themes) to confirm the static findings. I can run this once `npm install` is done and the backend is reachable.
