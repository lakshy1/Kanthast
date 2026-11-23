import mongoose from "mongoose";
import Doubt, { DOUBT_SUBJECTS } from "../models/Doubt.js";
import DoubtReply from "../models/DoubtReply.js";
import DoubtReaction from "../models/DoubtReaction.js";
import DoubtReport, { REPORT_REASONS } from "../models/DoubtReport.js";
import User from "../models/User.js";
import {
  getAiQuota,
  getPostQuota,
  getQuotas,
  releaseAi,
  releasePost,
  reserveAi,
  reserveCheck,
  reservePost,
} from "../services/doubtQuota.js";
import { findContactInfo, precheckText, reviewText } from "../services/doubtModeration.js";
import { draftFromChat, fallbackDraft, generateAiAnswer, lastAiAnswer } from "../services/doubtAi.js";
import { doubtIndexesReady, isMissingTextIndex } from "../services/doubtIndexes.js";
import { aiLimitReached } from "../middleware/AiAllowance.js";
import { textField } from "../utils/textInput.js";
import { muteState } from "../services/moderationRules.js";

const CLASSES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const AUTHOR_FIELDS = "firstName schoolClass";

const fail = (res, status, code, message, extra = {}) =>
  res.status(status).json({ success: false, code, message, ...extra });
const serverError = (res, error) => res.status(500).json({ success: false, message: error.message });
const isId = (value) => mongoose.isValidObjectId(value);
const reportHideAt = () => {
  const n = Number.parseInt(process.env.DOUBT_REPORT_HIDE_AT, 10);
  return Number.isFinite(n) && n > 0 ? n : 3;
};

// Students are shown as first name and class only.
const authorView = (author) =>
  author ? { id: author._id, firstName: author.firstName, schoolClass: author.schoolClass } : null;

const doubtView = (doubt, viewerId, helped = new Set()) => ({
  id: doubt._id,
  subject: doubt.subject,
  chapter: doubt.chapter,
  title: doubt.title,
  body: doubt.body,
  status: doubt.status,
  // Only ever true in the author's own My doubts (nobody else is shown a removed doubt).
  removedByModerator: doubt.status === "removed" && doubt.holdReason === "removed_by_moderator",
  replyCount: doubt.replyCount,
  helpfulCount: doubt.helpfulCount,
  hasAiAnswer: doubt.hasAiAnswer,
  acceptedReply: doubt.acceptedReply,
  createdAt: doubt.createdAt,
  author: authorView(doubt.author),
  mine: String(doubt.author?._id || doubt.author) === String(viewerId),
  helpedByMe: helped.has(String(doubt._id)),
});

const replyView = (reply, viewerId, helped = new Set(), acceptedId = null) => ({
  id: reply._id,
  body: reply.body,
  isAI: reply.isAI,
  status: reply.status,
  helpfulCount: reply.helpfulCount,
  createdAt: reply.createdAt,
  author: reply.isAI ? null : authorView(reply.author),
  mine: !reply.isAI && String(reply.author?._id || reply.author) === String(viewerId),
  accepted: Boolean(acceptedId) && String(acceptedId) === String(reply._id),
  helpedByMe: helped.has(String(reply._id)),
});

async function helpedSet(userId, targetType, ids) {
  if (!ids.length) return new Set();
  const rows = await DoubtReaction.find({ user: userId, targetType, target: { $in: ids } }).select("target").lean();
  return new Set(rows.map((row) => String(row.target)));
}

// What moderation decided, turned into the response the app shows.
function refuse(res, review) {
  if (review.verdict === "unavailable") {
    return fail(
      res,
      503,
      "check_unavailable",
      "We couldn't check your post just now. Nothing was posted. Please try again in a few minutes."
    );
  }
  if (review.verdict === "not_english") {
    return fail(res, 422, "not_english", review.message, { englishVersion: review.englishVersion || "" });
  }
  return fail(res, 422, "blocked", review.message, { reason: review.reason });
}

// Each safety check is a Gemini call, so a student gets a fixed number a day (DOUBT_CHECKS_PER_DAY).
const checkLimitReached = (res) =>
  fail(res, 429, "daily_check_limit", "You have tried to post too many times today. Please come back tomorrow.");

// ---------- class and quota ----------

