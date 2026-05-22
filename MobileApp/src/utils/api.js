import { apiFetch, CACHE_KEYS, CACHE_TTL_MS, PROFILE_CACHE_TTL_MS } from "../constants/api";
import { readCache, writeCache, invalidateCache, getToken } from "./storage";

// ─── Helpers ──────────────────────────────────────────────────────────────
function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json().catch(() => ({}));
  const text = await res.text().catch(() => "");
  return { message: text };
}

async function request(path, options = {}, token = null) {
  const headers = {
    "Content-Type": "application/json",
    ...authHeader(token),
    ...options.headers,
  };

  const res = await apiFetch(path, {
    ...options,
    headers,
  });

  const data = await parseResponse(res);

  if (res.status === 401) throw new Error("SESSION_EXPIRED");
  if (!res.ok || !data.success)
    throw new Error(data.message || `Request failed (${res.status})`);

  return data;
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export function sendOtp(email) {
  return request("/auth/sendotp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signUp(payload) {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function changePassword(oldPassword, newPassword) {
  return getToken().then((token) =>
    request(
      "/auth/change-password",
      { method: "POST", body: JSON.stringify({ oldPassword, newPassword }) },
      token
    )
  );
}

// ─── Profile ───────────────────────────────────────────────────────────────
export async function getProfile(forceRefresh = false) {
  const token = await getToken();
  if (!forceRefresh) {
    const cached = await readCache(CACHE_KEYS.profile, PROFILE_CACHE_TTL_MS);
    if (cached) return cached;
  }
  const data = await request("/profile", {}, token);
  await writeCache(CACHE_KEYS.profile, data);
  return data;
}

export async function updateProfile(payload) {
  const token = await getToken();
  const data = await request(
    "/profile",
    { method: "PUT", body: JSON.stringify(payload) },
    token
  );
  await invalidateCache(CACHE_KEYS.profile);
  return data;
}

// ─── Settings ──────────────────────────────────────────────────────────────
export async function getSettings(forceRefresh = false) {
  const token = await getToken();
  if (!forceRefresh) {
    const cached = await readCache(CACHE_KEYS.settings, PROFILE_CACHE_TTL_MS);
    if (cached) return cached;
  }
  const data = await request("/profile/settings", {}, token);
  await writeCache(CACHE_KEYS.settings, data);
  return data;
}

export async function updateSettings(payload) {
  const token = await getToken();
  const data = await request(
    "/profile/settings",
    { method: "PUT", body: JSON.stringify(payload) },
    token
  );
  await invalidateCache(CACHE_KEYS.settings);
  return data;
}

// ─── Content ───────────────────────────────────────────────────────────────
export async function getMedicineUsmleContent(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = await readCache(CACHE_KEYS.content, CACHE_TTL_MS);
    if (cached) return cached;
  }
  const data = await request("/medicine-usmle", { method: "GET" });
  await writeCache(CACHE_KEYS.content, data);
  return data;
}

export async function getVideoDetails({ subjectId, chapterId, videoId }) {
  const params = new URLSearchParams({ subjectId, chapterId, videoId });
  return request(`/medicine-usmle/video?${params.toString()}`, { method: "GET" });
}

// ─── Chat ──────────────────────────────────────────────────────────────────
export async function getChatHistory(sessionId = "") {
  const token = await getToken();
  const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
  return request(`/chat/history${query}`, {}, token);
}

export async function createChatSession() {
  const token = await getToken();
  return request("/chat/session/new", { method: "POST" }, token);
}

export async function deleteChatSession(sessionId) {
  const token = await getToken();
  return request(
    `/chat/session/${encodeURIComponent(sessionId)}`,
    { method: "DELETE" },
    token
  );
}

export async function sendChatMessage(payload) {
  const token = await getToken();
  return request(
    "/chat/send",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

// ─── Sessions ──────────────────────────────────────────────────────────────
export async function getActiveSessions() {
  const token = await getToken();
  return request("/profile/sessions", {}, token);
}

export async function logoutOtherSessions() {
  const token = await getToken();
  return request("/profile/sessions/other/logout", { method: "PUT" }, token);
}

// ─── Warmup ────────────────────────────────────────────────────────────────
export async function warmupBackend() {
  try {
    await apiFetch("/health", { method: "GET" });
  } catch {
    // silently ignore – warmup is best-effort
  }
}
