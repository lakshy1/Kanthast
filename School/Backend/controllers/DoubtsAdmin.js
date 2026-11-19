// Doubts moderation for admins: the review queue, approve / remove / restore, muting students,
// and the append-only action log. Every route is behind auth + isAdmin (routes/DoubtsAdmin.js).
// The rules themselves (what each action does, counters, mute lengths) are in services/moderationRules.js.
import mongoose from "mongoose";
import Doubt from "../models/Doubt.js";
import DoubtReply from "../models/DoubtReply.js";
import DoubtReport from "../models/DoubtReport.js";
import ModerationAction from "../models/ModerationAction.js";
import User from "../models/User.js";
import {
  ITEM_ACTIONS,
  ITEM_TYPES,
  MUTE_REASON_MAX,
  MUTE_REASON_MIN,
  allowedActions,
  decodeCursor,
  encodeCursor,
  itemState,
  muteEnd,
  muteState,
  parseMuteDays,
  planAction,
  readNote,
  reasonCounts,
  replyCounterChange,
} from "../services/moderationRules.js";
import { textField } from "../utils/textInput.js";

const QUEUE_PAGE = 20;
const ACTIONS_PAGE = 30;
const LATEST_NOTES = 3;
const AUTHOR_FIELDS = "firstName schoolClass";

const fail = (res, status, code, message, extra = {}) =>
  res.status(status).json({ success: false, code, message, ...extra });
const serverError = (res, error) => res.status(500).json({ success: false, message: error.message });
const isId = (value) => typeof value === "string" && mongoose.isValidObjectId(value) && /^[a-f0-9]{24}$/i.test(value);
const notFound = (res) => fail(res, 404, "not_found", "This is not available.");
const modelFor = (type) => (type === "doubt" ? Doubt : DoubtReply);
// A version filter that also matches documents saved before the field existed.
const versionIs = (v) => (v ? v : { $in: [0, null] });

// Students are shown to moderators as first name, class and id only. Never email, phone,
// last name or anything from the parent's approval.
const personView = (user) =>
  user && user._id ? { id: user._id, firstName: user.firstName || "", schoolClass: user.schoolClass || "" } : null;
const excerpt = (text, n = 160) => {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  return value.length > n ? `${value.slice(0, n - 1)}…` : value;
};

/** Optional query values: a string from the allowed list, or "" when missing. null means invalid. */
function queryEnum(value, allowed, fallback = "") {
  if (value === undefined || value === "") return fallback;
  if (typeof value !== "string" || !allowed.includes(value)) return null;
  return value;
}

// ---------- the queue ----------

/** Pipeline stages (on DoubtReport) giving one { _id: { type, id }, sortAt } per OPEN queue item. */
function openKeyStages(type) {
  const fromItems = (itemType, Model) => ({
    $unionWith: {
      coll: Model.collection.name,
      pipeline: [
        { $match: { status: "pending" } },
        { $project: { _id: { type: { $literal: itemType }, id: "$_id" }, sortAt: "$updatedAt" } },
      ],
    },
  });
  return [
    { $match: { status: "open", ...(type ? { targetType: type } : {}) } },
    { $group: { _id: { type: "$targetType", id: "$target" }, sortAt: { $max: "$createdAt" } } },
    ...(type !== "reply" ? [fromItems("doubt", Doubt)] : []),
    ...(type !== "doubt" ? [fromItems("reply", DoubtReply)] : []),
    { $group: { _id: "$_id", sortAt: { $max: "$sortAt" } } },
  ];
}

/** Stages (on ModerationAction) for RESOLVED items: acted on, no open report, not pending. */
function resolvedKeyStages(type) {
  const status = (Model, as) => ({
    $lookup: {
      from: Model.collection.name,
      let: { i: "$_id.id" },
      pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$i"] } } }, { $project: { status: 1 } }],
      as,
    },
  });
  return [
    { $match: { targetType: type ? type : { $in: ITEM_TYPES } } },
    { $group: { _id: { type: "$targetType", id: "$target" }, sortAt: { $max: "$createdAt" } } },
    {
      $lookup: {
        from: DoubtReport.collection.name,
        let: { t: "$_id.type", i: "$_id.id" },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ["$target", "$$i"] }, { $eq: ["$targetType", "$$t"] }, { $eq: ["$status", "open"] }] } } },
          { $limit: 1 },
          { $project: { _id: 1 } },
        ],
        as: "open",
      },
    },
    status(Doubt, "d"),
    status(DoubtReply, "r"),
    { $match: { open: { $size: 0 }, "d.status": { $ne: "pending" }, "r.status": { $ne: "pending" } } },
    { $project: { open: 0, d: 0, r: 0 } },
  ];
}