/** One-time: a student with no class picks one. Later changes go through the profile. */
export const setClass = async (req, res) => {
  try {
    const schoolClass = textField(req.body?.schoolClass);
    if (!CLASSES.includes(schoolClass)) return fail(res, 400, "invalid", "Choose a class from 1 to 10.");
    if (req.user.schoolClass) return fail(res, 409, "class_set", "Your class is already set.");
    // The early check above uses the class loaded with the request, so two requests at once can both pass it.
    // Only the one whose update actually matched an empty class has set it. null also matches older
    // accounts saved before the field existed, where Mongoose shows "" but the database has nothing.
    const result = await User.updateOne(
      { _id: req.user._id, schoolClass: { $in: ["", null] } },
      { $set: { schoolClass } }
    );
    if (!result.matchedCount) return fail(res, 409, "class_set", "Your class is already set.");
    return res.status(200).json({ success: true, schoolClass });
  } catch (error) {
    return serverError(res, error);
  }
};

export const getQuota = async (req, res) => {
  try {
    // The mute comes with the quota, so the app can show "You can't post until ..." before a send.
    const mute = muteState(req.user);
    return res.status(200).json({
      success: true,
      quota: await getQuotas(req.user),
      mute: { muted: mute.muted, permanent: mute.permanent, mutedUntil: mute.until ? mute.until.toISOString() : null },
    });
  } catch (error) {
    return serverError(res, error);
  }
};

/** Today's AI messages. Needs only a login: the assistant chat uses them too. */
export const getAiAllowance = async (req, res) => {
  try {
    return res.status(200).json({ success: true, ai: await getAiQuota(req.user) });
  } catch (error) {
    return serverError(res, error);
  }
};

// ---------- reading ----------

export const getFeed = async (req, res) => {
  try {
    const filter = { schoolClass: req.user.schoolClass, status: "live" };
    const subject = String(req.query.subject || "").trim();
    if (subject) {
      if (!DOUBT_SUBJECTS.includes(subject)) return fail(res, 400, "invalid", "Unknown subject.");
      filter.subject = subject;
    }
    const chapter = String(req.query.chapter || "").trim();
    if (chapter) filter.chapter = chapter;
    const before = req.query.before ? new Date(String(req.query.before)) : null;
    if (before && !Number.isNaN(before.getTime())) filter.createdAt = { $lt: before };
    const limit = Math.min(30, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));

    const doubts = await Doubt.find(filter).sort({ createdAt: -1 }).limit(limit).populate("author", AUTHOR_FIELDS);
    const helped = await helpedSet(req.user._id, "doubt", doubts.map((d) => d._id));
    return res.status(200).json({
      success: true,
      doubts: doubts.map((d) => doubtView(d, req.user._id, helped)),
      nextBefore: doubts.length === limit ? doubts[doubts.length - 1].createdAt : null,
    });
  } catch (error) {
    return serverError(res, error);
  }
};

export const getSimilar = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().slice(0, 200);
    if (q.length < 4) return res.status(200).json({ success: true, doubts: [] });
    const doubts = await Doubt.find(
      { $text: { $search: q }, schoolClass: req.user.schoolClass, status: "live" },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(5)
      .select("title subject chapter replyCount acceptedReply createdAt");
    return res.status(200).json({
      success: true,
      doubts: doubts.map((d) => ({
        id: d._id,
        title: d.title,
        subject: d.subject,
        chapter: d.chapter,
        replyCount: d.replyCount,
        answered: Boolean(d.acceptedReply),
      })),
    });
  } catch (error) {
    // Suggestions are optional. If the text index is missing (a database reset under a running
    // server), answer with none and rebuild it in the background instead of failing the page.
    if (isMissingTextIndex(error)) {
      doubtIndexesReady({ rebuild: true });
      return res.status(200).json({ success: true, doubts: [] });
    }
    return serverError(res, error);
  }
};

