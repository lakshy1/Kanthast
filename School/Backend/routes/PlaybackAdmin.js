import express from "express";
import { auth, isAdmin } from "../middleware/Auth.js";
import { getLogs, getSummary, listLessons, setLessonStatus } from "../controllers/PlaybackAdmin.js";

// Mounted at /api/v1/admin/playback. Admins only: a student token gets 403.
const router = express.Router();
router.use(auth, isAdmin);
router.get("/logs", getLogs);
router.get("/summary", getSummary);
router.get("/lessons", listLessons);
router.patch("/lessons/:lessonId", setLessonStatus);

export default router;
