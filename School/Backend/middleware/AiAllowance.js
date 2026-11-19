import { getAiQuota, refundFailedAi, releaseAi, reserveAi } from "../services/doubtQuota.js";
import { awaitDoubtIndexes } from "../services/doubtIndexes.js";

export const AI_LIMIT_MESSAGE = "You have used today's AI messages. They reset at midnight.";

/** The 429 sent when today's AI messages are used up. */
export async function aiLimitReached(res, user) {
  return res.status(429).json({
    success: false,
    code: "ai_daily_limit",
    message: AI_LIMIT_MESSAGE,
    ai: await getAiQuota(user),
  });
}

/**
 * Takes one AI message from today's allowance before the request runs, and gives it back
 * when the student got no AI reply for it:
 * - an empty or non-string message is refused here, before anything is taken;
 * - a 4xx, or a fixed reply that made no model call (the controller sets res.locals.aiNotUsed),
 *   is always given back;
 * - a server error is given back at most REFUNDS_PER_DAY times a day, so a send that keeps
 *   failing cannot call Gemini again and again for free.
 * Kept outside the chat controller so its logic stays as it was.
 */
export const aiAllowance = async (req, res, next) => {
  try {
    const message = req.body?.message;
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }
    await awaitDoubtIndexes(); // the reservation relies on the unique (user, day) index
    const reserved = await reserveAi(req.user);
    if (!reserved.ok) return aiLimitReached(res, req.user);
    res.on("finish", () => {
      const status = res.statusCode;
      if (res.locals.aiNotUsed || (status >= 300 && status < 500)) {
        releaseAi(req.user._id, reserved.day).catch(() => {});
      } else if (status >= 500) {
        refundFailedAi(req.user, reserved.day).catch(() => {});
      }
    });
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
