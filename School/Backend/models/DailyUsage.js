import mongoose from "mongoose";

// One record per user per day (India time). The source of truth for daily limits:
// the in-memory chat limiter resets whenever a server copy restarts, this does not.
const dailyUsageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    day: { type: String, required: true }, // "YYYY-MM-DD" in IST
    posts: { type: Number, default: 0, min: 0 },
    aiMessages: { type: Number, default: 0, min: 0 },
    videos: { type: Number, default: 0, min: 0 },
    // Safety checks (Gemini moderation) run for this user: new doubts, replies, carried chat answers.
    checks: { type: Number, default: 0, min: 0 },
    // Failed chat sends whose AI message was given back. Capped, so failures cannot be repeated for free.
    refunds: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

dailyUsageSchema.index({ user: 1, day: 1 }, { unique: true });

export default mongoose.model("DailyUsage", dailyUsageSchema);
