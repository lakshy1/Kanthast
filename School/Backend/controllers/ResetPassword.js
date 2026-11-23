import crypto from "crypto";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import mailSender from "../utils/mailSender.js";
import { revokeAllActiveSessions } from "../utils/sessionManager.js";

const MIN_PASSWORD_LENGTH = 8;
const RESET_TOKEN = /^[a-f0-9]{64}$/;

// Only a hash is stored, so a database leak cannot be used to reset passwords.
const hashResetToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

// ====================== RESET PASSWORD TOKEN ======================
export const resetPasswordToken = async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ success: false, message: "A valid email is required" });
    }
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    // Set token and expiry on user document
    user.resetPasswordToken = hashResetToken(token);
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset link via email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    await mailSender(
      user.email,
      "Password Reset Request",
      `<p>You requested a password reset.</p>
       <p>Click <a href="${resetUrl}">here</a> to reset your password. 
       This link will expire in 1 hour.</p>`
    );

    return res.status(200).json({ success: true, message: "Password reset link sent to email" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== RESET PASSWORD ======================
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Reject non-strings so query operators such as {"$ne": null} never reach MongoDB.
    if (typeof token !== "string" || !RESET_TOKEN.test(token)) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }
    if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
    }

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashResetToken(token),
      resetPasswordExpires: { $gt: Date.now() }, // not expired
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Sign out every device, in case the account was compromised.
    await revokeAllActiveSessions(user._id, "password_reset");

    return res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};