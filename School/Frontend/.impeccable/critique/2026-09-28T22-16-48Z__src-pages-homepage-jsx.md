---
target: complete UI/UX of Kanthast web app vs top edtech
total_score: 16
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:C:\\Users\\laksh\\OneDrive\\Desktop\\Projects\\05-Kanthast\\Frontend\\src\\pages\\Homepage.jsx"
target_fingerprint: "sha256:6f6bbdcf945eb33fc101a069bcab3d561f384bd6044f8d374094ae420d519395"
target_path: "C:\\Users\\laksh\\OneDrive\\Desktop\\Projects\\05-Kanthast\\Frontend\\src\\pages\\Homepage.jsx"
timestamp: 2026-09-28T22-16-48Z
slug: src-pages-homepage-jsx
---
# Kanthast web UI critique vs top-0.1% edtech (2026-09-29)
Method: dual-agent (A: design review · B: detector + browser) + benchmark agent (Osmosis, Lecturio, AMBOSS, Sketchy, B&B, Marrow, PrepLadder, MasterClass, Brilliant, Khan, Coursera, Duolingo). Backend CORS-blocked from localhost: data pages seen in empty/error state.

## Heuristics (product UI) 16/40 Poor
1 Status 2 (errors masked as empty; "Online" + "Failed to fetch") · 2 Real world 2 ("Lists"/"Chatbot", USD for NEET) · 3 Control 2 (Mark Watched irreversible; receipt auto-dismiss 4s) · 4 Consistency 1 (cyan CTAs dark vs white text; 4 accents; tokens bypassed) · 5 Error prevention 2 (locked rows navigate; demo checkout collects card+CVV) · 6 Recognition 2 (icon-only lecture actions; no title while playing) · 7 Efficiency 1 (no search/shortcuts/notes) · 8 Aesthetic 2 (generic; redundant sidebar) · 9 Recovery 1 (raw "Failed to fetch"; no forgot password on Login) · 10 Help 1 (no FAQ, no Terms/Privacy/Refund)

## Benchmark scorecard 36/120
Hero 5 · Proof 1 · Product visibility 2 (School 6) · Brand 3 · Player 3 · Learning loop 1 · Curriculum nav 3 · Progress 4 · Mobile 5 · A11y 6 · Pricing 2 · AI 1

## Priority issues
- [P0] AI-artifact imagery on medical landing: Veo watermark in hero video (Kanthast.mp4), "Cardiac Cycle Eqplaised"/"Brealkdown" (Video-2, Homepage.jsx:243), "[cite: 1]"/"GERMAN" illustration (Image-1, Homepage.jsx:375). Replace with real product captures.
- [P1] No proof/faces; School stats (50,000+, 4.8/5) + first-name testimonials unverifiable (SchoolHomepage.jsx:161-200).
- [P1] Pricing login-gated (App.jsx:305), USMLE/USD only, "quiz" claim, no Terms/Privacy/Refund.
- [P1] Default "System" appearance → half-dark UI; errors disguised as empty states (Lists.jsx:145, VideoPage.jsx:870-880, Chatbot status pill).
- [P2] Learning loop stops at video: no player title/up-next/shortcuts (VideoPage), no Lists search, icon-only row actions (Lists.jsx:742), hover-only lock reasons, AI is helpdesk not tutor.

## Detector
CLI 21 warnings (gradient-text 4, side-tab 2, overused-font 1 true; gray-on-color 11 false positives). Browser: / 7, /school 77, /courses 11 (h1→h3 skip), /subscription 14 (4 contrast), /lists 4. Nav Sign Up white on cyan-500 2.4:1 (Navbar.jsx:481). Home 6.38 MB (4.8 MB hero mp4 eager). No horizontal overflow; 8 sub-44px mobile targets on /.

## Personas
Jordan: pricing → silent /login redirect; "Lists" unclear; 3 Explore CTAs same target. Casey: hover-only locks; /video overlay clips Back button at 390px; heavy hero video. Sam: "Video, button" ×N unlabeled; OS-dark unreadable cyan. Alex: no shortcuts/search; device-local progress.

## Minor
"Medical" script overlaps wordmark (Navbar.jsx:265-270); "How Kanthast Works?"; once:false re-animation; typewriter CLS; footer socials to generic homepages; off-brand 404 blue; AFTERLOAD→HYPERTENSION caption.

## Questions
Why no real lecture clip on the landing page? One brand or two? Tutor vs helpdesk AI? NEET-PG student paying USD for USMLE plan?
