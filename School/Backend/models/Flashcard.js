// Flashcard.js — Flashcard item bank for Practice Studio
import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema(
  {
    // "10" | "9" | "8"
    schoolClass: {
      type: String,
      required: true,
      enum: ["8", "9", "10"],
      default: "10",
      index: true,
    },

    // "Science" | "Mathematics" | "Social Science" | "English" | "Hindi"
    subject: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    chapterNo: {
      type: Number,
      required: true,
      min: 1,
      index: true,
    },
    chapterTitle: {
      type: String,
      required: true,
      trim: true,
    },

    topicNo: {
      type: Number,
      default: null,
    },
    topicTitle: {
      type: String,
      default: "",
      trim: true,
    },

    // Front of card: Prompt, Term, Law or Formula question
    front: {
      type: String,
      required: true,
      maxlength: 2000,
      trim: true,
    },

    // Front hint pill (e.g., "SI Unit", "Think about Ohm's Law", "Derivation")
    frontHint: {
      type: String,
      default: "",
      maxlength: 300,
      trim: true,
    },

    // Back of card: Core answer, definition or mathematical derivation
    back: {
      type: String,
      required: true,
      maxlength: 4000,
      trim: true,
    },

    // High-yield takeaway bullet points for rapid revision
    keyTakeaway: {
      type: String,
      default: "",
      maxlength: 1000,
      trim: true,
    },

    // Memory aid or mnemonic pro-tip (e.g. "OIL RIG: Oxidation Is Loss, Reduction Is Gain")
    mnemonic: {
      type: String,
      default: "",
      maxlength: 1000,
      trim: true,
    },

    // Clean formula notation or LaTeX snippet
    formula: {
      type: String,
      default: "",
      maxlength: 500,
      trim: true,
    },

    // Difficulty: 1 (easy/foundational) | 2 (medium/standard) | 3 (hard/advanced)
    difficulty: {
      type: Number,
      enum: [1, 2, 3],
      default: 2,
    },

    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },

    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

flashcardSchema.index({ schoolClass: 1, subject: 1, chapterNo: 1 });

const Flashcard =
  mongoose.models.Flashcard || mongoose.model("Flashcard", flashcardSchema);

export default Flashcard;
