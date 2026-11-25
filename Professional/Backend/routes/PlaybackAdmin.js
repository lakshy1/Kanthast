import express from "express";
import { auth, isAdmin } from "../middleware/Auth.js";
import { getLogs, getSummary, listLectures, setLectureStatus } from "../controllers/PlaybackAdmin.js";

// Mounted at /api/v1/admin/playback. Admins only: a student token gets 403.
const router = express.Router();
router.use(auth, isAdmin);
router.get("/logs", getLogs);
router.get("/summary", getSummary);
router.get("/lectures", listLectures);
router.patch("/lectures/:lectureId", setLectureStatus);

export default router;
