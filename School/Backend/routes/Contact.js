import express from "express";
import { submitContact } from "../controllers/Contact.js";
import { contactLimiter } from "../middleware/RateLimit.js";

const router = express.Router();

router.post("/", contactLimiter, submitContact);

export default router;
