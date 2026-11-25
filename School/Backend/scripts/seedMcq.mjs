/**
 * Seed script: insert Class X MCQ questions into MongoDB.
 * Usage:  node scripts/seedMcq.mjs
 * Requires MONGODB_URI env var (or .env file at School/Backend/.env).
 */

import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load env from School/Backend/.env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Import the seed data (CommonJS export via named export)
const { CLASS_10_MCQ_QUESTIONS } = await import("../data/class10McqSeed.js");

// Import the model
const { default: McqQuestion } = await import("../models/McqQuestion.js");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌  MONGODB_URI not found in environment. Add it to School/Backend/.env");
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
console.log("✅  Connected to MongoDB");

// Remove any existing seed questions so re-running is idempotent
const removed = await McqQuestion.deleteMany({ createdBy: "seed" });
console.log(`🗑   Removed ${removed.deletedCount} existing seed questions`);

// Insert all 30 questions
const inserted = await McqQuestion.insertMany(CLASS_10_MCQ_QUESTIONS);
console.log(`🌱  Seeded ${inserted.length} MCQ questions for Class X`);

// Summary by subject
const bySubject = inserted.reduce((acc, q) => {
  acc[q.subject] = (acc[q.subject] || 0) + 1;
  return acc;
}, {});
console.log("   Subject breakdown:", bySubject);

await mongoose.disconnect();
console.log("👋  Done");
