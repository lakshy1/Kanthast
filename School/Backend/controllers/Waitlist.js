import WaitlistEntry from "../models/WaitlistEntry.js";
import { normalizeWaitlist } from "../services/waitlist.js";

// Public: anyone can join. The answer is the same whether or not the email was already on the list.
export const joinWaitlist = async (req, res) => {
  const result = normalizeWaitlist(req.body);
  if (!result.ok) return res.status(400).json({ success: false, message: result.message });
  try {
    await WaitlistEntry.updateOne({ email: result.value.email }, { $setOnInsert: result.value }, { upsert: true });
  } catch (error) {
    if (error?.code !== 11000) return res.status(500).json({ success: false, message: "Could not save your email. Please try again." });
  }
  return res.status(200).json({ success: true, message: "You are on the list. We will email you when lessons open." });
};

// Admin only.
export const listWaitlist = async (_req, res) => {
  const rows = await WaitlistEntry.find().sort({ createdAt: -1 }).limit(1000).lean();
  const counts = rows.reduce((acc, r) => ({ ...acc, [r.interest]: (acc[r.interest] || 0) + 1 }), {});
  return res.status(200).json({
    success: true,
    total: rows.length,
    counts,
    entries: rows.map((r) => ({ id: r._id, email: r.email, interest: r.interest, joinedAt: r.createdAt })),
  });
};
