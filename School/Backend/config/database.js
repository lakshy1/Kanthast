// config/database.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// One shared connection promise. Serverless functions freeze between requests,
// so every request awaits this instead of assuming a startup connect finished.
let connecting = null;

export const connectDB = () => {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose.connection);
  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGODB_URL, {
        dbName: process.env.MONGODB_DB || "kanthast_school",
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => {
        console.log("DB Connected:", m.connection.name);
        return m.connection;
      })
      .catch((err) => {
        connecting = null;
        console.error("DB Connection Failed:", err.message);
        throw err;
      });
  }
  return connecting;
};
