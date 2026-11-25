// routes/Viva.js — Viva Coach Oral Exam API routes
import express from "express";
import { auth } from "../middleware/Auth.js";
import { rateLimit } from "../middleware/RateLimit.js";
import {
  getSubjects,
  getChapters,
  startSession,
  submitAnswer,
  completeSession,
  getResult,
  getHistory,
  getStats,
} from "../controllers/Viva.js";

const router = express.Router();

const vivaLimiter = rateLimit({ name: "viva", windowMs: 60_000, max: 120 });

// Public catalog
router.get("/subjects", vivaLimiter, getSubjects);
router.get("/chapters", vivaLimiter, getChapters);

// Auth-protected student viva sessions
router.post("/session/start", auth, vivaLimiter, startSession);
router.post("/session/:sessionId/answer", auth, vivaLimiter, submitAnswer);
router.post("/session/:sessionId/complete", auth, vivaLimiter, completeSession);
router.get("/session/:sessionId/result", auth, getResult);
router.get("/history", auth, getHistory);
router.get("/stats", auth, getStats);

export default router;
