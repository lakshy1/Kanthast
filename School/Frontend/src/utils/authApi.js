import { apiFetch } from "./apiBase";

// SECURITY NOTE: tokens are currently stored in localStorage which is accessible
// to any JS running on the page (XSS risk). To fully mitigate this, the backend
// should issue httpOnly cookies instead, removing the need to store tokens here.
function getAuthHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Clears stored credentials and hard-navigates to the appropriate login page.
// Called whenever the server returns 401 so stale tokens are never silently retried.
function handleUnauthorized(path) {
  if (path.includes("/admin")) {
    localStorage.removeItem("kanthastSchoolAdminToken");
    localStorage.removeItem("kanthastSchoolAdminUser");
    window.location.replace("/adminlogin");
  } else {
    localStorage.removeItem("kanthastSchoolToken");
    localStorage.removeItem("kanthastSchoolUser");
    window.location.replace("/login");
  }
}

// The credential endpoints answer a wrong password with 401 too. That is a form
// error, not an expired session, so it must not wipe the session and redirect
// (which reloaded /login and lost the message, and logged users out of
// Settings for mistyping their old password).
const CREDENTIAL_PATHS = ["/auth/login", "/auth/admin-login", "/auth/signup", "/auth/sendotp"];
const CREDENTIAL_MESSAGES = {
  "Invalid credentials": "That email and password don't match. Check them and try again.",
  "Invalid admin credentials": "That admin ID and password don't match.",
  "Invalid old password": "Your current password is incorrect.",
};

async function readResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => ({}));
  }
  const text = await response.text().catch(() => "");
  return { message: text || "" };
}

async function post(path, payload) {
  const response = await apiFetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await readResponseBody(response);

  if (response.status === 401) {
    if (CREDENTIAL_PATHS.includes(path)) {
      throw new Error(CREDENTIAL_MESSAGES[data.message] || data.message || "Those details weren't accepted.");
    }
    handleUnauthorized(path);
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

export function sendOtp(email) {
  return post("/auth/sendotp", { email });
}

export function signUp(payload) {
  return post("/auth/signup", payload);
}

export function login(payload) {
  return post("/auth/login", payload);
}

export function adminLogin(payload) {
  return post("/auth/admin-login", payload);
}

export async function getProfile(token) {
  const response = await apiFetch("/profile", {
    method: "GET",
    headers: {
      ...getAuthHeaders(token),
    },
    credentials: "include",
  });

  if (response.status === 401) {
    handleUnauthorized("/profile");
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch profile");
  }

  return data;
}

export async function updateProfile(token, payload) {
  const response = await apiFetch("/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    handleUnauthorized("/profile");
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to update profile");
  }

  return data;
}

export async function getSettings(token) {
  const response = await apiFetch("/profile/settings", {
    method: "GET",
    headers: {
      ...getAuthHeaders(token),
    },
    credentials: "include",
  });

  if (response.status === 401) {
    handleUnauthorized("/profile/settings");
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch settings");
  }

  return data;
}

export async function changePassword(token, payload) {
  const response = await apiFetch("/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    if (data.message === "Invalid old password") {
      throw new Error(CREDENTIAL_MESSAGES[data.message]);
    }
    handleUnauthorized("/auth/change-password");
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to change password");
  }

  return data;
}

export async function updateSettings(token, payload) {
  const response = await apiFetch("/profile/settings", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    handleUnauthorized("/profile/settings");
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to update settings");
  }

  return data;
}

export async function purchaseSubscriptionPlan(token, payload) {
  const response = await apiFetch("/profile/subscription", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    handleUnauthorized("/profile/subscription");
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to activate subscription");
  }

  return data;
}

export async function deleteAccount(token) {
  const response = await apiFetch("/profile/account", {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(token),
    },
    credentials: "include",
  });

  if (response.status === 401) {
    handleUnauthorized("/profile/account");
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to delete account");
  }

  return data;
}

