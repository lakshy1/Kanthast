import { apiFetch } from "./apiBase";

/** An error from the Doubts API. `code` says what kind: "blocked", "not_english", "daily_limit" and so on. */
export class DoubtsError extends Error {
  constructor(message, { status = 0, code = "", data = {} } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("kanthastSchoolToken") || "";
  let response;
  try {
    response = await apiFetch(`/doubts${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new DoubtsError("We couldn't reach Kanthast. Check your connection and try again.", { code: "network" });
  }

  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    localStorage.removeItem("kanthastSchoolToken");
    localStorage.removeItem("kanthastSchoolUser");
    window.location.replace(`${import.meta.env.BASE_URL}login`);
    throw new DoubtsError("Session expired. Please log in again.", { status: 401 });
  }
  if (!response.ok || !data.success) {
    throw new DoubtsError(data.message || "Something went wrong. Try again.", {
      status: response.status,
      code: data.code || "",
      data,
    });
  }
  return data;
}

const query = (params) => {
  const usable = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");
  return usable.length ? `?${new URLSearchParams(usable).toString()}` : "";
};

export const setDoubtsClass = (schoolClass) => request("/class", { method: "POST", body: { schoolClass } });
export const getConsent = () => request("/consent");
export const requestConsent = (parentName, parentEmail) =>
  request("/consent/request", { method: "POST", body: { parentName, parentEmail } });
export const verifyConsent = (code) => request("/consent/verify", { method: "POST", body: { code } });
export const withdrawConsent = () => request("/consent/withdraw", { method: "POST" });

export const getQuota = () => request("/quota");
export const getFeed = ({ subject, before } = {}) => request(`/feed${query({ subject, before })}`);
export const getMyDoubts = () => request("/mine");
export const getSimilarDoubts = (q) => request(`/similar${query({ q })}`);
export const getDoubt = (id) => request(`/${id}`);
/** `chatSessionId` (optional) attaches an Ask conversation; the server then adds the AI's answer as the first reply. */
export const createDoubt = ({ chatSessionId, ...payload }) =>
  request("/", { method: "POST", body: chatSessionId ? { ...payload, chatSessionId } : payload });
export const deleteDoubt = (id) => request(`/${id}`, { method: "DELETE" });
export const createReply = (id, body) => request(`/${id}/replies`, { method: "POST", body: { body } });
export const toggleDoubtHelpful = (id) => request(`/${id}/helpful`, { method: "POST" });
export const toggleReplyHelpful = (replyId) => request(`/replies/${replyId}/helpful`, { method: "POST" });
export const acceptReply = (id, replyId) => request(`/${id}/accept/${replyId}`, { method: "POST" });
export const getAiQuota = () => request("/ai-quota");
export const draftFromChat = (sessionId) => request("/from-chat", { method: "POST", body: { sessionId } });
export const requestAiAnswer = (id) => request(`/${id}/ai-answer`, { method: "POST" });
export const reportItem = (payload) => request("/report", { method: "POST", body: payload });

/** A doubt drafted from an Ask conversation waits here until the class composer opens. */
export const DRAFT_KEY = "kanthastDoubtDraft";

export const DOUBT_SUBJECTS = [
  "Mathematics",
  "Science",
  "Social Science",
  "English",
  "Hindi",
  "Sanskrit",
  "Information Technology",
  "Other",
];

/** "5 min ago", "3 h ago", "2 days ago", then a date. */
export function timeAgo(value) {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return new Date(then).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * A moderator's mute, from GET /quota ({ mute }) or a 403 "muted" error ({ mutedUntil, permanent }).
 * Returns { muted, permanent, until } with until a Date or null. An end already past is no mute.
 */
export function readMute(source) {
  if (!source) return { muted: false, permanent: false, until: null };
  const permanent = Boolean(source.permanent);
  const until = source.mutedUntil ? new Date(source.mutedUntil) : null;
  const active = permanent || (until && !Number.isNaN(until.getTime()) && until.getTime() > Date.now());
  const muted = source.muted === undefined ? Boolean(active) : Boolean(source.muted) && Boolean(active);
  return { muted, permanent: muted && permanent, until: muted && !permanent ? until : null };
}

/** "You can't post until 26 Nov" or "Posting is turned off for your account". */
export function muteLabel(mute) {
  if (!mute?.muted) return "";
  if (mute.permanent || !mute.until) return "Posting is turned off for your account";
  const day = mute.until.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  return `You can't post until ${day}`;
}