const cursorStage = (cursor) =>
  cursor
    ? [
        {
          $match: {
            $or: [
              { sortAt: { $lt: cursor.at } },
              { sortAt: cursor.at, "_id.id": { $lt: new mongoose.Types.ObjectId(cursor.id) } },
            ],
          },
        },
      ]
    : [];

async function queueKeys(view, type, cursor, limit) {
  const stages = view === "open" ? openKeyStages(type) : resolvedKeyStages(type);
  const Source = view === "open" ? DoubtReport : ModerationAction;
  return Source.aggregate([...stages, ...cursorStage(cursor), { $sort: { sortAt: -1, "_id.id": -1 } }, { $limit: limit + 1 }]);
}

/** Queue entries (and, with full: true, every report) for a list of { type, id } keys. */
async function buildEntries(keys, { full = false } = {}) {
  const ids = (type) => keys.filter((k) => k.type === type).map((k) => k.id);
  const [doubts, replies] = await Promise.all([
    Doubt.find({ _id: { $in: ids("doubt") } }).populate("author", AUTHOR_FIELDS).lean(),
    DoubtReply.find({ _id: { $in: ids("reply") } }).populate("author", AUTHOR_FIELDS).lean(),
  ]);
  const parentIds = [...new Set(replies.map((r) => String(r.doubt)))];
  const parents = await Doubt.find({ _id: { $in: parentIds } }).populate("author", AUTHOR_FIELDS).lean();
  const parentById = new Map(parents.map((d) => [String(d._id), d]));
  const reports = await DoubtReport.find({
    $or: [
      { targetType: "doubt", target: { $in: doubts.map((d) => d._id) } },
      { targetType: "reply", target: { $in: replies.map((r) => r._id) } },
    ],
  })
    .sort({ createdAt: -1, _id: -1 })
    .populate("reporter", "firstName")
    .lean();
  const reportsFor = (type, id) => reports.filter((r) => r.targetType === type && String(r.target) === String(id));

  const entry = (type, item) => {
    const parent = type === "reply" ? parentById.get(String(item.doubt)) || null : null;
    const own = reportsFor(type, item._id);
    const open = own.filter((r) => r.status === "open");
    // The reasons and notes shown are the open reports', or, once resolved, all of them.
    const shown = open.length ? open : own;
    const where = type === "doubt" ? item : parent || {};
    const view = {
      type,
      id: item._id,
      status: itemState(item),
      autoHidden: item.status === "pending" && item.holdReason === "reported",
      schoolClass: where.schoolClass || "",
      subject: where.subject || "",
      chapter: where.chapter || "",
      title: type === "doubt" ? item.title : "",
      excerpt: excerpt(type === "doubt" ? [item.title, item.body].filter(Boolean).join(" — ") : item.body),
      isAI: Boolean(item.isAI),
      author: item.isAI ? null : personView(item.author),
      createdAt: item.createdAt,
      parent: parent ? { id: parent._id, title: parent.title, status: itemState(parent) } : null,
      openReports: open.length,
      totalReports: own.length,
      reasons: reasonCounts(shown.map((r) => r.reason)),
      latestNotes: shown
        .filter((r) => r.note)
        .slice(0, LATEST_NOTES)
        .map((r) => ({ reason: r.reason, note: r.note, createdAt: r.createdAt })),
      lastReportedAt: own[0]?.createdAt || null,
      allowedActions: allowedActions(item, open.length),
    };
    if (full) {
      view.body = item.body || "";
      if (parent) {
        view.parent = {
          ...view.parent,
          body: parent.body || "",
          subject: parent.subject,
          chapter: parent.chapter,
          author: personView(parent.author),
          createdAt: parent.createdAt,
        };
      }
      view.reports = own.map((r) => ({
        id: r._id,
        reason: r.reason,
        note: r.note || "",
        status: r.status,
        resolution: r.resolution || "",
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt || null,
        reporter: r.reporter?._id ? { id: r.reporter._id, firstName: r.reporter.firstName || "" } : null,
      }));
    }
    return view;
  };

  const byKey = new Map([
    ...doubts.map((d) => [`doubt:${d._id}`, entry("doubt", d)]),
    ...replies.map((r) => [`reply:${r._id}`, entry("reply", r)]),
  ]);
  return keys.map((k) => byKey.get(`${k.type}:${k.id}`)).filter(Boolean);
}

