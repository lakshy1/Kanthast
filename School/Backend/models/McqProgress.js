// McqProgress.js
// Per-user, per-question spaced-repetition state.
// Tracks how well a student knows each question so we can prioritise weak ones.
// Uses a simplified SM-2-inspired algorithm: easeFactor + interval + reps.
import mongoose from "mongoose";

const mcqProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: "McqQuestion", required: true },

    // SM-2 state
    reps: { type: Number, default: 0 },      // consecutive correct answers
    easeFactor: { type: Number, default: 2.5 }, // 1.3 to 3.0
    interval: { type: Number, default: 1 },    // days until next review
    lapses: { type: Number, default: 0 },      // times reset by wrong answer

    // When this question is next due for review (for a "due today" mode)
    nextReviewAt: { type: Date, default: Date.now },

    lastAnsweredAt: { type: Date, default: null },
    lastCorrect: { type: Boolean, default: null },

    // Rolling stats
    totalAttempts: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
  },
  { timestamps: true }
);

mcqProgressSchema.index({ user: 1, question: 1 }, { unique: true });
mcqProgressSchema.index({ user: 1, nextReviewAt: 1 });

// SM-2 grade: 0-2 → fail, 3-5 → pass. We map MCQ performance to grade 1–5.
mcqProgressSchema.statics.sm2Update = function (record, grade) {
  // grade 1 = wrong (hard fail), 3 = slow correct, 5 = instant correct
  if (grade >= 3) {
    if (record.reps === 0) record.interval = 1;
    else if (record.reps === 1) record.interval = 6;
    else record.interval = Math.round(record.interval * record.easeFactor);
    record.reps += 1;
    record.easeFactor = Math.max(1.3, record.easeFactor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  } else {
    // Wrong: reset, schedule for today
    record.reps = 0;
    record.interval = 1;
    record.lapses += 1;
    record.easeFactor = Math.max(1.3, record.easeFactor - 0.2);
  }
  record.nextReviewAt = new Date(Date.now() + record.interval * 24 * 60 * 60 * 1000);
};

export default mongoose.model("McqProgress", mcqProgressSchema);