export async function getActiveSessions(token) {
  const response = await apiFetch("/profile/sessions", {
    method: "GET",
    headers: {
      ...getAuthHeaders(token),
    },
    credentials: "include",
  });

  if (response.status === 401) {
    handleUnauthorized("/profile/sessions");
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch sessions");
  }

  return data;
}

export async function logoutOtherSessions(token) {
  const response = await apiFetch("/profile/sessions/other/logout", {
    method: "PUT",
    headers: {
      ...getAuthHeaders(token),
    },
    credentials: "include",
  });

  if (response.status === 401) {
    handleUnauthorized("/profile/sessions/other/logout");
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to log out other sessions");
  }

  return data;
}

export async function logoutSession(token, sessionId) {
  const response = await apiFetch(`/profile/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(token),
    },
    credentials: "include",
  });

  if (response.status === 401) {
    handleUnauthorized("/profile/sessions");
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to log out session");
  }

  return data;
}

export async function updateCurrentSessionLocation(token, payload) {
  const response = await apiFetch("/profile/sessions/location", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    handleUnauthorized("/profile/sessions/location");
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to update session location");
  }

  return data;
}

export async function getChatHistory(token, sessionId = "") {
  const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
  const response = await apiFetch(`/chat/history${query}`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(token),
    },
    credentials: "include",
  });

  if (response.status === 401) {
    handleUnauthorized("/chat");
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch chat history");
  }
  return data;
}

export async function createChatSession(token) {
  const response = await apiFetch("/chat/session/new", {
    method: "POST",
    headers: {
      ...getAuthHeaders(token),
    },
    credentials: "include",
  });

  if (response.status === 401) {
    handleUnauthorized("/chat");
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to create chat session");
  }
  return data;
}

export async function deleteChatSession(token, sessionId, activeSessionId = "") {
  const query = activeSessionId
    ? `?activeSessionId=${encodeURIComponent(activeSessionId)}`
    : "";
  const response = await apiFetch(
    `/chat/session/${encodeURIComponent(sessionId)}${query}`,
    {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(token),
      },
      credentials: "include",
    }
  );

  if (response.status === 401) {
    handleUnauthorized("/chat");
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to delete chat session");
  }
  return data;
}

export async function sendChatMessage(token, payload) {
  const response = await apiFetch("/chat/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    handleUnauthorized("/chat");
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to send message");
  }
  return data;
}

export async function createAiVideoLecture(token, payload) {
  const response = await apiFetch("/chat/video/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    handleUnauthorized("/chat");
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to start AI video creation");
  }
  return data;
}

export async function getAiVideoLectureStatus(token, jobId) {
  const response = await apiFetch(`/chat/video/status/${encodeURIComponent(jobId)}`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(token),
    },
    credentials: "include",
  });

  if (response.status === 401) {
    handleUnauthorized("/chat");
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch video generation status");
  }
  return data;
}

export async function uploadChatFile(token, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetch("/chat/upload", {
    method: "POST",
    headers: {
      ...getAuthHeaders(token),
    },
    credentials: "include",
    body: formData,
  });

  if (response.status === 401) {
    handleUnauthorized("/chat");
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to upload file");
  }
  return data;
}

export async function getAdminUsers(token) {
  const response = await apiFetch("/auth/admin/users", {
    method: "GET",
    headers: {
      ...getAuthHeaders(token),
    },
    credentials: "include",
  });

  if (response.status === 401) {
    handleUnauthorized("/auth/admin");
    throw new Error("Admin session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch users");
  }
  return data;
}

export async function updateAdminUser(token, userId, payload) {
  const response = await apiFetch(`/auth/admin/users/${encodeURIComponent(userId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    handleUnauthorized("/auth/admin");
    throw new Error("Admin session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to update user");
  }
  return data;
}

export async function deleteAdminUser(token, userId) {
  const response = await apiFetch(`/auth/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(token),
    },
    credentials: "include",
  });

  if (response.status === 401) {
    handleUnauthorized("/auth/admin");
    throw new Error("Admin session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to delete user");
  }
  return data;
}