export const getQueue = async (req, res) => {
  try {
    const view = queryEnum(req.query.status, ["open", "resolved"], "open");
    const type = queryEnum(req.query.type, ITEM_TYPES, "");
    if (view === null) return fail(res, 400, "invalid", "status must be open or resolved.");
    if (type === null) return fail(res, 400, "invalid", "type must be doubt or reply.");
    let cursor;
    try {
      cursor = decodeCursor(req.query.cursor);
    } catch {
      return fail(res, 400, "invalid", "That page link is not valid.");
    }
    const rows = await queueKeys(view, type, cursor, QUEUE_PAGE);
    const page = rows.slice(0, QUEUE_PAGE);
    const keys = page.map((row) => ({ type: row._id.type, id: String(row._id.id), sortAt: row.sortAt }));
    const entries = await buildEntries(keys);
    const sortAt = new Map(keys.map((k) => [`${k.type}:${k.id}`, k.sortAt]));
    for (const e of entries) e.sortAt = sortAt.get(`${e.type}:${e.id}`);
    const last = page[page.length - 1];
    return res.status(200).json({
      success: true,
      status: view,
      items: entries,
      nextCursor: rows.length > QUEUE_PAGE && last ? encodeCursor(last.sortAt, last._id.id) : null,
    });
  } catch (error) {
    return serverError(res, error);
  }
};

async function openCount() {
  const [row] = await DoubtReport.aggregate([...openKeyStages(""), { $count: "n" }]);
  return row?.n || 0;
}

export const getQueueCounts = async (req, res) => {
  try {
    return res.status(200).json({ success: true, counts: { open: await openCount() } });
  } catch (error) {
    return serverError(res, error);
  }
};

// ---------- one item ----------

async function itemDetail(type, id) {
  const [entry] = await buildEntries([{ type, id: String(id) }], { full: true });
  if (!entry) return null;
  const actions = await ModerationAction.find({ targetType: type, target: id }).sort({ createdAt: -1, _id: -1 }).limit(50).lean();
  entry.actions = await actionViews(actions);
  return entry;
}

const readItemParams = (req) => {
  const { type, id } = req.params;
  return ITEM_TYPES.includes(type) && isId(id) ? { type, id } : null;
};

export const getItem = async (req, res) => {
  try {
    const params = readItemParams(req);
    if (!params) return notFound(res);
    const item = await itemDetail(params.type, params.id);
    if (!item) return notFound(res);
    return res.status(200).json({ success: true, item });
  } catch (error) {
    return serverError(res, error);
  }
};

/** Keeps the parent doubt's counters right when a reply changes status (see moderationRules.js). */
async function applyReplyCounters(reply, from, to) {
  const change = replyCounterChange(from, to, reply.isAI);
  if (change.replyCount === -1) {
    await Doubt.updateOne({ _id: reply.doubt, replyCount: { $gt: 0 } }, { $inc: { replyCount: -1 } });
    await Doubt.updateOne({ _id: reply.doubt, acceptedReply: reply._id }, { $set: { acceptedReply: null } });
    if (change.hasAiAnswer === false) {
      const otherAi = await DoubtReply.exists({ doubt: reply.doubt, isAI: true, status: "live", _id: { $ne: reply._id } });
      if (!otherAi) await Doubt.updateOne({ _id: reply.doubt }, { $set: { hasAiAnswer: false } });
    }
  } else if (change.replyCount === 1) {
    const update = { $inc: { replyCount: 1 } };
    if (change.hasAiAnswer === true) update.$set = { hasAiAnswer: true };
    await Doubt.updateOne({ _id: reply.doubt }, update);
  }
}

