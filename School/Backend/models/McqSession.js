// McqSession.js
// A timed practice session. Created when the student starts, updated after
// each answer, closed (status: "done") when the student finishes or the
// optional timer expires.
import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "McqQuestion", required: true },
    // The option index the student chose (0-3), after client shuffle is reversed.
    // null = skipped / time-out for that question.
    chosenIndex: { type: Number, default: null, min: 0, max: 3 },
    isCorrect: { type: Boolean, default: false },
    // Client-measured ms from question display to submission — used for pacing analytics
    responseMs: { type: Number, default: null },
    answeredAt: { type: Date, default: null },
  },
  { _id: false }
);

const mcqSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Scope of this session
    schoolClass: { type: String, required: true, enum: ["8", "9", "10"] },
    subject: { type: String, required: true },
    // null means mixed/all chapters
    chapterNo: { type: Number, default: null },
    mode: { type: String, enum: ["practice", "test"], default: "practice" },
    difficulty: { type: String, enum: ["easy", "medium", "hard", "mixed"], default: "mixed" },

    // The ordered question IDs drawn for this session
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "McqQuestion" }],

    // Filled in as the student progresses
    answers: [answerSchema],

    // Summary (computed when session ends)
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    timeTakenMs: { type: Number, default: null },

    status: { type: String, enum: ["active", "done", "abandoned"], default: "active", index: true },

    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

mcqSessionSchema.index({ user: 1, status: 1, createdAt: -1 });

export default mongoose.model("McqSession", mcqSessionSchema);
