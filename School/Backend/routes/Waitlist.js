import express from "express";
import { auth, isAdmin } from "../middleware/Auth.js";
import { rateLimit } from "../middleware/RateLimit.js";
import { joinWaitlist, listWaitlist } from "../controllers/Waitlist.js";

const router = express.Router();
const joinLimiter = rateLimit({ name: "waitlist", windowMs: 60 * 60_000, max: 8, message: "Too many sign-ups from this connection. Please try again later." });

router.post("/", joinLimiter, joinWaitlist);
router.get("/", auth, isAdmin, listWaitlist);

export default router;
