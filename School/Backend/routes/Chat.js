import express from "express";
import { auth } from "../middleware/Auth.js";
import { chatRateLimit } from "../middleware/ChatRateLimit.js";
import { uploadLimiter } from "../middleware/RateLimit.js";
import { aiAllowance } from "../middleware/AiAllowance.js";
import {
  createChatSession,
  deleteChatSession,
  getChatHistory,
  sendChatMessage,
  uploadChatFile,
} from "../controllers/Chat.js";
import {
  createAiVideoLecture,
  getAiVideoLectureStatus,
  serveAiVideoLectureMedia,
  serveAiVideoLectureThumbnail,
} from "../controllers/VideoLecture.js";

const router = express.Router();

router.get("/history", auth, getChatHistory);
router.post("/session/new", auth, createChatSession);
router.delete("/session/:sessionId", auth, deleteChatSession);
// Each message uses one of today's AI messages (shared with AI answers in Doubts).
router.post("/send", auth, chatRateLimit, aiAllowance, sendChatMessage);
router.post("/upload", auth, uploadLimiter, uploadChatFile);
router.post("/video/generate", auth, chatRateLimit, createAiVideoLecture);
router.get("/video/status/:jobId", auth, getAiVideoLectureStatus);
router.get("/video/media/:jobId", serveAiVideoLectureMedia);
router.get("/video/thumbnail/:jobId", serveAiVideoLectureThumbnail);

export default router;
