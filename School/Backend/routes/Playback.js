import express from "express";
import { auth } from "../middleware/Auth.js";
import { rateLimit } from "../middleware/RateLimit.js";
import { availableLessons, getLessonKey, getMasterPlaylist, getMediaPlaylist, heartbeat } from "../controllers/Playback.js";

const router = express.Router();

// A lesson makes a few dozen requests when it starts, so this is generous per student.
const playbackLimiter = rateLimit({ name: "playback", windowMs: 60_000, max: 240 });

router.get("/available", availableLessons);
router.post("/heartbeat", auth, playbackLimiter, heartbeat);
router.get("/:lessonId/master.m3u8", auth, playbackLimiter, getMasterPlaylist);
router.get("/:lessonId/:variant/index.m3u8", auth, playbackLimiter, getMediaPlaylist);
router.get("/:lessonId/key", auth, playbackLimiter, getLessonKey);

export default router;
