const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

function getAuthHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
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

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Request failed");
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

export async function getProfile(token) {
  const response = await fetch(`${API_BASE_URL}/profile`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(token),
    },
    credentials: "include",
  });

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

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to upload file");
  }
  return data;
}
