import express from "express";
import { auth, isAdmin } from "../middleware/Auth.js";
import { waitForDoubtIndexes } from "../services/doubtIndexes.js";
import {
  actOnItem,
  getActions,
  getItem,
  getQueue,
  getQueueCounts,
  getUserSummary,
  muteUser,
  unmuteUser,
} from "../controllers/DoubtsAdmin.js";

// Doubts moderation, mounted at /api/v1/admin/doubts. Admins only: a student token gets 403.
const router = express.Router();
router.use(auth, isAdmin, waitForDoubtIndexes);

router.get("/queue", getQueue);
router.get("/queue/counts", getQueueCounts);
router.get("/items/:type/:id", getItem);
router.post("/items/:type/:id/action", actOnItem);
router.get("/users/:userId", getUserSummary);
router.post("/users/:userId/mute", muteUser);
router.post("/users/:userId/unmute", unmuteUser);
// The log is append-only: there are deliberately no routes to change or delete an action.
router.get("/actions", getActions);

export default router;
