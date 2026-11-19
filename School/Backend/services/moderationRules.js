// Pure rules for Doubts moderation (no database). Used by controllers/DoubtsAdmin.js and
// middleware/Doubts.js, and tested in tests/doubts.test.js.
//
// The rules, in short:
// - approve: the item is live (again). Its open reports are resolved as "dismissed". Auto-hide counts
//   OPEN reports only, so the reports that were already counted can never hide it again: it is hidden
//   again only after DOUBT_REPORT_HIDE_AT new reports, and since a student can report an item once,
//   those must come from students who had not reported it before. One new report is enough to put
//   it back in the open queue.
// - remove: status "removed" (holdReason "removed_by_moderator"); hidden from everyone, the author
//   sees a removed doubt in My doubts as "Removed by a moderator". Open reports are "upheld".
//   On an item the author already deleted, it only closes the reports (the status stays as it is).
// - restore: undoes a moderator's remove; the item goes back to live. A doubt the author deleted
//   cannot be restored by an admin.
// - Reply counters on the parent doubt always count LIVE replies only: a reply leaving live takes one
//   off replyCount, clears acceptedReply if it was the accepted one, and clears hasAiAnswer for an AI
//   answer; a reply becoming live again adds one and sets hasAiAnswer for an AI answer. The accepted
//   mark is not given back: the asker can mark it again.

import { textField } from "../utils/textInput.js";

export const ITEM_TYPES = ["doubt", "reply"];
export const ITEM_ACTIONS = ["approve", "remove", "restore"];
export const NOTE_MAX = 500;
export const MUTE_REASON_MIN = 3;
export const MUTE_REASON_MAX = 300;
/** Mute lengths an admin can choose, in days, or "permanent". */
export const MUTE_DAYS = [1, 7, 30];
export const DAY_MS = 24 * 60 * 60 * 1000;

/** 1, 7, 30 (numbers only) or "permanent". Anything else (including "7" or [7]) is null. */
export function parseMuteDays(value) {
  if (value === "permanent") return "permanent";
  if (typeof value === "number" && MUTE_DAYS.includes(value)) return value;
  return null;
}

/** The end of a mute starting now, or null for a permanent one. */
export function muteEnd(days, now = Date.now()) {
  return days === "permanent" ? null : new Date(now + days * DAY_MS);
}

/** Whether a user is muted at `now`. An expired mute counts as not muted; no job has to clear it. */
export function muteState(user, now = Date.now()) {
  const mute = user?.doubtsMute;
  if (!mute) return { muted: false, permanent: false, until: null };
  if (mute.permanent) return { muted: true, permanent: true, until: null };
  const until = mute.until ? new Date(mute.until) : null;
  if (until && !Number.isNaN(until.getTime()) && until.getTime() > now) {
    return { muted: true, permanent: false, until };
  }
  return { muted: false, permanent: false, until: null };
}

const SHORT_DATE = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

/** What a muted student is told. */
export function mutedMessage(state) {
  if (!state?.muted) return "";
  if (state.permanent) return "Posting is turned off for your account.";
  return `You can't post until ${SHORT_DATE.format(state.until)}.`;
}

/** Item status as shown to admins: removed by the author and by a moderator are different. */
export function itemState(item) {
  if (item.status !== "removed") return item.status;
  return item.holdReason === "deleted_by_author" ? "deleted_by_author" : "removed";
}

/**
 * What an action does to an item. `openReports` is how many open reports it has.
 * Returns { to, holdReason, resolution } or { error, message } when the action does not apply.
 */
export function planAction(action, item, openReports = 0) {
  const state = itemState(item);
  if (action === "approve") {
    if (state === "pending") return { to: "live", holdReason: "", resolution: "dismissed" };
    if (state === "live" && openReports > 0) return { to: "live", holdReason: "", resolution: "dismissed" };
    if (state === "live") return { error: "invalid_state", message: "This is already live and has no open reports." };
    return { error: "invalid_state", message: "This has been removed. Restore it instead." };
  }
  if (action === "remove") {
    if (state === "live" || state === "pending") {
      return { to: "removed", holdReason: "removed_by_moderator", resolution: "upheld" };
    }
    if (state === "deleted_by_author" && openReports > 0) {
      // Already gone; this just closes the reports on it.
      return { to: "removed", holdReason: "deleted_by_author", resolution: "upheld" };
    }
    return { error: "invalid_state", message: "This is already removed." };
  }
  if (action === "restore") {
    if (state === "removed") return { to: "live", holdReason: "", resolution: "" };
    if (state === "deleted_by_author") {
      return { error: "invalid_state", message: "The author deleted this. It can't be restored." };
    }
    return { error: "invalid_state", message: "Only a removed item can be restored." };
  }
  return { error: "invalid", message: "Unknown action." };
}

/** The actions that apply to an item right now (for the admin UI). */
export function allowedActions(item, openReports = 0) {
  return ITEM_ACTIONS.filter((action) => !planAction(action, item, openReports).error);
}

/**
 * What a reply's move from one status to another does to its parent doubt.
 * Returns { replyCount: -1 | 0 | 1, clearAccepted, hasAiAnswer: true | false | null (leave) }.
 */
export function replyCounterChange(from, to, isAI = false) {
  const wasLive = from === "live";
  const isLive = to === "live";
  if (wasLive && !isLive) return { replyCount: -1, clearAccepted: true, hasAiAnswer: isAI ? false : null };
  if (!wasLive && isLive) return { replyCount: 1, clearAccepted: false, hasAiAnswer: isAI ? true : null };
  return { replyCount: 0, clearAccepted: false, hasAiAnswer: null };
}

/** True when this many open reports hide a live item. */
export const shouldAutoHide = (openReports, hideAt) => openReports >= hideAt;

// ---------- cursors ----------
// A page cursor is "<ISO time>_<ObjectId hex>", base64url-encoded. Anything else is rejected.

export function encodeCursor(at, id) {
  return Buffer.from(`${new Date(at).toISOString()}_${String(id)}`).toString("base64url");
}

/** { at: Date, id: string } or null for a missing cursor; throws "invalid" for a bad one. */
export function decodeCursor(value) {
  if (value === undefined || value === "") return null;
  if (typeof value !== "string" || value.length > 200) throw new Error("invalid");
  const raw = Buffer.from(value, "base64url").toString("utf8");
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)_([a-f0-9]{24})$/.exec(raw);
  if (!match) throw new Error("invalid");
  const at = new Date(match[1]);
  if (Number.isNaN(at.getTime())) throw new Error("invalid");
  return { at, id: match[2] };
}

/** Counts per reason, most common first (ties by name), from a list of reasons. */
export function reasonCounts(reasons) {
  const counts = new Map();
  for (const reason of reasons) counts.set(reason, (counts.get(reason) || 0) + 1);
  return [...counts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason));
}

/**
 * Reads an optional note: undefined or a string, at most NOTE_MAX characters after trimming.
 * Returns { ok, value } — never turns an object into text.
 */
export function readNote(value, max = NOTE_MAX) {
  if (value === undefined || value === null) return { ok: true, value: "" };
  if (typeof value !== "string") return { ok: false };
  const text = textField(value);
  if (text.length > max) return { ok: false };
  return { ok: true, value: text };
}
