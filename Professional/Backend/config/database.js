// config/database.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Professional uses its own database. Set MONGODB_DB to override the database name in
// MONGODB_URL (unset keeps the existing one, so current data is untouched).
export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      dbName: process.env.MONGODB_DB || undefined,
    });
    console.log("DB Connected Successfully");
    console.log("Mongo DB Name:", mongoose.connection.name);
  } catch (err) {
    console.error("DB Connection Failed:", err.message);
    process.exit(1);
  }
};
