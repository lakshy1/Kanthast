import express from "express";
import { auth } from "../middleware/Auth.js";
import { rateLimit } from "../middleware/RateLimit.js";
import { availableLectures, getLectureKey, getMasterPlaylist, getMediaPlaylist, heartbeat } from "../controllers/Playback.js";

const router = express.Router();

// A lecture makes a few dozen requests when it starts, so this is generous per student.
const playbackLimiter = rateLimit({ name: "playback", windowMs: 60_000, max: 240 });

router.get("/available", availableLectures);
router.post("/heartbeat", auth, playbackLimiter, heartbeat);
router.get("/:lectureId/master.m3u8", auth, playbackLimiter, getMasterPlaylist);
router.get("/:lectureId/:variant/index.m3u8", auth, playbackLimiter, getMediaPlaylist);
router.get("/:lectureId/key", auth, playbackLimiter, getLectureKey);

export default router;
