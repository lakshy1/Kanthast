import mongoose from "mongoose";

// A parent's approval for the student to use the class feed in Doubts.
const parentConsentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    parentName: { type: String, trim: true, required: true, maxlength: 80 },
    parentEmail: { type: String, trim: true, lowercase: true, required: true, maxlength: 200 },
    status: { type: String, enum: ["pending", "approved", "withdrawn"], default: "pending" },
    // The code is never stored, only a keyed hash of it.
    codeHash: { type: String, default: "" },
    codeExpiresAt: { type: Date, default: null },
    codeSentAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
    approvedAt: { type: Date, default: null },
    withdrawnAt: { type: Date, default: null },
    termsVersion: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("ParentConsent", parentConsentSchema);
