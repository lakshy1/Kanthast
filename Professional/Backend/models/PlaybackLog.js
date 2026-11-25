import mongoose from "mongoose";

// One row per time a student starts a lecture: who, what, when, from where, and how long they stayed.
// If a recording leaks, the watermark names an account and session, and this shows where and when it played.
const playbackLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    streamId: { type: String, required: true, index: true },
    lectureId: { type: String, required: true, index: true },
    startedAt: { type: Date, default: Date.now, index: true },
    lastSeenAt: { type: Date, default: Date.now },
    watchedSeconds: { type: Number, default: 0, min: 0 },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("PlaybackLog", playbackLogSchema);
