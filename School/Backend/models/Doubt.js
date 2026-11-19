import mongoose from "mongoose";

// Subjects a doubt can be filed under. Matches the School catalogue, plus "Other".
export const DOUBT_SUBJECTS = [
  "Mathematics",
  "Science",
  "Social Science",
  "English",
  "Hindi",
  "Sanskrit",
  "Information Technology",
  "Other",
];

// live: visible to the class. pending: held for an admin. removed: deleted or taken down.
export const DOUBT_STATUSES = ["live", "pending", "removed"];

const doubtSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Copied from the author's account when posted. The feed is always filtered by it.
    schoolClass: { type: String, required: true },
    subject: { type: String, enum: DOUBT_SUBJECTS, required: true },
    chapter: { type: String, trim: true, maxlength: 120, default: "" },
    title: { type: String, trim: true, required: true, maxlength: 150 },
    body: { type: String, trim: true, default: "", maxlength: 4000 },
    status: { type: String, enum: DOUBT_STATUSES, default: "live" },
    // Why it is not live: "reported" (hidden by reports), "deleted_by_author", "removed_by_moderator".
    holdReason: { type: String, default: "" },
    // Bumped by every moderator action. An action only applies to the version the admin's request
    // read, so two admins acting at once cannot both change the item (see controllers/DoubtsAdmin.js).
    modVersion: { type: Number, default: 0 },
    acceptedReply: { type: mongoose.Schema.Types.ObjectId, ref: "DoubtReply", default: null },
    replyCount: { type: Number, default: 0, min: 0 },
    helpfulCount: { type: Number, default: 0, min: 0 },
    hasAiAnswer: { type: Boolean, default: false },
    // The assistant chat this doubt was posted from, if any. Kept for audit, never shown.
    sourceChatSession: { type: String, default: "" },
  },
  { timestamps: true }
);

doubtSchema.index({ schoolClass: 1, status: 1, createdAt: -1 });
doubtSchema.index({ title: "text", body: "text" });

export default mongoose.model("Doubt", doubtSchema);
