import { apiFetch } from "./apiBase";

// Doubts moderation (admin panel). Always sends the ADMIN token, never the student one.
const ADMIN_TOKEN = "kanthastSchoolAdminToken";
const ADMIN_USER = "kanthastSchoolAdminUser";

/** An error from the moderation API. `code`: "conflict", "invalid_state", "not_found", "cannot_mute_admin" and so on. */
export class AdminDoubtsError extends Error {
  constructor(message, { status = 0, code = "", data = {} } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem(ADMIN_TOKEN) || "";
  let response;
  try {
    response = await apiFetch(`/admin/doubts${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new AdminDoubtsError("We couldn't reach the server. Check your connection and try again.", { code: "network" });
  }

  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    localStorage.removeItem(ADMIN_TOKEN);
    localStorage.removeItem(ADMIN_USER);
    window.location.replace(`${import.meta.env.BASE_URL}adminlogin`);
    throw new AdminDoubtsError("Admin session expired. Please log in again.", { status: 401 });
  }
  if (!response.ok || !data.success) {
    throw new AdminDoubtsError(data.message || "Something went wrong. Try again.", {
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

/** status: "open" | "resolved"; type: "" | "doubt" | "reply"; cursor from the previous page. */
export const getModerationQueue = ({ status = "open", type = "", cursor = "" } = {}) =>
  request(`/queue${query({ status, type, cursor })}`);
export const getModerationCounts = () => request("/queue/counts");
export const getModerationItem = (type, id) => request(`/items/${type}/${id}`);
/** action: "approve" | "remove" | "restore". */
export const moderateItem = (type, id, action, note = "") =>
  request(`/items/${type}/${id}/action`, { method: "POST", body: note ? { action, note } : { action } });
export const getStudentSummary = (userId) => request(`/users/${userId}`);
/** days: 1 | 7 | 30 | "permanent". */
export const muteStudent = (userId, days, reason) => request(`/users/${userId}/mute`, { method: "POST", body: { days, reason } });
export const unmuteStudent = (userId, note = "") =>
  request(`/users/${userId}/unmute`, { method: "POST", body: note ? { note } : {} });
export const getModerationActions = (cursor = "") => request(`/actions${query({ cursor })}`);

export const REPORT_REASON_LABELS = {
  abuse: "Rude or hurtful",
  personal_info: "Personal details",
  spam: "Spam / off-topic",
  wrong_answer: "Wrong answer",
  other: "Something else",
};

export const MUTE_OPTIONS = [
  { value: "1", label: "1 day" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "permanent", label: "Until unmuted" },
];
