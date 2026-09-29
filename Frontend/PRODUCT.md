# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

(The same React build ships to Android through Capacitor; its design language stays web. A separate Expo app in `../MobileApp` is out of scope and currently broken against the API.)

## Users

- **Primary: Indian MBBS students and interns preparing for NEET-PG and INI-CET.** They study long hours across the full MBBS syllabus under exam pressure, mostly on phones and on Indian mobile data, and they judge a platform on content depth, faculty credibility and price in INR.
- **Secondary: USMLE aspirants** (Indian IMGs and international students), served by the same Medicine/USMLE library; current paid plans are priced in USD for this track.
- **Separate track: School (Class I–X, CBSE and state boards)**, bought by parents for children. Shares the account system and navbar; has its own landing page at `/school`.

## Product Purpose

Kanthast teaches medicine through short animated video lectures organised as subject → chapter → lecture, with progress tracking and resume, a dashboard, and an AI assistant. Success is a student finding the lecture they need, watching it through, and coming back the next day to continue.

## Positioning

Visual, animation-first explanations of medical concepts in short units (median lecture 7.3 min) rather than long filmed classroom lectures. The leading Indian platforms (Marrow, PrepLadder) sell long faculty lectures plus question banks; Kanthast's differentiator is the animated visual explanation.

## Operating Context

- Students browse the library (`/lists`), open a lecture (`/video`), resume where they left off, and track watched lectures on the dashboard.
- Content is managed by an admin through `/admin` and served by the Express API (`/api/v1/medicine-usmle`).
- Lectures are mostly externally hosted video links; a few are YouTube.
- Payments are currently a simulated checkout; a real gateway (Razorpay keys exist in the backend) is not yet wired.

## Capabilities and Constraints

- **Live catalog (read from the production API, 2026-09-29):**
  - The syllabus has 5 subjects (Biochemistry, Immunology, Pharmacology, Microbiology, Neuroanatomy), 88 chapters and 917 lecture entries.
  - The listed durations add up to about 123 hours, with a median of 7.3 minutes per lecture.
  - **Only 3 of the 917 entries have a playable video, and all 3 are third-party YouTube videos** (TED-Ed, Pixorize). The other 914 entries are titles and durations with no video attached.
  - The catalog therefore holds planned or unpublished lectures, not watchable Kanthast content. **Never present 917 lectures or 123 hours as available to watch.** Recompute these figures before quoting them; the catalog changes.
  - Embedding other creators' videos inside a paid product is a licensing risk.
- **Lecture status (owner, 2026-09-29):** original Kanthast lectures are **still in production**. The owner chose to keep "Get started" plus visible pricing as the landing page's primary path. Copy must say plainly that lectures are being released, and must not imply a complete library.
- **Programs advertised:** Medicine/USMLE, NEET-PG and INI-CET all draw on the same library today. There are no separate NEET-PG/INI-CET plans yet.
- **Not built:** question bank, quizzes, spaced repetition, notes, transcripts, search, and cross-device progress sync (progress is stored per device). Copy must not claim these.
- **Pricing on record:** Medicine/USMLE is 110 USD for 1 year or 200 USD for 2 years; School is Rs 5,000. INR pricing for NEET-PG/INI-CET is **undecided**.
- **Terminology:** subject → chapter → lecture. The "Lists" route is the lecture library.

## Brand Commitments

- Name: Kanthast. Logo files: `public/logo.png`, `public/Logo-Extended.png`, `src/assets/images/Logo.png`.
- **One brand across tracks** (user decision, 2026-09-29): Medical and School share one identity. Each track is distinguished by an accent only, not by a separate look.

## Evidence on Hand

- **Real catalog numbers:** as listed above.
- **Confirmed to exist but not yet supplied (2026-09-29):** real user numbers, named faculty with credentials and photos, and real student testimonials with consent. The page renders these sections only from data the owner provides; until then they stay hidden. **Never fabricate numbers, names, faces, ranks or quotes.**
- **Unusable as proof or product imagery:**
  - `src/assets/videos/Kanthast.mp4` carries a Google "Veo" watermark.
  - `src/assets/videos/Video-2.mp4` contains misspelled text ("Eqplaised", "Brealkdown").
  - `src/assets/images/Image-1.png` and its Card-Thumb crops contain "[cite: 1]" artifacts.
- **Unverified:** the School page's "50,000+ students / 4.8/5" figures and first-name testimonials are not confirmed as real.

## Product Principles

1. **Show the real product.** Actual lectures, the library and progress carry the argument, not abstract art.
2. **Only true claims.** Every number, name, quote and feature claim traces to real data.
3. **India-first, exam-first.** Name the exam, price in INR where decided, and work well on a phone over mobile data.
4. **Find → watch → return.** Optimise for the core loop before adding surface area.
5. **Medical accuracy is brand.** A factual slip in copy or imagery costs more trust than any visual polish earns.

## Accessibility & Inclusion

WCAG 2.1 AA contrast. 44px minimum touch targets. Visible focus rings, a skip link and reduced-motion support already exist and must be preserved. Light and dark themes must both be complete before "System" is offered as the default.
