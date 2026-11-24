import mongoose from "mongoose";

// Emails collected by the "Join the waitlist" form on the Kanthast home page.
const waitlistSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    interest: { type: String, enum: ["professional", "school", "both"], default: "both" },
    source: { type: String, default: "kanthast-home", maxlength: 60 },
  },
  { timestamps: true }
);

export default mongoose.model("WaitlistEntry", waitlistSchema);
