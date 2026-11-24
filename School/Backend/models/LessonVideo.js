import mongoose from "mongoose";

// A lesson whose encrypted video is in storage. The library asks for the list of live lessons, so a new
// video appears as soon as it is registered, with no new deploy. "hidden" pulls one back without deleting it.
const lessonVideoSchema = new mongoose.Schema(
  {
    lessonId: { type: String, required: true, unique: true, trim: true },
    durationSec: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["live", "hidden"], default: "live" },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("LessonVideo", lessonVideoSchema);
