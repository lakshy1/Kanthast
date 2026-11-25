// McqQuestion.js
// MCQ item bank for the Practice Studio. Each question belongs to one subject,
// chapter and topic (the same taxonomy as the lesson catalog) for a given class.
// Options are stored in a fixed 4-element array; correct_index is 0-based.
// Difficulty: 1 (easy) | 2 (medium) | 3 (hard).
import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, maxlength: 800 },
    // Per-option distractor explanation: why a student might pick this wrong answer.
    // Only shown when this option is chosen incorrectly.
    distractorNote: { type: String, default: "" },
  },
  { _id: false }
);

const mcqSchema = new mongoose.Schema(
  {
    // "10" | "9" | "8"
    schoolClass: { type: String, required: true, enum: ["8", "9", "10"], index: true },

    // "Mathematics" | "Science" | "Social Science" | "English" | "Hindi" | "Information Technology"
    subject: { type: String, required: true, trim: true, index: true },

    // Chapter number within the subject (matches schoolLessons.json)
    chapterNo: { type: Number, required: true, min: 1 },
    chapterTitle: { type: String, required: true, trim: true },

    // Topic number within chapter (matches schoolLessons.json topics array index)
    topicNo: { type: Number, default: null },
    topicTitle: { type: String, default: "", trim: true },

    // The question stem
    stem: { type: String, required: true, maxlength: 2000 },

    // Exactly 4 options. The frontend shuffles them on each render.
    options: {
      type: [optionSchema],
      validate: { validator: (arr) => arr.length === 4, message: "Exactly 4 options required" },
    },

    // 0-based index into options[] that is correct — stored server-side, never
    // sent to the client until the user submits an answer.
    correctIndex: { type: Number, required: true, min: 0, max: 3 },

    // Explanation shown to the student AFTER they answer.
    explanation: { type: String, required: true, maxlength: 3000 },

    // Optional key concept summary (1-2 sentences) shown as a mini-pill below explanation.
    keyConcept: { type: String, default: "", maxlength: 400 },

    difficulty: { type: Number, enum: [1, 2, 3], default: 2 },

    // Quality flags
    isPublished: { type: Boolean, default: true, index: true },

    // Tags for future adaptive / topic-filter features
    tags: [{ type: String, trim: true }],

    createdBy: { type: String, default: "seed" }, // "seed" | admin userId
  },
  { timestamps: true }
);

// Compound indexes for the two most common query patterns:
//   • getPracticeSet: class + subject + (optionally chapter) + published
//   • adaptive selector: class + subject + difficulty + published
mcqSchema.index({ schoolClass: 1, subject: 1, chapterNo: 1, isPublished: 1 });
mcqSchema.index({ schoolClass: 1, subject: 1, difficulty: 1, isPublished: 1 });

export default mongoose.model("McqQuestion", mcqSchema);
