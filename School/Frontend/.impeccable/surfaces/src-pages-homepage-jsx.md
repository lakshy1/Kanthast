---
version: 1
slug: "src-pages-homepage-jsx"
primary_target: "src/pages/Homepage.jsx"
related_targets: []
---

# Medical landing page (/)

Scope: the medical-track homepage, `src/pages/Homepage.jsx`. Visitor mode: **Persuade**.
Audience: Indian MBBS students and interns preparing for NEET-PG / INI-CET (primary), and USMLE aspirants.
Action: Get started (sign up), with pricing visible on the page.
Proof: the real syllabus from `/api/v1/medicine-usmle`, features that exist today (library, resume, progress, dashboard, AI assistant), and published prices. Lectures are in production; the page says so plainly.
Hidden until the owner supplies real data: faculty, user numbers, testimonials.
Constraints: no AI-generated media (all current landing media is AI-made or watermarked); INR pricing undecided; one brand across tracks.

## Direction contract
THESIS: The homepage is a guided walk through the real Kanthast app (find a lecture, watch and resume it, track progress), with each claim standing on a true product screen. It refuses the category default of an AI-art hero, an icon feature grid and a stat band.
OWN-WORLD: The existing Kanthast world, unified. A navy #0B1120 band carries the hero and the tour; white and slate-50 grounds for pricing and FAQ; cyan-600 brand with near-black text on brand fills; Inter throughout at a clear 3-step display scale. Product screens sit in a thin browser-chrome frame with e4 elevation. No gradient text, eyebrows, numbered circles or glows.
STORY: The visitor learns that Kanthast teaches the NEET-PG/INI-CET/USMLE syllabus as short animated lectures, organised by subject and chapter, with resume and progress. They see what is live and what is releasing, see the price, and click Get started.
FIRST VIEWPORT: The left 5 columns hold the H1 naming the exams, one plain sentence, a primary "Get started" button and a secondary "See pricing" link. The right 7 columns hold a browser frame showing the real library with a subject expanded, and it bleeds slightly past the fold.
FORM: Product tour. Signature interaction: a sticky tour on desktop where the app frame swaps screens (library, then lecture, then dashboard) as the step list scrolls past, using a clip-path reveal; on mobile the steps stack, each with its own frame. Position 3 of 7 on my ordered list. Seed key 85a6019e.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- INR prices for NEET-PG/INI-CET plans.
- Faculty, numbers and testimonials data (the sections render only when supplied).
