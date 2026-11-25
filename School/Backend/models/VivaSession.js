// models/VivaSession.js — Tracks an oral Viva Coach practice session & evaluations
import mongoose from "mongoose";

const evaluationSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VivaQuestion",
      required: true,
    },
    questionIndex: { type: Number, required: true },
    transcript: { type: String, required: true },
    inputMode: { type: String, enum: ["voice", "text"], default: "text" },
    score: { type: Number, required: true, min: 0, max: 100 },
    verdict: {
      type: String,
      enum: ["excellent", "good", "needs_polish"],
      required: true,
    },
    matchedPoints: [{ type: String }],
    missedPoints: [{ type: String }],
    feedback: { type: String, default: "" },
    responseMs: { type: Number, default: 0 },
  },
  { _id: false }
);

const conversationMessageSchema = new mongoose.Schema(
  {
    speaker: { type: String, enum: ["elena", "student"], required: true },
    text: { type: String, required: true },
    kind: {
      type: String,
      enum: ["greeting", "question", "answer", "feedback", "system"],
      default: "system",
    },
    score: { type: Number, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const vivaSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    schoolClass: {
      type: String,
      required: true,
      default: "10",
    },
    subject: {
      type: String,
      required: true,
    },
    chapterNo: {
      type: Number,
      default: null,
    },
    chapterTitle: {
      type: String,
      default: "",
    },
    mode: {
      type: String,
      enum: ["standard", "strict"],
      default: "standard",
    },
    difficulty: {
      type: String,
      enum: ["mixed", "easy", "medium", "hard"],
      default: "mixed",
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "VivaQuestion",
      },
    ],
    evaluations: [evaluationSchema],
    conversationLog: [conversationMessageSchema],
    overallScore: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    ratingLabel: {
      type: String,
      default: "",
    },
    strongCount: {
      type: Number,
      default: 0,
    },
    needsWorkCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["in_progress", "completed", "declined"],
      default: "in_progress",
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

vivaSessionSchema.index({ userId: 1, completedAt: -1 });

export default mongoose.model("VivaSession", vivaSessionSchema);
