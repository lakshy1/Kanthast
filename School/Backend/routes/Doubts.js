import express from "express";
import { auth } from "../middleware/Auth.js";
import { chatRateLimit } from "../middleware/ChatRateLimit.js";
import { notAdmin, notMuted, requireClass, requireConsent } from "../middleware/Doubts.js";
import { waitForDoubtIndexes } from "../services/doubtIndexes.js";
import {
  acceptReply,
  createAiAnswer,
  createDoubt,
  createReply,
  deleteDoubt,
  draftFromChatSession,
  getAiAllowance,
  getDoubt,
  getFeed,
  getMine,
  getQuota,
  getSimilar,
  reportItem,
  setClass,
  toggleDoubtHelpful,
  toggleReplyHelpful,
} from "../controllers/Doubts.js";
import { getConsent, requestConsent, verifyConsent, withdrawConsent } from "../controllers/ParentConsent.js";

const router = express.Router();

// Doubts is for logged-in users only. On a fresh server copy, the first requests wait until
// the indexes exist (text search and the daily limits depend on them).
router.use(auth, waitForDoubtIndexes);

// Setting up: class, then a parent's approval.
router.post("/class", setClass);
router.get("/consent", getConsent);
router.post("/consent/request", requireClass, chatRateLimit, requestConsent);
router.post("/consent/verify", chatRateLimit, verifyConsent);
router.post("/consent/withdraw", withdrawConsent);

// AI help that needs only a login (the assistant chat is not part of the class feed).
router.get("/ai-quota", getAiAllowance);
router.post("/from-chat", chatRateLimit, draftFromChatSession);

// The class feed: needs a student account with a class and an approved parent.
const feed = [notAdmin, requireClass, requireConsent];
router.get("/quota", feed, getQuota);
router.get("/feed", feed, getFeed);
router.get("/similar", feed, getSimilar);
router.get("/mine", feed, getMine);
router.post("/report", feed, chatRateLimit, reportItem);
router.post("/replies/:replyId/helpful", feed, chatRateLimit, toggleReplyHelpful);
// notMuted: a muted student can read, but not post, reply or ask for an AI answer here.
router.post("/", feed, notMuted, chatRateLimit, createDoubt);
router.get("/:id", feed, getDoubt);
router.delete("/:id", feed, deleteDoubt);
router.post("/:id/replies", feed, notMuted, chatRateLimit, createReply);
router.post("/:id/helpful", feed, chatRateLimit, toggleDoubtHelpful);
router.post("/:id/accept/:replyId", feed, acceptReply);
router.post("/:id/ai-answer", feed, notMuted, chatRateLimit, createAiAnswer);

export default router;
