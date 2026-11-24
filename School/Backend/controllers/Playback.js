import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, r2Config } from "../config/r2.js";
import { lessonKey } from "../utils/videoKeys.js";
import { parseLessonId, playbackDecision } from "../services/lessonAccess.js";
import { rewriteMediaPlaylist } from "../services/playlist.js";
import { clampSeconds, isCurrentStream, streamIdFrom } from "../services/streams.js";
import PlaybackStream from "../models/PlaybackStream.js";
import PlaybackLog from "../models/PlaybackLog.js";
import LessonVideo from "../models/LessonVideo.js";

// Long enough to watch a lesson, pause for a while and carry on; short enough that a copied link dies.
const SEGMENT_LINK_SECONDS = 3 * 60 * 60;
const VARIANT = /^v[0-3]$/;

const refuse = (res, decision) => {
  const status = decision.reason === "login" ? 401 : decision.reason === "unknown" ? 404 : 403;
  const message = {
    login: "Log in to watch this lesson.",
    plan: "This lesson needs an active plan for this class.",
    unknown: "Lesson not found.",
  }[decision.reason];
  return res.status(status).json({ success: false, message });
};

// Runs on every request: the playlists and the key are never served without this check.
const authorise = (req, res) => {
  const lesson = parseLessonId(req.params.lessonId);
  const decision = playbackDecision(req.user, lesson);
  if (!decision.allowed) {
    refuse(res, decision);
    return null;
  }
  return lesson;
};

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
    ? res.status(404).json({ success: false, message: "This lesson's video is not available yet." })
    : res.status(500).json({ success: false, message: "Could not load the video." });

const noStore = (res) => res.set("Cache-Control", "private, no-store");

export const getMasterPlaylist = async (req, res) => {
  const lesson = authorise(req, res);
  if (!lesson) return undefined;
  const streamId = streamIdFrom(req.header("X-Stream-Id"));
  if (!streamId) return res.status(400).json({ success: false, message: "Missing stream id." });
  try {
    const text = await readText(`lessons/${lesson.id}/master.m3u8`);
    const now = new Date();
    await PlaybackStream.findOneAndUpdate(
      { user: req.user._id },
      { $set: { streamId, lessonId: lesson.id, startedAt: now, lastSeenAt: now } },
      { upsert: true }
    );
    await PlaybackLog.create({
      user: req.user._id,
      streamId,
      lessonId: lesson.id,
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
  const lesson = authorise(req, res);
  if (!lesson) return undefined;
  const { variant } = req.params;
  if (!VARIANT.test(variant)) return res.status(404).json({ success: false, message: "Not found." });
  try {
    if (!(await requireCurrentStream(req, res))) return undefined;
    const { bucket } = r2Config();
    const text = await readText(`lessons/${lesson.id}/${variant}/index.m3u8`);
    // Signing is local work (no network), so doing it for every segment on each request is cheap.
    const segments = new Map();
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    await Promise.all(
      lines.map(async (name) => {
        const url = await getSignedUrl(r2(), new GetObjectCommand({ Bucket: bucket, Key: `lessons/${lesson.id}/${variant}/${name}` }), {
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

export const getLessonKey = async (req, res) => {
  const lesson = authorise(req, res);
  if (!lesson) return undefined;
  try {
    if (!(await requireCurrentStream(req, res))) return undefined;
    noStore(res);
    return res.type("application/octet-stream").send(lessonKey(process.env.VIDEO_KEY_SECRET, lesson.id));
  } catch {
    return res.status(500).json({ success: false, message: "Could not load the video." });
  }
};

// The player reports in every half minute. A heartbeat from a replaced stream tells that device to stop.
export const heartbeat = async (req, res) => {
  const streamId = streamIdFrom(req.body?.streamId);
  const lesson = parseLessonId(req.body?.lessonId);
  if (!streamId || !lesson) return res.status(400).json({ success: false, message: "Invalid request." });
  const now = new Date();
  const current = await PlaybackStream.findOneAndUpdate({ user: req.user._id, streamId }, { $set: { lastSeenAt: now } });
  if (!current) return anotherDevice(res);
  await PlaybackLog.updateOne(
    { user: req.user._id, streamId },
    { $set: { lastSeenAt: now, watchedSeconds: clampSeconds(req.body?.watchedSeconds) } }
  );
  return res.status(200).json({ success: true });
};

// Which lessons have a live video. Not secret, and cached briefly: the library merges it into its catalog.
export const availableLessons = async (_req, res) => {
  const rows = await LessonVideo.find({ status: "live" }).select("lessonId durationSec -_id").lean();
  res.set("Cache-Control", "public, max-age=60");
  return res.status(200).json({ success: true, lessons: rows.map((r) => [r.lessonId, r.durationSec]) });
};
