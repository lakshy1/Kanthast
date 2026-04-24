const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

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
    localStorage.removeItem("kanthastAdminToken");
    localStorage.removeItem("kanthastAdminUser");
    window.location.replace("/adminlogin");
  } else {
    localStorage.removeItem("kanthastToken");
    localStorage.removeItem("kanthastUser");
    window.location.replace("/login");
  }
}

async function readResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => ({}));
  }
  const text = await response.text().catch(() => "");
  return { message: text || "" };
}

async function post(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await readResponseBody(response);

  if (response.status === 401) {
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
  const response = await fetch(`${API_BASE_URL}/profile`, {
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
  const response = await fetch(`${API_BASE_URL}/profile`, {
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

export async function purchaseSubscriptionPlan(token, payload) {
  const response = await fetch(`${API_BASE_URL}/profile/subscription`, {
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

export async function getChatHistory(token, sessionId = "") {
  const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
  const response = await fetch(`${API_BASE_URL}/chat/history${query}`, {
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
  const response = await fetch(`${API_BASE_URL}/chat/session/new`, {
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
  const response = await fetch(
    `${API_BASE_URL}/chat/session/${encodeURIComponent(sessionId)}${query}`,
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
  const response = await fetch(`${API_BASE_URL}/chat/send`, {
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

export async function uploadChatFile(token, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/chat/upload`, {
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
  const response = await fetch(`${API_BASE_URL}/auth/admin/users`, {
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
  const response = await fetch(`${API_BASE_URL}/auth/admin/users/${encodeURIComponent(userId)}`, {
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
  const response = await fetch(`${API_BASE_URL}/auth/admin/users/${encodeURIComponent(userId)}`, {
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

export async function getMedicineUsmleContent() {
  const response = await fetch(`${API_BASE_URL}/medicine-usmle`, {
    method: "GET",
    credentials: "include",
  });

  const data = await readResponseBody(response);
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Failed to fetch Medicine/USMLE content (${response.status})`);
  }
  return data;
}

export async function getMedicineUsmleVideoDetails({ subjectId, chapterId, videoId }) {
  const query = new URLSearchParams({
    subjectId,
    chapterId,
    videoId,
  });

  const response = await fetch(`${API_BASE_URL}/medicine-usmle/video?${query.toString()}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await readResponseBody(response);
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Failed to fetch lecture details (${response.status})`);
  }
  return data;
}

export async function updateMedicineUsmleContent(token, payload) {
  const response = await fetch(`${API_BASE_URL}/medicine-usmle/admin`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    handleUnauthorized("/medicine-usmle/admin");
    throw new Error("Admin session expired. Please log in again.");
  }

  const data = await readResponseBody(response);
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Failed to update Medicine/USMLE content (${response.status})`);
  }
  return data;
}

async function authedJsonRequest(path, method, token, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    credentials: "include",
    body: JSON.stringify(payload || {}),
  });

  if (response.status === 401) {
    handleUnauthorized(path);
    throw new Error("Session expired. Please log in again.");
  }

  const data = await readResponseBody(response);
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Medicine/USMLE admin request failed (${response.status})`);
  }
  return data;
}

export function createMedicineSubject(token, payload) {
  return authedJsonRequest("/medicine-usmle/admin/subjects", "POST", token, payload);
}

export function updateMedicineSubject(token, subjectId, payload) {
  return authedJsonRequest(`/medicine-usmle/admin/subjects/${encodeURIComponent(subjectId)}`, "PATCH", token, payload);
}

export function deleteMedicineSubject(token, subjectId) {
  return authedJsonRequest(`/medicine-usmle/admin/subjects/${encodeURIComponent(subjectId)}`, "DELETE", token, {});
}

export function createMedicineChapter(token, subjectId, payload) {
  return authedJsonRequest(
    `/medicine-usmle/admin/subjects/${encodeURIComponent(subjectId)}/chapters`,
    "POST",
    token,
    payload
  );
}

export function updateMedicineChapter(token, subjectId, chapterId, payload) {
  return authedJsonRequest(
    `/medicine-usmle/admin/subjects/${encodeURIComponent(subjectId)}/chapters/${encodeURIComponent(chapterId)}`,
    "PATCH",
    token,
    payload
  );
}

export function deleteMedicineChapter(token, subjectId, chapterId) {
  return authedJsonRequest(
    `/medicine-usmle/admin/subjects/${encodeURIComponent(subjectId)}/chapters/${encodeURIComponent(chapterId)}`,
    "DELETE",
    token,
    {}
  );
}

export function createMedicineVideo(token, subjectId, chapterId, payload) {
  return authedJsonRequest(
    `/medicine-usmle/admin/subjects/${encodeURIComponent(subjectId)}/chapters/${encodeURIComponent(chapterId)}/videos`,
    "POST",
    token,
    payload
  );
}

export function updateMedicineVideo(token, subjectId, chapterId, videoId, payload) {
  return authedJsonRequest(
    `/medicine-usmle/admin/subjects/${encodeURIComponent(subjectId)}/chapters/${encodeURIComponent(chapterId)}/videos/${encodeURIComponent(videoId)}`,
    "PATCH",
    token,
    payload
  );
}

export function deleteMedicineVideo(token, subjectId, chapterId, videoId) {
  return authedJsonRequest(
    `/medicine-usmle/admin/subjects/${encodeURIComponent(subjectId)}/chapters/${encodeURIComponent(chapterId)}/videos/${encodeURIComponent(videoId)}`,
    "DELETE",
    token,
    {}
  );
}
