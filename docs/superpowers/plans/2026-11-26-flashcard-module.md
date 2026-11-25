# Flashcard Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Overview
Build the end-to-end **Flashcards** module in Practice Studio for Kanthast School (`/practice/flashcards`). Following the user's master prompt, this feature provides top-tier UX with 3D card physics, SM-2 spaced repetition, bilateral flank navigation (`Left Arrow [Card] Right Arrow`), rich mnemonic pro-tips, and a clean review modal for difficult and mastered cards.

---

## Tasks

### Task 1: Backend Flashcard Models & Seed Data
- [ ] Create `School/Backend/models/Flashcard.js` with schema for term, definition, mnemonic, takeaway, subject, chapter, and difficulty.
- [ ] Create `School/Backend/models/FlashcardSession.js` tracking user deck reviews, mastery score, and card ratings.
- [ ] Create `School/Backend/models/FlashcardProgress.js` with SM-2 spaced repetition state (easeFactor, interval, repetition, nextReviewAt).
- [ ] Create `School/Backend/data/class10FlashcardSeed.js` with 30+ high-yield NCERT Class X cards (Science, Math, Social Science) including mnemonics and formulas.

### Task 2: Backend Controller, Routes & Server Mount
- [ ] Create `School/Backend/controllers/Flashcard.js` implementing:
  - `ensureSeedFlashcards()` auto-seed
  - `getSubjects`, `getChapters`
  - `startSession` (filters by subject/chapter or due cards, returns deck)
  - `rateCard` (calculates SM-2 ease factor & interval, records response)
  - `getResult` (calculates mastery score, counts of Again/Hard/Good/Easy)
  - `getHistory` & `getStats`
- [ ] Create `School/Backend/routes/Flashcard.js` with rate limiting and auth.
- [ ] Mount `/api/v1/flashcards` in `School/Backend/server.js`.

### Task 3: Frontend API & Styles
- [ ] Extend `School/Frontend/src/utils/practiceApi.js` with Flashcard API calls.
- [ ] Enhance `School/Frontend/src/styles/practice-studio.css` with:
  - 3D card container (`perspective: 1400px`, `transform-style: preserve-3d`)
  - Flipping animation classes (`rotateY(180deg)`)
  - Front & back card layout with elevation and tactile shadows
  - Rating buttons (Again, Hard, Good, Easy) with 3D press feel & keyboard badges
  - Vertically centered bilateral flank navigation arrows

### Task 4: Frontend Flashcard Engine & Results Review
- [ ] Create `School/Frontend/src/pages/FlashcardPractice.jsx`:
  - Deck Selector & Chapter picker (with Class X indicator)
  - Interactive 3D Deck screen with Spacebar/click to flip, flank arrow buttons
  - SM-2 Rating bar with hotkeys (1-4)
  - Results screen with Mastery Score ring, stats breakdown, and "Review Difficult Cards" action
  - Redesigned Review Modal with tabs (`Needs Review`, `Mastered`, `All Cards`)
- [ ] Update `School/Frontend/src/pages/PracticeStudio.jsx`:
  - Unlock Flashcard card (`available: true`, `badge: "Live"`)
  - Add Flashcard session stats and quick link
- [ ] Update `School/Frontend/src/App.jsx`:
  - Lazy load `FlashcardPractice` and route `/practice/flashcards` to it

### Task 5: End-to-End Verification
- [ ] Run backend syntax and route checks.
- [ ] Run frontend Vite build to ensure zero compilation or styling errors.
- [ ] Verify test runner or API response checks.
