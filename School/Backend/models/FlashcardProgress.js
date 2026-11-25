// FlashcardProgress.js — SuperMemo SM-2 spaced repetition state per student per card
import mongoose from "mongoose";

const progressHistorySchema = new mongoose.Schema(
  {
    rating: { type: Number, required: true },
    interval: { type: Number, required: true },
    easeFactor: { type: Number, required: true },
    reviewedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const flashcardProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    card: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flashcard",
      required: true,
      index: true,
    },

    schoolClass: {
      type: String,
      default: "10",
      index: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // SM-2 Ease Factor: minimum 1.3, default 2.5
    easeFactor: {
      type: Number,
      default: 2.5,
      min: 1.3,
    },

    // Interval until next review (in days)
    interval: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Number of consecutive successful recalls (rating >= 3)
    repetition: {
      type: Number,
      default: 0,
      min: 0,
    },

    // When the card is scheduled for next spaced review
    nextReviewAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    lastReviewedAt: {
      type: Date,
      default: null,
    },

    lastRating: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: null,
    },

    history: [progressHistorySchema],
  },
  { timestamps: true }
);

// One progress record per student per card
flashcardProgressSchema.index({ user: 1, card: 1 }, { unique: true });
flashcardProgressSchema.index({ user: 1, nextReviewAt: 1 });

const FlashcardProgress =
  mongoose.models.FlashcardProgress ||
  mongoose.model("FlashcardProgress", flashcardProgressSchema);

export default FlashcardProgress;