/**
 * POST /items/:type/:id/action { action, note }.
 * The item's status and modVersion are both conditions of one update, so of two admins acting at
 * once (or an admin and a student's report that hides it) exactly one change lands; the other gets
 * 409 conflict and nothing else is written. Only the winner resolves the reports and writes the
 * one ModerationAction.
 */
export const actOnItem = async (req, res) => {
  try {
    const params = readItemParams(req);
    if (!params) return notFound(res);
    const action = req.body?.action;
    if (typeof action !== "string" || !ITEM_ACTIONS.includes(action)) {
      return fail(res, 400, "invalid", "action must be approve, remove or restore.");
    }
    const note = readNote(req.body?.note);
    if (!note.ok) return fail(res, 400, "invalid", "The note must be text of up to 500 characters.");

    const Model = modelFor(params.type);
    const item = await Model.findById(params.id).lean();
    if (!item) return notFound(res);
    const openReports = await DoubtReport.countDocuments({ targetType: params.type, target: item._id, status: "open" });
    const plan = planAction(action, item, openReports);
    if (plan.error) return fail(res, 409, plan.error, plan.message, { status: itemState(item) });

    const stamp = new Date();
    const version = item.modVersion || 0;
    const updated = await Model.findOneAndUpdate(
      // status: a student's report (live -> pending) or the author deleting it also changes the item.
      { _id: item._id, status: item.status, modVersion: versionIs(version) },
      { $set: { status: plan.to, holdReason: plan.holdReason }, $inc: { modVersion: 1 } },
      { returnDocument: "after" }
    );
    if (!updated) {
      return fail(res, 409, "conflict", "This changed while you were looking at it. It has been refreshed.");
    }

    if (params.type === "reply") await applyReplyCounters(item, item.status, plan.to);
    let reportsResolved = 0;
    if (plan.resolution) {
      const resolved = await DoubtReport.updateMany(
        { targetType: params.type, target: item._id, status: "open", createdAt: { $lte: stamp } },
        { $set: { status: "resolved", resolution: plan.resolution, resolvedBy: req.user._id, resolvedAt: stamp } }
      );
      reportsResolved = resolved.modifiedCount || 0;
    }

    const record = await ModerationAction.create({
      admin: req.user._id,
      action,
      targetType: params.type,
      target: item._id,
      targetAuthor: item.author || null,
      note: note.value,
      beforeStatus: itemState(item),
      afterStatus: itemState(updated),
      reportsResolved,
    });

    const [actionView] = await actionViews([record.toObject()]);
    return res.status(200).json({ success: true, item: await itemDetail(params.type, item._id), action: actionView });
  } catch (error) {
    return serverError(res, error);
  }
};

// ---------- students: summary, mute, unmute ----------

const muteView = (user, mutedBy = null) => {
  const state = muteState(user);
  return {
    muted: state.muted,
    permanent: state.permanent,
    mutedUntil: state.until ? state.until.toISOString() : null,
    reason: state.muted ? user.doubtsMute?.reason || "" : "",
    mutedAt: state.muted ? user.doubtsMute?.mutedAt || null : null,
    mutedBy: state.muted ? mutedBy : null,
  };
};
const roleOf = (user) => String(user.accountType || "Student").toLowerCase();

async function findStudent(req, res) {
  const { userId } = req.params;
  if (!isId(userId)) {
    notFound(res);
    return null;
  }
  const user = await User.findById(userId).select("firstName schoolClass accountType doubtsMute").lean();
  if (!user) notFound(res);
  return user;
}

