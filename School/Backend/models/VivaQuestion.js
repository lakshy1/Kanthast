// models/VivaQuestion.js — Oral Viva Voce question & grading rubric model
import mongoose from "mongoose";

const rubricPointSchema = new mongoose.Schema(
  {
    point: { type: String, required: true },
    keywords: [{ type: String, required: true }],
    weight: { type: Number, default: 1 },
  },
  { _id: false }
);

const vivaQuestionSchema = new mongoose.Schema(
  {
    schoolClass: {
      type: String,
      required: true,
      default: "10",
      index: true,
    },
    subject: {
      type: String,
      required: true,
      index: true,
    },
    chapterNo: {
      type: Number,
      required: true,
      index: true,
    },
    chapterTitle: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
      index: true,
    },
    examinerContext: {
      type: String,
      default: "Board Viva Examiner",
    },
    question: {
      type: String,
      required: true,
    },
    hint: {
      type: String,
      default: "",
    },
    rubricPoints: {
      type: [rubricPointSchema],
      required: true,
      validate: [(v) => v.length >= 2, "At least 2 rubric points required"],
    },
    modelAnswer: {
      type: String,
      required: true,
    },
    examinerTip: {
      type: String,
      default: "",
    },
    followUpQuestion: {
      type: String,
      default: "",
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

vivaQuestionSchema.index({ schoolClass: 1, subject: 1, chapterNo: 1, difficulty: 1 });

export default mongoose.model("VivaQuestion", vivaQuestionSchema);
