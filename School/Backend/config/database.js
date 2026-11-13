// config/database.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// School uses its own database. MONGODB_DB overrides the name in the URL
// so this app never shares collections with Kanthast Professional.
export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      dbName: process.env.MONGODB_DB || "kanthast_school",
    });
    console.log("DB Connected Successfully");
    console.log("Mongo DB Name:", mongoose.connection.name);
  } catch (err) {
    console.error("DB Connection Failed:", err.message);
    process.exit(1);
  }
};
