import mongoose from "mongoose";

const doubtReplySchema = new mongoose.Schema(
  {
    doubt: { type: mongoose.Schema.Types.ObjectId, ref: "Doubt", required: true },
    // Empty for an AI answer.
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isAI: { type: Boolean, default: false },
    // For an AI answer: the student who asked for it. Kept for audit, never shown.
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    body: { type: String, trim: true, required: true, maxlength: 4000 },
    status: { type: String, enum: ["live", "pending", "removed"], default: "live" },
    holdReason: { type: String, default: "" },
    modVersion: { type: Number, default: 0 }, // see models/Doubt.js
    helpfulCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

doubtReplySchema.index({ doubt: 1, status: 1, createdAt: 1 });

export default mongoose.model("DoubtReply", doubtReplySchema);
