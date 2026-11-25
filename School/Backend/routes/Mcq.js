// routes/Mcq.js
import express from "express";
import { auth } from "../middleware/Auth.js";
import { rateLimit } from "../middleware/RateLimit.js";
import {
  getSubjects,
  getChapters,
  startSession,
  submitAnswer,
  getResult,
  getHistory,
  getStats,
  seedQuestions,
} from "../controllers/Mcq.js";
import { isAdmin } from "../middleware/Auth.js";

const router = express.Router();

const mcqLimiter = rateLimit({ name: "mcq", windowMs: 60_000, max: 120 });

// Public (no auth): subject & chapter listings
router.get("/subjects", mcqLimiter, getSubjects);
router.get("/chapters", mcqLimiter, getChapters);

// Student (auth required)
router.post("/session/start", auth, mcqLimiter, startSession);
router.post("/session/:sessionId/answer", auth, mcqLimiter, submitAnswer);
router.get("/session/:sessionId/result", auth, getResult);
router.get("/history", auth, getHistory);
router.get("/stats", auth, getStats);

// Admin seed
router.post("/admin/seed", auth, isAdmin, seedQuestions);

export default router;
