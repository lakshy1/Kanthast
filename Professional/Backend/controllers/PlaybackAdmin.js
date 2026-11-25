import PlaybackLog from "../models/PlaybackLog.js";
import LectureVideo from "../models/LectureVideo.js";
import { parseLectureId, forgetLectureLocations } from "../services/lectureLocator.js";

// Admin views of who watched what, and which lectures are live. Admin only (see routes/PlaybackAdmin.js).
export const getLogs = async (req, res) => {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
  const filter = {};
  if (req.query.lectureId && parseLectureId(req.query.lectureId)) filter.lectureId = String(req.query.lectureId).toLowerCase();
  const rows = await PlaybackLog.find(filter)
    .sort({ startedAt: -1 })
    .limit(limit)
    .populate("user", "firstName lastName email contactNumber")
    .lean();
  return res.status(200).json({
    success: true,
    logs: rows.map((r) => ({
      id: r._id,
      lectureId: r.lectureId,
      sessionCode: String(r.streamId || "").replace(/[^a-f0-9]/gi, "").slice(0, 4).toUpperCase(),
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
  const perLecture = await PlaybackLog.aggregate([
    { $match: { startedAt: { $gte: since } } },
    { $group: { _id: "$lectureId", views: { $sum: 1 }, students: { $addToSet: "$user" }, seconds: { $sum: "$watchedSeconds" } } },
    { $project: { _id: 0, lectureId: "$_id", views: 1, students: { $size: "$students" }, seconds: 1 } },
    { $sort: { views: -1 } },
    { $limit: 50 },
  ]);
  const totalViews = perLecture.reduce((n, l) => n + l.views, 0);
  return res.status(200).json({ success: true, days: 30, totalViews, perLecture });
};

export const listLectures = async (_req, res) => {
  const rows = await LectureVideo.find().sort({ lectureId: 1 }).lean();
  return res.status(200).json({
    success: true,
    lectures: rows.map((r) => ({ lectureId: r.lectureId, status: r.status, durationSec: r.durationSec, publishedAt: r.publishedAt })),
  });
};

export const setLectureStatus = async (req, res) => {
  const { lectureId } = req.params;
  const { status } = req.body || {};
  if (!parseLectureId(lectureId) || !["live", "hidden"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid lecture or status." });
  }
  const row = await LectureVideo.findOneAndUpdate({ lectureId: String(lectureId).toLowerCase() }, { $set: { status } }, { new: true });
  if (!row) return res.status(404).json({ success: false, message: "Lecture not found." });
  forgetLectureLocations();
  return res.status(200).json({ success: true, lecture: { lectureId: row.lectureId, status: row.status } });
};
