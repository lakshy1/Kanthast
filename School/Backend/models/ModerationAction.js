import mongoose from "mongoose";

export const MODERATION_ACTIONS = ["approve", "remove", "restore", "mute", "unmute"];

// One record per admin decision in Doubts moderation. Append-only: there are no routes that change
// or delete these, and the hooks below refuse updates and deletes made through the model.
const moderationActionSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: MODERATION_ACTIONS, required: true },
    targetType: { type: String, enum: ["doubt", "reply", "user"], required: true },
    target: { type: mongoose.Schema.Types.ObjectId, required: true },
    // The student who wrote the item (or the muted student). Empty for an AI answer.
    targetAuthor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    note: { type: String, trim: true, maxlength: 500, default: "" },
    // Items: live / pending / removed. Users: active / muted.
    beforeStatus: { type: String, default: "" },
    afterStatus: { type: String, default: "" },
    // Items: how many open reports this action resolved. Mute: the duration chosen and the end.
    reportsResolved: { type: Number, default: 0 },
    muteDays: { type: mongoose.Schema.Types.Mixed, default: null }, // 1, 7, 30 or "permanent"
    mutedUntil: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

moderationActionSchema.index({ createdAt: -1, _id: -1 });
moderationActionSchema.index({ targetType: 1, target: 1, createdAt: -1 });
moderationActionSchema.index({ targetAuthor: 1, createdAt: -1 });

const appendOnly = function () {
  throw new Error("Moderation actions are append-only.");
};
for (const op of [
  "updateOne",
  "updateMany",
  "findOneAndUpdate",
  "findOneAndReplace",
  "replaceOne",
  "deleteOne",
  "deleteMany",
  "findOneAndDelete",
]) {
  moderationActionSchema.pre(op, appendOnly);
}

export default mongoose.model("ModerationAction", moderationActionSchema);
