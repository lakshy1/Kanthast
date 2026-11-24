import express from "express";
import {
  adminLogin,
  changePassword,
  deactivateUserSubscription,
  deleteUserByAdmin,
  getAllUsersForAdmin,
  login,
  logout,
  sendOTP,
  signUp,
  updateUserByAdmin,
} from "../controllers/Auth.js";
import { auth, isAdmin } from "../middleware/Auth.js";
import { emailLimiter, loginLimiter, resetLimiter, signupLimiter } from "../middleware/RateLimit.js";
import { resetPassword, resetPasswordToken } from "../controllers/ResetPassword.js";

const router = express.Router();

// Example routes
router.post("/sendotp", emailLimiter, sendOTP);
router.post("/signup", signupLimiter, signUp);
router.post("/login", loginLimiter, login);
router.post("/logout", auth, logout);
router.post("/admin-login", loginLimiter, adminLogin);
router.post("/change-password", auth, changePassword);
router.put("/subscription/deactivate", auth, isAdmin, deactivateUserSubscription);
router.get("/admin/users", auth, isAdmin, getAllUsersForAdmin);
router.put("/admin/users/:userId", auth, isAdmin, updateUserByAdmin);
router.delete("/admin/users/:userId", auth, isAdmin, deleteUserByAdmin);
router.post("/reset-password-token", emailLimiter, resetPasswordToken);
router.post("/reset-password", resetLimiter, resetPassword);

export default router;
