import jwt from "jsonwebtoken";
import { JWT_OPTIONS } from "../config/app.js";
import dotenv from "dotenv";
import User from "../models/User.js";
import { getActiveSessionByToken, markSessionSeen } from "../utils/sessionManager.js";

dotenv.config();

// ====================== AUTH ======================
export const auth = async (req, res, next) => {
  try {
    // Header only. Cookies are shared across ports on localhost and across
    // subdomains, so they could carry the other product's session.
    const token = req.header("Authorization")?.replace("Bearer ", "").trim();
    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, JWT_OPTIONS);
    req.authTokenId = decoded?.jti || "";

    if (decoded?.jti) {
      const session = await getActiveSessionByToken(decoded.jti);
      if (!session || String(session.user) !== String(decoded.id)) {
        return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
      }
      req.session = session;
      await markSessionSeen(decoded.jti);
    }

    // Attach user to request
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// ====================== ROLE CHECKS ======================
export const isStudent = (req, res, next) => {
  if (req.user.accountType !== "Student") {
    return res.status(403).json({ success: false, message: "Access denied: Students only" });
  }
  next();
};

export const isInstructor = (req, res, next) => {
  if (req.user.accountType !== "Instructor") {
    return res.status(403).json({ success: false, message: "Access denied: Instructors only" });
  }
  next();
};

export const isAdmin = (req, res, next) => {
  if (req.user.accountType !== "Admin") {
    return res.status(403).json({ success: false, message: "Access denied: Admins only" });
  }
  next();
};
