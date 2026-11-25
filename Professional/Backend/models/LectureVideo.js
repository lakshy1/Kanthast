import mongoose from "mongoose";

// A lecture whose encrypted video is in storage. lectureId is the lecture's _id inside the Medicine library.
// A video appears in the library the moment it is registered here; "hidden" pulls one back without deleting it.
const lectureVideoSchema = new mongoose.Schema(
  {
    lectureId: { type: String, required: true, unique: true, trim: true, match: /^[a-f0-9]{24}$/i },
    durationSec: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["live", "hidden"], default: "live" },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("LectureVideo", lectureVideoSchema);
