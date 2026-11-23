import ParentConsent from "../models/ParentConsent.js";
import { muteState, mutedMessage } from "../services/moderationRules.js";

/** The class feed needs to know the student's class. */
export const requireClass = (req, res, next) => {
  if (!req.user?.schoolClass) {
    return res.status(409).json({
      success: false,
      code: "class_required",
      message: "Choose your class before using Doubts.",
    });
  }
  next();
};

/** The class feed is locked until a parent has approved. */
export const requireConsent = async (req, res, next) => {
  try {
    const approved = await ParentConsent.exists({ user: req.user._id, status: "approved" });
    if (!approved) {
      return res.status(403).json({
        success: false,
        code: "consent_required",
        message: "A parent needs to approve before you can use the class feed.",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * The one check for a muted student. Used by every student write that puts text in front of the
 * class: posting a doubt, replying, and asking for an AI answer in a thread. Reading, Ask AI,
 * reports, "this helped" and deleting stay open. The mute's end is compared with the time of this
 * request, so an expired mute needs no job to clear it.
 */
export const notMuted = (req, res, next) => {
  const state = muteState(req.user);
  if (!state.muted) return next();
  return res.status(403).json({
    success: false,
    code: "muted",
    message: mutedMessage(state),
    mutedUntil: state.until ? state.until.toISOString() : null,
    permanent: state.permanent,
  });
};

/** Admins moderate from the admin panel; their token does not open the class feed. */
export const notAdmin = (req, res, next) => {
  if (req.user?.accountType === "Admin") {
    return res.status(403).json({
      success: false,
      code: "admin_account",
      message: "Admin accounts use the moderation panel, not the class feed.",
    });
  }
  next();
};
