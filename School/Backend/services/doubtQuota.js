import DailyUsage from "../models/DailyUsage.js";
import { doubtIndexesReady } from "./doubtIndexes.js";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Today's date in India, as "YYYY-MM-DD". Limits reset at midnight IST. */
export const istDay = (now = Date.now()) => new Date(now + IST_OFFSET_MS).toISOString().slice(0, 10);

const positiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const isPaid = (user, now = Date.now()) => {
  if (!user?.subscriptionPurchased) return false;
  if (!user.subscriptionValidTill) return true;
  return new Date(user.subscriptionValidTill).getTime() > now;
};

/** Doubts a user may post per day: 1 on the free plan, 5 on a paid plan. */
export const postLimitFor = (user, now = Date.now()) =>
  isPaid(user, now)
    ? positiveInt(process.env.DOUBT_POSTS_PAID, 5)
    : positiveInt(process.env.DOUBT_POSTS_FREE, 1);

/** AI messages a user may send per day (assistant chat, AI answers, chat drafts): 20 free, 100 paid. */
export const aiLimitFor = (user, now = Date.now()) =>
  isPaid(user, now) ? positiveInt(process.env.DOUBT_AI_PAID, 100) : positiveInt(process.env.DOUBT_AI_FREE, 20);

/** Safety checks (each one a Gemini call) a user may cause per day: posts, replies, carried chat answers. */
export const checkLimit = () => positiveInt(process.env.DOUBT_CHECKS_PER_DAY, 100);

/** Failed chat sends per day whose AI message is given back. After this, a failure simply uses the message. */
export const REFUNDS_PER_DAY = 10;

const counted = (usage, field, limit) => {
  const used = Math.min(usage?.[field] || 0, limit);
  return { limit, used, left: Math.max(0, limit - used) };
};

const todaysUsage = (user, day) => DailyUsage.findOne({ user: user._id, day }).select("posts aiMessages").lean();

export async function getPostQuota(user) {
  const day = istDay();
  const usage = await todaysUsage(user, day);
  return { day, ...counted(usage, "posts", postLimitFor(user)), paid: isPaid(user) };
}

/** Today's AI messages: { limit, used, left, paid }. */
export async function getAiQuota(user) {
  const usage = await todaysUsage(user, istDay());
  return { ...counted(usage, "aiMessages", aiLimitFor(user)), paid: isPaid(user) };
}

/** Both allowances from one read, for GET /quota. */
export async function getQuotas(user) {
  const day = istDay();
  const usage = await todaysUsage(user, day);
  return {
    day,
    ...counted(usage, "posts", postLimitFor(user)),
    paid: isPaid(user),
    ai: counted(usage, "aiMessages", aiLimitFor(user)),
  };
}

/**
 * Take one unit of a daily allowance. The check and the count happen in one database
 * step, so two requests sent at the same moment cannot both take the last unit.
 * This relies on the unique (user, day) index: see services/doubtIndexes.js.
 */
async function reserve(user, field, limit, day = istDay()) {
  const filter = { user: user._id, day, [field]: { $lt: limit } };
  const update = { $inc: { [field]: 1 } };
  // Usually today's record exists: count on it. Nothing is created in this step.
  const existing = await DailyUsage.findOneAndUpdate(filter, update, { returnDocument: "after" });
  if (existing) return { ok: true, day, limit, used: existing[field] };
  // Creating the record is safe only with the unique index in place (checked here, not on every call).
  await ensureUsageIndex();
  try {
    const doc = await DailyUsage.findOneAndUpdate(filter, update, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true });
    return { ok: true, day, limit, used: doc[field] };
  } catch (error) {
    if (error?.code !== 11000) throw error;
    // Today's record exists. Either the limit is reached, or another request created
    // the record a moment ago: try once more without creating.
    const doc = await DailyUsage.findOneAndUpdate(filter, update, { returnDocument: "after" });
    if (doc) return { ok: true, day, limit, used: doc[field] };
    return { ok: false, day, limit, used: limit };
  }
}

// Without the unique (user, day) index, requests at the same moment could each create a record
// for the same day and every limit could be passed. If it has vanished (a database reset under a
// running server), build it again and wait; if that fails, fail the request instead.
async function ensureUsageIndex() {
  const hasIndex = async () => {
    const indexes = await DailyUsage.collection.indexes().catch((error) => {
      if (error?.code === 26) return []; // the collection itself is gone
      throw error;
    });
    return indexes.some((index) => index.unique && index.key?.user === 1 && index.key?.day === 1);
  };
  if (await hasIndex()) return;
  if ((await doubtIndexesReady({ rebuild: true })) && (await hasIndex())) return;
  throw new Error("Something went wrong on our side. Please try again in a moment.");
}

/** Give one unit back, for work that failed before the user got anything. */
async function release(userId, day, field) {
  await DailyUsage.updateOne({ user: userId, day, [field]: { $gt: 0 } }, { $inc: { [field]: -1 } });
}

export const reservePost = (user) => reserve(user, "posts", postLimitFor(user));
/** Give a reserved post back, for a post that was blocked before it was saved. */
export const releasePost = (userId, day) => release(userId, day, "posts");

export const reserveAi = (user) => reserve(user, "aiMessages", aiLimitFor(user));
/** Give an AI message back when the AI failed. */
export const releaseAi = (userId, day) => release(userId, day, "aiMessages");

/** Take one safety check for this user. { ok: false } when today's checks are used up. */
export const reserveCheck = (user) => reserve(user, "checks", checkLimit());

/**
 * Give back the AI message of a chat send that failed, at most REFUNDS_PER_DAY times a day.
 * Returns true when it was given back.
 */
export async function refundFailedAi(user, day) {
  const refund = await reserve(user, "refunds", REFUNDS_PER_DAY, day);
  if (refund.ok) await releaseAi(user._id, day);
  return refund.ok;
}