export const getUserSummary = async (req, res) => {
  try {
    const user = await findStudent(req, res);
    if (!user) return undefined;
    const [doubtRows, replyRows, doubtIds, replyIds] = await Promise.all([
      Doubt.aggregate([{ $match: { author: user._id } }, { $group: { _id: { s: "$status", h: "$holdReason" }, n: { $sum: 1 } } }]),
      DoubtReply.aggregate([{ $match: { author: user._id } }, { $group: { _id: { s: "$status", h: "$holdReason" }, n: { $sum: 1 } } }]),
      Doubt.distinct("_id", { author: user._id }),
      DoubtReply.distinct("_id", { author: user._id }),
    ]);
    const tally = (rows) => {
      const out = { total: 0, live: 0, pending: 0, removed: 0, deletedByAuthor: 0 };
      for (const row of rows) {
        out.total += row.n;
        if (row._id.s === "removed") out[row._id.h === "deleted_by_author" ? "deletedByAuthor" : "removed"] += row.n;
        else if (row._id.s in out) out[row._id.s] += row.n;
      }
      return out;
    };
    const reportRows = await DoubtReport.aggregate([
      {
        $match: {
          $or: [
            { targetType: "doubt", target: { $in: doubtIds } },
            { targetType: "reply", target: { $in: replyIds } },
          ],
        },
      },
      { $group: { _id: { s: "$status", r: "$resolution" }, n: { $sum: 1 } } },
    ]);
    const reports = { total: 0, open: 0, upheld: 0, dismissed: 0 };
    for (const row of reportRows) {
      reports.total += row.n;
      if (row._id.s === "open") reports.open += row.n;
      else if (row._id.r === "upheld") reports.upheld += row.n;
      else if (row._id.r === "dismissed") reports.dismissed += row.n;
    }
    const doubts = tally(doubtRows);
    const replies = tally(replyRows);
    const mutedBy = user.doubtsMute?.mutedBy
      ? personView(await User.findById(user.doubtsMute.mutedBy).select("firstName").lean())
      : null;
    const actions = await ModerationAction.find({ targetAuthor: user._id }).sort({ createdAt: -1, _id: -1 }).limit(20).lean();
    return res.status(200).json({
      success: true,
      user: { id: user._id, firstName: user.firstName || "", schoolClass: user.schoolClass || "", role: roleOf(user) },
      doubts,
      replies,
      removedCount: doubts.removed + replies.removed,
      reports,
      mute: muteView(user, mutedBy ? { id: mutedBy.id, firstName: mutedBy.firstName } : null),
      actions: await actionViews(actions),
    });
  } catch (error) {
    return serverError(res, error);
  }
};

/** POST /users/:userId/mute { days: 1 | 7 | 30 | "permanent", reason }. Muting again replaces the mute. */
export const muteUser = async (req, res) => {
  try {
    const days = parseMuteDays(req.body?.days);
    if (days === null) return fail(res, 400, "invalid", "days must be 1, 7, 30 or \"permanent\".");
    const rawReason = req.body?.reason;
    const reason = textField(rawReason);
    if (typeof rawReason !== "string" || reason.length < MUTE_REASON_MIN || reason.length > MUTE_REASON_MAX) {
      return fail(res, 400, "invalid", `Give a reason of ${MUTE_REASON_MIN} to ${MUTE_REASON_MAX} characters.`);
    }
    const user = await findStudent(req, res);
    if (!user) return undefined;
    if (user.accountType === "Admin") return fail(res, 403, "cannot_mute_admin", "Admins can't be muted.");

    const before = muteState(user);
    const version = user.doubtsMute?.version || 0;
    const now = new Date();
    const until = muteEnd(days, now.getTime());
    const result = await User.updateOne(
      { _id: user._id, "doubtsMute.version": versionIs(version) },
      {
        $set: {
          doubtsMute: { until, permanent: days === "permanent", reason, mutedBy: req.user._id, mutedAt: now, version: version + 1 },
        },
      }
    );
    if (!result.modifiedCount) return fail(res, 409, "conflict", "Someone else changed this student's mute just now.");
    const record = await ModerationAction.create({
      admin: req.user._id,
      action: "mute",
      targetType: "user",
      target: user._id,
      targetAuthor: user._id,
      note: reason,
      beforeStatus: before.muted ? "muted" : "active",
      afterStatus: "muted",
      muteDays: days,
      mutedUntil: until,
    });
    const fresh = await User.findById(user._id).select("doubtsMute").lean();
    const [actionView] = await actionViews([record.toObject()]);
    return res.status(200).json({
      success: true,
      mute: muteView(fresh, { id: req.user._id, firstName: req.user.firstName || "" }),
      action: actionView,
    });
  } catch (error) {
    return serverError(res, error);
  }
};

