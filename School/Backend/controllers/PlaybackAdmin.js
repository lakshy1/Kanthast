import PlaybackLog from "../models/PlaybackLog.js";
import LessonVideo from "../models/LessonVideo.js";
import { parseLessonId } from "../services/lessonAccess.js";

// Admin views of who watched what, and which lessons are live. Admin only (see routes/PlaybackAdmin.js).
export const getLogs = async (req, res) => {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
  const filter = {};
  if (req.query.lessonId && parseLessonId(req.query.lessonId)) filter.lessonId = req.query.lessonId;
  const rows = await PlaybackLog.find(filter)
    .sort({ startedAt: -1 })
    .limit(limit)
    .populate("user", "firstName lastName email contactNumber")
    .lean();
  return res.status(200).json({
    success: true,
    logs: rows.map((r) => ({
      id: r._id,
      lessonId: r.lessonId,
      student: r.user ? `${r.user.firstName || ""} ${r.user.lastName || ""}`.trim() : "Deleted account",
      email: r.user?.email || "",
      phoneLast4: String(r.user?.contactNumber || "").replace(/\D/g, "").slice(-4),
      startedAt: r.startedAt,
      lastSeenAt: r.lastSeenAt,
      watchedSeconds: r.watchedSeconds,
      ip: r.ip,
      device: r.userAgent,
    })),
  });
};

export const getSummary = async (_req, res) => {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const perLesson = await PlaybackLog.aggregate([
    { $match: { startedAt: { $gte: since } } },
    { $group: { _id: "$lessonId", views: { $sum: 1 }, students: { $addToSet: "$user" }, seconds: { $sum: "$watchedSeconds" } } },
    { $project: { _id: 0, lessonId: "$_id", views: 1, students: { $size: "$students" }, seconds: 1 } },
    { $sort: { views: -1 } },
    { $limit: 50 },
  ]);
  const totalViews = perLesson.reduce((n, l) => n + l.views, 0);
  return res.status(200).json({ success: true, days: 30, totalViews, perLesson });
};

export const listLessons = async (_req, res) => {
  const rows = await LessonVideo.find().sort({ lessonId: 1 }).lean();
  return res.status(200).json({
    success: true,
    lessons: rows.map((r) => ({ lessonId: r.lessonId, status: r.status, durationSec: r.durationSec, publishedAt: r.publishedAt })),
  });
};

export const setLessonStatus = async (req, res) => {
  const { lessonId } = req.params;
  const { status } = req.body || {};
  if (!parseLessonId(lessonId) || !["live", "hidden"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid lesson or status." });
  }
  const row = await LessonVideo.findOneAndUpdate({ lessonId }, { $set: { status } }, { new: true });
  if (!row) return res.status(404).json({ success: false, message: "Lesson not found." });
  return res.status(200).json({ success: true, lesson: { lessonId: row.lessonId, status: row.status } });
};
