import mongoose from "mongoose";

export const REPORT_REASONS = ["abuse", "personal_info", "spam", "wrong_answer", "other"];

const doubtReportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["doubt", "reply"], required: true },
    target: { type: mongoose.Schema.Types.ObjectId, required: true },
    schoolClass: { type: String, required: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    note: { type: String, trim: true, maxlength: 500, default: "" },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
    // Set when an admin acts on the item: approve dismisses its open reports, remove upholds them.
    resolution: { type: String, enum: ["", "dismissed", "upheld"], default: "" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// A student can report the same item once.
doubtReportSchema.index({ reporter: 1, targetType: 1, target: 1 }, { unique: true });
doubtReportSchema.index({ status: 1, createdAt: -1 });
doubtReportSchema.index({ targetType: 1, target: 1, status: 1 });

export default mongoose.model("DoubtReport", doubtReportSchema);