export const getMine = async (req, res) => {
  try {
    // A doubt the author deleted is gone; one a moderator removed stays listed (to its author only).
    const doubts = await Doubt.find({
      author: req.user._id,
      $or: [{ status: { $ne: "removed" } }, { holdReason: "removed_by_moderator" }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("author", AUTHOR_FIELDS);
    return res.status(200).json({ success: true, doubts: doubts.map((d) => doubtView(d, req.user._id)) });
  } catch (error) {
    return serverError(res, error);
  }
};

// A doubt the viewer may open: live in their class, or their own while it is held.
async function findVisibleDoubt(req) {
  if (!isId(req.params.id)) return null;
  const doubt = await Doubt.findOne({ _id: req.params.id, schoolClass: req.user.schoolClass }).populate(
    "author",
    AUTHOR_FIELDS
  );
  if (!doubt || doubt.status === "removed") return null;
  const mine = String(doubt.author?._id) === String(req.user._id);
  return doubt.status === "live" || mine ? doubt : null;
}

export const getDoubt = async (req, res) => {
  try {
    const doubt = await findVisibleDoubt(req);
    if (!doubt) return fail(res, 404, "not_found", "This doubt is not available.");

    const replies = await DoubtReply.find({
      doubt: doubt._id,
      $or: [{ status: "live" }, { status: "pending", author: req.user._id }],
    })
      .sort({ createdAt: 1 })
      .populate("author", AUTHOR_FIELDS);
    const [helpedDoubt, helpedReplies] = await Promise.all([
      helpedSet(req.user._id, "doubt", [doubt._id]),
      helpedSet(req.user._id, "reply", replies.map((r) => r._id)),
    ]);
    const views = replies.map((r) => replyView(r, req.user._id, helpedReplies, doubt.acceptedReply));
    views.sort((a, b) => Number(b.accepted) - Number(a.accepted)); // the accepted answer first, the rest in order

    return res.status(200).json({ success: true, doubt: doubtView(doubt, req.user._id, helpedDoubt), replies: views });
  } catch (error) {
    return serverError(res, error);
  }
};

// ---------- writing ----------

export const createDoubt = async (req, res) => {
  let reserved = null;
  try {
    const subject = textField(req.body?.subject);
    const chapter = textField(req.body?.chapter).slice(0, 120);
    const title = textField(req.body?.title);
    const body = textField(req.body?.body);
    if (!DOUBT_SUBJECTS.includes(subject)) return fail(res, 400, "invalid", "Choose a subject.");
    if (title.length < 8 || title.length > 150) {
      return fail(res, 400, "invalid", "Write your question in 8 to 150 characters.");
    }
    if (body.length > 4000) return fail(res, 400, "invalid", "Keep the details under 4,000 characters.");

    // The chapter goes last, on a marked line, so an English version comes back as title, then details.
    const text = [title, body, chapter ? `[Chapter: ${chapter}]` : ""].filter(Boolean).join("\n");
    const pre = precheckText(text);
    if (pre.verdict !== "allow") return refuse(res, pre);

    reserved = await reservePost(req.user);
    if (!reserved.ok) {
      reserved = null;
      const quota = await getPostQuota(req.user);
      return fail(
        res,
        429,
        "daily_limit",
        quota.paid
          ? "You have used today's posts. You can post again tomorrow."
          : "You have used today's free post. You can post again tomorrow, or upgrade for 5 posts a day.",
        { quota }
      );
    }

    // The check is taken after the post, so a student at the post limit spends none.
    if (!(await reserveCheck(req.user)).ok) {
      await releasePost(req.user._id, reserved.day);
      reserved = null;
      return checkLimitReached(res);
    }

    // Anything but "allow" gives the day's post back, including when the AI check could not run:
    // nothing is saved then, so the student can simply try again. The check stays used.
    const review = await reviewText(text);
    if (review.verdict !== "allow") {
      await releasePost(req.user._id, reserved.day);
      reserved = null;
      return refuse(res, review);
    }

    const doubt = await Doubt.create({
      author: req.user._id,
      schoolClass: req.user.schoolClass,
      subject,
      chapter,
      title,
      body,
      status: "live",
    });
    const day = reserved.day;
    reserved = null;
    // The post is saved: carrying the chat's answer over is a bonus and never fails it.
    const aiReplyAdded = await addReplyFromChat(doubt, req.user, textField(req.body?.chatSessionId)).catch((error) => {
      console.error("[doubts:chat-reply]", error?.message || error);
      return false;
    });
    await doubt.populate("author", AUTHOR_FIELDS);
    return res.status(201).json({
      success: true,
      doubt: doubtView(doubt, req.user._id),
      message: "Posted to your class.",
      quota: { ...(await getPostQuota(req.user)), day },
      aiReplyAdded,
    });
  } catch (error) {
    if (reserved) await releasePost(req.user._id, reserved.day).catch(() => {});
    return serverError(res, error);
  }
};

// One of the user's own assistant chats, or null.
const ownChatSession = (user, sessionId) =>
  sessionId ? (user.chatSessions || []).find((session) => session.sessionId === sessionId) || null : null;

// True when one of this user's doubts (not deleted) was already posted from this chat.
const chatAlreadyPosted = (user, sessionId) =>
  Doubt.exists({ author: user._id, sourceChatSession: sessionId, status: { $ne: "removed" } });

/**
 * After a post from an assistant chat is saved, the chat's last AI answer becomes its first reply,
 * labelled as AI. The text is read from the student's stored chat, never taken from the request,
 * and passes the same checks as a student's reply. A chat is carried into one doubt only.
 * A missing or foreign session, no AI answer, or an answer that fails a check adds nothing.
 */
async function addReplyFromChat(doubt, user, sessionId) {
  const session = ownChatSession(user, sessionId);
  const body = lastAiAnswer(session?.messages).trim().slice(0, 4000);
  if (!body || precheckText(body).verdict !== "allow") return false;
  if (await chatAlreadyPosted(user, session.sessionId)) return false;
  if (!(await reserveCheck(user)).ok) return false;
  if ((await reviewText(body)).verdict !== "allow") return false;

  // One chat, one doubt: the chat is marked in one database step, so two posts sent at once
  // cannot both take it. A mark left by a doubt that was since deleted can be taken over.
  const fresh = await User.findOne(
    { _id: user._id, "chatSessions.sessionId": session.sessionId },
    { "chatSessions.$": 1 }
  ).lean();
  const previous = fresh?.chatSessions?.[0]?.postedDoubt || null;
  if (previous && (await Doubt.exists({ _id: previous, status: { $ne: "removed" } }))) return false;
  const marked = await User.updateOne(
    { _id: user._id, chatSessions: { $elemMatch: { sessionId: session.sessionId, postedDoubt: previous } } },
    { $set: { "chatSessions.$.postedDoubt": doubt._id } }
  );
  if (!marked.modifiedCount) return false;

  const claimed = await Doubt.findOneAndUpdate(
    { _id: doubt._id, hasAiAnswer: false },
    { $set: { hasAiAnswer: true, sourceChatSession: session.sessionId } }
  );
  if (!claimed) return false;
  try {
    await DoubtReply.create({ doubt: doubt._id, author: null, isAI: true, body, status: "live", requestedBy: user._id });
  } catch (error) {
    await Doubt.updateOne({ _id: doubt._id }, { $set: { hasAiAnswer: false, sourceChatSession: "" } });
    throw error;
  }
  await Doubt.updateOne({ _id: doubt._id }, { $inc: { replyCount: 1 } });
  doubt.hasAiAnswer = true;
  doubt.replyCount += 1;
  return true;
}

export const deleteDoubt = async (req, res) => {
  try {
    if (!isId(req.params.id)) return fail(res, 404, "not_found", "This doubt is not available.");
    // Deleting does not give the day's post back, so nobody can delete and repost around the limit.
    const result = await Doubt.updateOne(
      { _id: req.params.id, author: req.user._id, status: { $ne: "removed" } },
      { $set: { status: "removed", holdReason: "deleted_by_author" } }
    );
    if (!result.matchedCount) return fail(res, 404, "not_found", "This doubt is not available.");
    return res.status(200).json({ success: true });
  } catch (error) {
    return serverError(res, error);
  }
};

export const createReply = async (req, res) => {
  try {
    const doubt = await findVisibleDoubt(req);
    if (!doubt || doubt.status !== "live") return fail(res, 404, "not_found", "This doubt is not available.");
    const body = textField(req.body?.body);
    if (body.length < 2 || body.length > 4000) {
      return fail(res, 400, "invalid", "Write an answer of up to 4,000 characters.");
    }

    const pre = precheckText(body);
    if (pre.verdict !== "allow") return refuse(res, pre);
    if (!(await reserveCheck(req.user)).ok) return checkLimitReached(res);
    const review = await reviewText(body);
    if (review.verdict !== "allow") return refuse(res, review);

    const reply = await DoubtReply.create({ doubt: doubt._id, author: req.user._id, body, status: "live" });
    await Doubt.updateOne({ _id: doubt._id }, { $inc: { replyCount: 1 } });
    await reply.populate("author", AUTHOR_FIELDS);
    return res.status(201).json({
      success: true,
      reply: replyView(reply, req.user._id),
      message: "Answer posted.",
    });
  } catch (error) {
    return serverError(res, error);
  }
};

// ---------- AI ----------

const AI_UNAVAILABLE = "The AI couldn't answer just now. Please try again in a few minutes.";

/**
 * Adds one AI answer to a live doubt in the caller's class. Only one per doubt: the flag is
 * claimed in one database step, so two students pressing at once cannot both get one.
 * Uses one of the caller's AI messages; any failure gives the message and the claim back.
 */
export const createAiAnswer = async (req, res) => {
  if (!isId(req.params.id)) return fail(res, 404, "not_found", "This doubt is not available.");
  const visible = { _id: req.params.id, schoolClass: req.user.schoolClass, status: "live" };
  let claimed = null;
  let reserved = null;
  const giveBack = async () => {
    if (reserved) await releaseAi(req.user._id, reserved.day).catch(() => {});
    if (claimed) await Doubt.updateOne({ _id: claimed._id }, { $set: { hasAiAnswer: false } }).catch(() => {});
    reserved = null;
    claimed = null;
  };
  try {
    const target = await Doubt.findOne(visible).select("hasAiAnswer").lean();
    if (!target) return fail(res, 404, "not_found", "This doubt is not available.");
    if (target.hasAiAnswer) return fail(res, 409, "ai_answer_exists", "This doubt already has an AI answer.");

    // The caller's AI message first, then the thread: a caller who is out of messages must
    // never hold the claim, or everyone else would see "already has an AI answer".
    reserved = await reserveAi(req.user);
    if (!reserved.ok) {
      reserved = null;
      return aiLimitReached(res, req.user);
    }

    claimed = await Doubt.findOneAndUpdate({ ...visible, hasAiAnswer: false }, { $set: { hasAiAnswer: true } });
    if (!claimed) {
      const exists = await Doubt.exists(visible);
      await giveBack();
      if (!exists) return fail(res, 404, "not_found", "This doubt is not available.");
      return fail(res, 409, "ai_answer_exists", "This doubt already has an AI answer.");
    }

    let body;
    try {
      body = await generateAiAnswer(claimed, req.user.schoolClass);
    } catch (error) {
      console.error("[doubts:ai-answer]", error?.message || error);
      await giveBack();
      return fail(res, 503, "ai_unavailable", AI_UNAVAILABLE);
    }

    const reply = await DoubtReply.create({
      doubt: claimed._id,
      author: null,
      isAI: true,
      body,
      status: "live",
      requestedBy: req.user._id,
    });
    claimed = null;
    reserved = null;
    await Doubt.updateOne({ _id: reply.doubt }, { $inc: { replyCount: 1 } });
    return res.status(201).json({ success: true, reply: replyView(reply, req.user._id), message: "AI answer added." });
  } catch (error) {
    await giveBack();
    return serverError(res, error);
  }
};

/**
 * Turns one of the caller's assistant chats into a draft class post. Nothing is posted:
 * the student checks the draft, then posts it with POST / and the chatSessionId.
 * Drafting uses one AI message; when the AI cannot help (or none are left) the draft is
 * simply the student's first message, so this never blocks posting.
 */
export const draftFromChatSession = async (req, res) => {
  try {
    const session = ownChatSession(req.user, textField(req.body?.sessionId));
    const messages = session?.messages || [];
    if (!messages.some((m) => m.role === "user" && m.content)) {
      return fail(res, 404, "not_found", "This chat is not available.");
    }
    // Whether POST / with this chat would add the chat's answer as a reply (see addReplyFromChat;
    // the AI safety check there can still turn it down).
    const answer = lastAiAnswer(messages).trim().slice(0, 4000);
    const hasAiAnswer =
      Boolean(answer) && !findContactInfo(answer) && !(await chatAlreadyPosted(req.user, session.sessionId));

    let draft = fallbackDraft(messages);
    const reserved = await reserveAi(req.user);
    if (reserved.ok) {
      try {
        draft = await draftFromChat(messages);
      } catch (error) {
        console.error("[doubts:from-chat]", error?.message || error);
        await releaseAi(req.user._id, reserved.day).catch(() => {});
      }
    }
    return res.status(200).json({ success: true, draft, hasAiAnswer });
  } catch (error) {
    return serverError(res, error);
  }
};

// Finds a live doubt or reply in the viewer's class. Returns { doc, doubt } or null.
async function findTarget(req, targetType, targetId) {
  if (!isId(targetId)) return null;
  if (targetType === "doubt") {
    const doubt = await Doubt.findOne({ _id: targetId, schoolClass: req.user.schoolClass, status: "live" });
    return doubt ? { doc: doubt, doubt } : null;
  }
  const reply = await DoubtReply.findOne({ _id: targetId, status: "live" });
  if (!reply) return null;
  const doubt = await Doubt.findOne({ _id: reply.doubt, schoolClass: req.user.schoolClass, status: "live" });
  return doubt ? { doc: reply, doubt } : null;
}

const toggleHelpful = (targetType, paramName) => async (req, res) => {
  try {
    const found = await findTarget(req, targetType, req.params[paramName]);
    if (!found) return fail(res, 404, "not_found", "This is not available.");
    if (String(found.doc.author) === String(req.user._id)) {
      return fail(res, 400, "own_item", "You can't mark your own post as helpful.");
    }
    const Model = targetType === "doubt" ? Doubt : DoubtReply;
    const key = { user: req.user._id, targetType, target: found.doc._id };
    let helped = true;
    try {
      await DoubtReaction.create(key);
      await Model.updateOne({ _id: found.doc._id }, { $inc: { helpfulCount: 1 } });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      // Already marked: a second tap takes it back.
      const removed = await DoubtReaction.deleteOne(key);
      if (removed.deletedCount) {
        await Model.updateOne({ _id: found.doc._id, helpfulCount: { $gt: 0 } }, { $inc: { helpfulCount: -1 } });
      }
      helped = false;
    }
    const fresh = await Model.findById(found.doc._id).select("helpfulCount").lean();
    return res.status(200).json({ success: true, helpedByMe: helped, helpfulCount: fresh?.helpfulCount || 0 });
  } catch (error) {
    return serverError(res, error);
  }
};
export const toggleDoubtHelpful = toggleHelpful("doubt", "id");
export const toggleReplyHelpful = toggleHelpful("reply", "replyId");

/** Only the student who asked can mark the answer. Sending the same answer again clears it. */
export const acceptReply = async (req, res) => {
  try {
    if (!isId(req.params.id) || !isId(req.params.replyId)) return fail(res, 404, "not_found", "This is not available.");
    const doubt = await Doubt.findOne({ _id: req.params.id, author: req.user._id, status: "live" });
    if (!doubt) return fail(res, 404, "not_found", "This doubt is not available.");
    const reply = await DoubtReply.findOne({ _id: req.params.replyId, doubt: doubt._id, status: "live" });
    if (!reply) return fail(res, 404, "not_found", "This answer is not available.");
    const clearing = String(doubt.acceptedReply || "") === String(reply._id);
    doubt.acceptedReply = clearing ? null : reply._id;
    await doubt.save();
    return res.status(200).json({ success: true, acceptedReply: doubt.acceptedReply });
  } catch (error) {
    return serverError(res, error);
  }
};

export const reportItem = async (req, res) => {
  try {
    const targetType = textField(req.body?.targetType);
    const reason = textField(req.body?.reason);
    const note = textField(req.body?.note).slice(0, 500);
    if (!["doubt", "reply"].includes(targetType)) return fail(res, 400, "invalid", "Unknown item.");
    if (!REPORT_REASONS.includes(reason)) return fail(res, 400, "invalid", "Choose a reason.");
    const found = await findTarget(req, targetType, req.body?.targetId);
    if (!found) return fail(res, 404, "not_found", "This is not available.");
    if (String(found.doc.author) === String(req.user._id)) {
      return fail(res, 400, "own_item", "You can't report your own post. You can delete it instead.");
    }

    try {
      await DoubtReport.create({
        reporter: req.user._id,
        targetType,
        target: found.doc._id,
        schoolClass: req.user.schoolClass,
        reason,
        note,
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      return res.status(200).json({ success: true, message: "You have already reported this." });
    }

    // Enough separate reports hide the item until an admin has looked at it.
    const open = await DoubtReport.countDocuments({ targetType, target: found.doc._id, status: "open" });
    if (open >= reportHideAt()) {
      const Model = targetType === "doubt" ? Doubt : DoubtReply;
      const hidden = await Model.updateOne(
        { _id: found.doc._id, status: "live" },
        { $set: { status: "pending", holdReason: "reported" } }
      );
      if (hidden.modifiedCount && targetType === "reply") {
        const update = { $inc: { replyCount: -1 } };
        const unset = {};
        if (String(found.doubt.acceptedReply || "") === String(found.doc._id)) unset.acceptedReply = null;
        // A hidden AI answer no longer answers the thread: the class may ask the AI again.
        if (found.doc.isAI) unset.hasAiAnswer = false;
        if (Object.keys(unset).length) update.$set = unset;
        await Doubt.updateOne({ _id: found.doubt._id, replyCount: { $gt: 0 } }, update);
      }
    }
    return res.status(201).json({ success: true, message: "Thanks. An admin will look at this." });
  } catch (error) {
    return serverError(res, error);
  }
};
