import mongoose from "mongoose";

// One "This helped me" per student per doubt or reply.
const doubtReactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["doubt", "reply"], required: true },
    target: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

doubtReactionSchema.index({ user: 1, targetType: 1, target: 1 }, { unique: true });

export default mongoose.model("DoubtReaction", doubtReactionSchema);
