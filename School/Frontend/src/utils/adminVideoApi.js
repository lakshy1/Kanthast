import { apiFetch } from "./apiBase";

// Admin panel calls for playback logs, live lessons and the waitlist. Always sends the ADMIN token.
const ADMIN_TOKEN = "kanthastSchoolAdminToken";
const ADMIN_USER = "kanthastSchoolAdminUser";

async function request(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem(ADMIN_TOKEN) || "";
  let response;
  try {
    response = await apiFetch(path, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("We couldn't reach the server. Check your connection and try again.");
  }
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    localStorage.removeItem(ADMIN_TOKEN);
    localStorage.removeItem(ADMIN_USER);
    window.location.replace(`${import.meta.env.BASE_URL}adminlogin`);
    throw new Error("Admin session expired. Please log in again.");
  }
  if (!response.ok || !data.success) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

export const getPlaybackSummary = () => request("/admin/playback/summary");
export const getPlaybackLogs = (limit = 100) => request(`/admin/playback/logs?limit=${limit}`);
export const getLiveLessons = () => request("/admin/playback/lessons");
export const setLessonStatus = (lessonId, status) => request(`/admin/playback/lessons/${encodeURIComponent(lessonId)}`, { method: "PATCH", body: { status } });
export const getWaitlist = () => request("/waitlist");
