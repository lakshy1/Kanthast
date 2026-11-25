// routes/Flashcard.js — Flashcard Studio API routes
import express from "express";
import { auth, isAdmin } from "../middleware/Auth.js";
import { rateLimit } from "../middleware/RateLimit.js";
import {
  getSubjects,
  getChapters,
  startSession,
  rateCard,
  getResult,
  getHistory,
  getStats,
  seedCards,
} from "../controllers/Flashcard.js";

const router = express.Router();

const flashcardLimiter = rateLimit({ name: "flashcards", windowMs: 60_000, max: 120 });

// Public (no auth): subject & chapter catalog
router.get("/subjects", flashcardLimiter, getSubjects);
router.get("/chapters", flashcardLimiter, getChapters);

// Student (auth required)
router.post("/session/start", auth, flashcardLimiter, startSession);
router.post("/session/:sessionId/rate", auth, flashcardLimiter, rateCard);
router.get("/session/:sessionId/result", auth, getResult);
router.get("/history", auth, getHistory);
router.get("/stats", auth, getStats);

// Admin seed
router.post("/admin/seed", auth, isAdmin, seedCards);

export default router;