/** POST /users/:userId/unmute { note? }. 409 not_muted when there is nothing to lift (including an expired mute). */
export const unmuteUser = async (req, res) => {
  try {
    const note = readNote(req.body?.note);
    if (!note.ok) return fail(res, 400, "invalid", "The note must be text of up to 500 characters.");
    const user = await findStudent(req, res);
    if (!user) return undefined;
    if (!muteState(user).muted) return fail(res, 409, "not_muted", "This student is not muted.");
    const version = user.doubtsMute?.version || 0;
    const result = await User.updateOne(
      { _id: user._id, "doubtsMute.version": versionIs(version) },
      {
        $set: {
          doubtsMute: { until: null, permanent: false, reason: "", mutedBy: null, mutedAt: null, version: version + 1 },
        },
      }
    );
    if (!result.modifiedCount) return fail(res, 409, "conflict", "Someone else changed this student's mute just now.");
    const record = await ModerationAction.create({
      admin: req.user._id,
      action: "unmute",
      targetType: "user",
      target: user._id,
      targetAuthor: user._id,
      note: note.value,
      beforeStatus: "muted",
      afterStatus: "active",
    });
    const [actionView] = await actionViews([record.toObject()]);
    return res.status(200).json({ success: true, mute: muteView({}), action: actionView });
  } catch (error) {
    return serverError(res, error);
  }
};

// ---------- the action log ----------

/** Turns ModerationAction records into what the panel shows, with a short label for each target. */
async function actionViews(records) {
  if (!records.length) return [];
  const idsOf = (type) => records.filter((r) => r.targetType === type).map((r) => r.target);
  const people = [...new Set(records.flatMap((r) => [r.admin, r.targetAuthor]).filter(Boolean).map(String))];
  const [doubts, replies, users] = await Promise.all([
    Doubt.find({ _id: { $in: idsOf("doubt") } }).select("title").lean(),
    DoubtReply.find({ _id: { $in: idsOf("reply") } }).select("body isAI").lean(),
    User.find({ _id: { $in: people } }).select("firstName schoolClass").lean(),
  ]);
  const label = new Map([
    ...doubts.map((d) => [`doubt:${d._id}`, excerpt(d.title, 90)]),
    ...replies.map((r) => [`reply:${r._id}`, excerpt(r.body, 90)]),
  ]);
  const person = new Map(users.map((u) => [String(u._id), u]));
  return records.map((r) => {
    const author = r.targetAuthor ? person.get(String(r.targetAuthor)) : null;
    const admin = person.get(String(r.admin));
    return {
      id: r._id,
      action: r.action,
      targetType: r.targetType,
      targetId: r.target,
      targetLabel: r.targetType === "user" ? author?.firstName || "" : label.get(`${r.targetType}:${r.target}`) || "",
      targetAuthor: author ? personView(author) : null,
      admin: admin ? { id: admin._id, firstName: admin.firstName || "" } : { id: r.admin, firstName: "" },
      note: r.note || "",
      beforeStatus: r.beforeStatus,
      afterStatus: r.afterStatus,
      reportsResolved: r.reportsResolved || 0,
      muteDays: r.muteDays ?? null,
      mutedUntil: r.mutedUntil || null,
      createdAt: r.createdAt,
    };
  });
}

export const getActions = async (req, res) => {
  try {
    let cursor;
    try {
      cursor = decodeCursor(req.query.cursor);
    } catch {
      return fail(res, 400, "invalid", "That page link is not valid.");
    }
    const filter = cursor
      ? {
          $or: [
            { createdAt: { $lt: cursor.at } },
            { createdAt: cursor.at, _id: { $lt: new mongoose.Types.ObjectId(cursor.id) } },
          ],
        }
      : {};
    const rows = await ModerationAction.find(filter).sort({ createdAt: -1, _id: -1 }).limit(ACTIONS_PAGE + 1).lean();
    const page = rows.slice(0, ACTIONS_PAGE);
    const last = page[page.length - 1];
    return res.status(200).json({
      success: true,
      actions: await actionViews(page),
      nextCursor: rows.length > ACTIONS_PAGE && last ? encodeCursor(last.createdAt, last._id) : null,
    });
  } catch (error) {
    return serverError(res, error);
  }
};
