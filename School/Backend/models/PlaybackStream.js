import mongoose from "mongoose";

// The one stream a student may have running. Starting a lesson on a second device replaces this record,
// and the first device finds out on its next heartbeat or request.
const playbackStreamSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    streamId: { type: String, required: true },
    lessonId: { type: String, required: true },
    startedAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("PlaybackStream", playbackStreamSchema);
