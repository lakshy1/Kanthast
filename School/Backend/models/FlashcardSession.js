// FlashcardSession.js — Tracks student study sessions in the Flashcard Studio
import mongoose from "mongoose";

const cardReviewSchema = new mongoose.Schema(
  {
    card: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flashcard",
      required: true,
    },
    // 1: Again (reset/repeat today), 2: Hard, 3: Good, 4: Easy
    rating: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: true,
    },
    responseMs: {
      type: Number,
      default: 0,
    },
    reviewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const flashcardSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    schoolClass: {
      type: String,
      enum: ["8", "9", "10"],
      default: "10",
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      index: true,
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
      enum: ["practice", "spaced_review", "cram"],
      default: "practice",
    },

    cardsReviewed: [cardReviewSchema],

    cardsTotal: {
      type: Number,
      default: 0,
    },

    // Percentage of cards reviewed with rating >= 3 (Good or Easy)
    masteryScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    againCount: {
      type: Number,
      default: 0,
    },
    hardCount: {
      type: Number,
      default: 0,
    },
    goodCount: {
      type: Number,
      default: 0,
    },
    easyCount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
      index: true,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

flashcardSessionSchema.index({ user: 1, createdAt: -1 });

const FlashcardSession =
  mongoose.models.FlashcardSession ||
  mongoose.model("FlashcardSession", flashcardSessionSchema);

export default FlashcardSession;
