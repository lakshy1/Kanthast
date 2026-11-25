import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, r2Config } from "../config/r2.js";
import { lectureKey } from "../utils/videoKeys.js";
import { lectureDecision } from "../services/lectureAccess.js";
import { locateLecture, parseLectureId } from "../services/lectureLocator.js";
import { rewriteMediaPlaylist } from "../services/playlist.js";
import { askedForKeyTooOften, clampSeconds, isCurrentStream, startedTooMany, streamIdFrom } from "../services/streams.js";
import PlaybackStream from "../models/PlaybackStream.js";
import PlaybackLog from "../models/PlaybackLog.js";
import LectureVideo from "../models/LectureVideo.js";

// Long enough to watch a lecture, pause for a while and carry on; short enough that a copied link dies.
const SEGMENT_LINK_SECONDS = 3 * 60 * 60;
const VARIANT = /^v[0-3]$/;

const refuse = (res, decision) => {
  const status = decision.reason === "login" ? 401 : decision.reason === "unknown" || decision.reason === "coming_soon" ? 404 : 403;
  const message = {
    login: "Log in to watch this lecture.",
    plan: "This lecture needs an active plan.",
    unknown: "Lecture not found.",
    coming_soon: "Lectures are coming soon.",
  }[decision.reason];
  return res.status(status).json({ success: false, message });
};

// Runs on every request: the playlists and the key are never served without this check.
async function authorise(req, res) {
  const lecture = await locateLecture(req.params.lectureId);
  const decision = lecture ? lectureDecision(req.user, lecture.index) : { allowed: false, reason: req.user ? "unknown" : "login" };
  if (!decision.allowed) {
    refuse(res, decision);
    return null;
  }
  return lecture;
}

// One stream per account: the player sends its own id on every request. The master playlist starts a
// stream (replacing any other one); everything after that must come from the current stream.
const anotherDevice = (res) =>
  res.status(409).json({ success: false, code: "another_device", message: "This account is watching on another device." });

async function requireCurrentStream(req, res) {
  const streamId = streamIdFrom(req.header("X-Stream-Id"));
  const current = streamId ? await PlaybackStream.findOne({ user: req.user._id }).lean() : null;
  if (!isCurrentStream(current, streamId)) {
    anotherDevice(res);
    return false;
  }
  return true;
}

async function readText(key) {
  const { bucket } = r2Config();
  const object = await r2().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return object.Body.transformToString();
}

const notFoundOr = (res, error) =>
  error?.name === "NoSuchKey"
    ? res.status(404).json({ success: false, message: "This lecture's video is not available yet." })
    : res.status(500).json({ success: false, message: "Could not load the video." });

const noStore = (res) => res.set("Cache-Control", "private, no-store");

export const getMasterPlaylist = async (req, res) => {
  const lecture = await authorise(req, res);
  if (!lecture) return undefined;
  const streamId = streamIdFrom(req.header("X-Stream-Id"));
  if (!streamId) return res.status(400).json({ success: false, message: "Missing stream id." });
  try {
    // Pulling the whole library needs hundreds of starts; a student never does. Refuse and say why.
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [hour, day] = await Promise.all([
      PlaybackLog.distinct("lectureId", { user: req.user._id, startedAt: { $gte: hourAgo } }),
      PlaybackLog.distinct("lectureId", { user: req.user._id, startedAt: { $gte: dayAgo } }),
    ]);
    if (startedTooMany({ lastHour: hour.length, lastDay: day.length })) {
      res.set("Retry-After", "3600");
      return res.status(429).json({ success: false, message: "You have started a lot of lectures very quickly. Please take a break and try again later." });
    }
    const text = await readText(`lectures/${lecture.id}/master.m3u8`);
    const now = new Date();
    await PlaybackStream.findOneAndUpdate(
      { user: req.user._id },
      { $set: { streamId, lectureId: lecture.id, startedAt: now, lastSeenAt: now, keyFetches: 0 } },
      { upsert: true }
    );
    await PlaybackLog.create({
      user: req.user._id,
      streamId,
      lectureId: lecture.id,
      ip: String(req.ip || "").slice(0, 64),
      userAgent: String(req.header("User-Agent") || "").slice(0, 200),
    });
    noStore(res);
    return res.type("application/vnd.apple.mpegurl").send(text);
  } catch (error) {
    return notFoundOr(res, error);
  }
};

export const getMediaPlaylist = async (req, res) => {
  const lecture = await authorise(req, res);
  if (!lecture) return undefined;
  const { variant } = req.params;
  if (!VARIANT.test(variant)) return res.status(404).json({ success: false, message: "Not found." });
  try {
    if (!(await requireCurrentStream(req, res))) return undefined;
    const { bucket } = r2Config();
    const text = await readText(`lectures/${lecture.id}/${variant}/index.m3u8`);
    // Signing is local work (no network), so doing it for every segment on each request is cheap.
    const segments = new Map();
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    await Promise.all(
      lines.map(async (name) => {
        const url = await getSignedUrl(r2(), new GetObjectCommand({ Bucket: bucket, Key: `lectures/${lecture.id}/${variant}/${name}` }), {
          expiresIn: SEGMENT_LINK_SECONDS,
        });
        segments.set(name, url);
      })
    );
    noStore(res);
    return res.type("application/vnd.apple.mpegurl").send(rewriteMediaPlaylist(text, (name) => segments.get(name)));
  } catch (error) {
    return notFoundOr(res, error);
  }
};

export const getLectureKey = async (req, res) => {
  const lecture = await authorise(req, res);
  if (!lecture) return undefined;
  try {
    const streamId = streamIdFrom(req.header("X-Stream-Id"));
    const current = streamId
      ? await PlaybackStream.findOneAndUpdate({ user: req.user._id, streamId }, { $inc: { keyFetches: 1 } }, { new: true }).lean()
      : null;
    if (!isCurrentStream(current, streamId)) return anotherDevice(res);
    if (askedForKeyTooOften(current.keyFetches)) {
      return res.status(429).json({ success: false, message: "Too many requests for this lecture. Reload the page to start again." });
    }
    noStore(res);
    return res.type("application/octet-stream").send(lectureKey(process.env.VIDEO_KEY_SECRET, lecture.id));
  } catch {
    return res.status(500).json({ success: false, message: "Could not load the video." });
  }
};

// The player reports in every half minute. A heartbeat from a replaced stream tells that device to stop.
export const heartbeat = async (req, res) => {
  const streamId = streamIdFrom(req.body?.streamId);
  const lecture = parseLectureId(req.body?.lectureId);
  if (!streamId || !lecture) return res.status(400).json({ success: false, message: "Invalid request." });
  const now = new Date();
  const current = await PlaybackStream.findOneAndUpdate({ user: req.user._id, streamId }, { $set: { lastSeenAt: now } });
  if (!current) return anotherDevice(res);
  await PlaybackLog.updateOne(
    { user: req.user._id, streamId },
    { $set: { lastSeenAt: now, watchedSeconds: clampSeconds(req.body?.watchedSeconds) } }
  );
  return res.status(200).json({ success: true });
};

// Which lectures have a live video. Not secret, and cached briefly.
export const availableLectures = async (_req, res) => {
  const rows = await LectureVideo.find({ status: "live" }).select("lectureId durationSec -_id").lean();
  res.set("Cache-Control", "public, max-age=60");
  return res.status(200).json({ success: true, lectures: rows.map((r) => [r.lectureId, r.durationSec]) });
};
