// utils/practiceApi.js — API client for Practice Studio (MCQ & Flashcards)
import { apiFetch } from "./apiBase";

const getAuthHeaders = () => {
  const token = localStorage.getItem("kanthastSchoolToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ── MCQ API ──────────────────────────────────────────────────────────────────
export async function fetchSubjects(schoolClass = "10") {
  const r = await apiFetch(`/mcq/subjects?class=${schoolClass}`, {
    headers: getAuthHeaders(),
  });
  if (!r.ok) throw new Error("Failed to load subjects");
  return r.json();
}

export async function fetchChapters(subject, schoolClass = "10") {
  const r = await apiFetch(
    `/mcq/chapters?class=${schoolClass}&subject=${encodeURIComponent(subject)}`,
    { headers: getAuthHeaders() }
  );
  if (!r.ok) throw new Error("Failed to load chapters");
  return r.json();
}

export async function startMcqSession({ schoolClass, class: cls, subject, chapterNo, mode, difficulty, count }) {
  const targetClass = schoolClass || cls || "10";
  const r = await apiFetch("/mcq/session/start", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ class: targetClass, subject, chapterNo, mode, difficulty, count }),
  });
  const data = await r.json();
  if (!r.ok || !data.success) throw new Error(data.message || "Failed to start session");
  return data;
}

export async function submitMcqAnswer(sessionId, { questionIndex, shuffleSeed, chosenShuffledIndex, responseMs }) {
  const r = await apiFetch(`/mcq/session/${sessionId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ questionIndex, shuffleSeed, chosenShuffledIndex, responseMs }),
  });
  const data = await r.json();
  if (!r.ok || !data.success) throw new Error(data.message || "Failed to submit answer");
  return data;
}

export async function getMcqResult(sessionId) {
  const r = await apiFetch(`/mcq/session/${sessionId}/result`, {
    headers: getAuthHeaders(),
  });
  if (!r.ok) throw new Error("Failed to load result");
  return r.json();
}

export async function getMcqHistory() {
  const r = await apiFetch("/mcq/history", { headers: getAuthHeaders() });
  if (!r.ok) throw new Error("Failed to load history");
  return r.json();
}

export async function getMcqStats(schoolClass = "10") {
  const r = await apiFetch(`/mcq/stats?class=${schoolClass}`, {
    headers: getAuthHeaders(),
  });
  if (!r.ok) throw new Error("Failed to load stats");
  return r.json();
}

// ── Flashcards API ────────────────────────────────────────────────────────────
export async function fetchFlashcardSubjects(schoolClass = "10") {
  const r = await apiFetch(`/flashcards/subjects?class=${schoolClass}`, {
    headers: getAuthHeaders(),
  });
  if (!r.ok) throw new Error("Failed to load flashcard subjects");
  return r.json();
}

export async function fetchFlashcardChapters(subject, schoolClass = "10") {
  const r = await apiFetch(
    `/flashcards/chapters?class=${schoolClass}&subject=${encodeURIComponent(subject)}`,
    { headers: getAuthHeaders() }
  );
  if (!r.ok) throw new Error("Failed to load flashcard chapters");
  return r.json();
}

export async function startFlashcardSession({ schoolClass, class: cls, subject, chapterNo, mode, limit }) {
  const targetClass = schoolClass || cls || "10";
  const r = await apiFetch("/flashcards/session/start", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ class: targetClass, subject, chapterNo, mode, limit }),
  });
  const data = await r.json();
  if (!r.ok || !data.success) throw new Error(data.message || "Failed to start flashcard session");
  return data;
}

export async function rateFlashcard(sessionId, { cardId, rating, responseMs }) {
  const r = await apiFetch(`/flashcards/session/${sessionId}/rate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ cardId, rating, responseMs }),
  });
  const data = await r.json();
  if (!r.ok || !data.success) throw new Error(data.message || "Failed to rate card");
  return data;
}

export async function getFlashcardResult(sessionId) {
  const r = await apiFetch(`/flashcards/session/${sessionId}/result`, {
    headers: getAuthHeaders(),
  });
  if (!r.ok) throw new Error("Failed to load session result");
  return r.json();
}

export async function getFlashcardHistory() {
  const r = await apiFetch("/flashcards/history", { headers: getAuthHeaders() });
  if (!r.ok) throw new Error("Failed to load flashcard history");
  return r.json();
}

export async function getFlashcardStats() {
  const r = await apiFetch("/flashcards/stats", { headers: getAuthHeaders() });
  if (!r.ok) throw new Error("Failed to load flashcard stats");
  return r.json();
}

// ── Viva Coach API ────────────────────────────────────────────────────────────
export async function fetchVivaSubjects(schoolClass = "10") {
  const r = await apiFetch(`/viva/subjects?class=${schoolClass}`, {
    headers: getAuthHeaders(),
  });
  if (!r.ok) throw new Error("Failed to load viva subjects");
  return r.json();
}

export async function fetchVivaChapters(subject, schoolClass = "10") {
  const r = await apiFetch(
    `/viva/chapters?class=${schoolClass}&subject=${encodeURIComponent(subject)}`,
    { headers: getAuthHeaders() }
  );
  if (!r.ok) throw new Error("Failed to load viva chapters");
  return r.json();
}

export async function startVivaSession({ schoolClass, class: cls, subject, chapterNo, mode, difficulty, count }) {
  const targetClass = schoolClass || cls || "10";
  const r = await apiFetch("/viva/session/start", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ class: targetClass, subject, chapterNo, mode, difficulty, count }),
  });
  const data = await r.json();
  if (!r.ok || !data.success) throw new Error(data.message || "Failed to start viva session");
  return data;
}

export async function submitVivaAnswer(sessionId, { questionIndex, transcript, inputMode, responseMs }) {
  const r = await apiFetch(`/viva/session/${sessionId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ questionIndex, transcript, inputMode, responseMs }),
  });
  const data = await r.json();
  if (!r.ok || !data.success) throw new Error(data.message || "Failed to evaluate viva answer");
  return data;
}

export async function completeVivaSession(sessionId, { conversationLog, status = "completed" }) {
  const r = await apiFetch(`/viva/session/${sessionId}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ conversationLog, status }),
  });
  const data = await r.json();
  if (!r.ok || !data.success) throw new Error(data.message || "Failed to save viva session");
  return data;
}

export async function getVivaResult(sessionId) {
  const r = await apiFetch(`/viva/session/${sessionId}/result`, {
    headers: getAuthHeaders(),
  });
  if (!r.ok) throw new Error("Failed to load viva result");
  return r.json();
}

export async function getVivaHistory() {
  const r = await apiFetch("/viva/history", { headers: getAuthHeaders() });
  if (!r.ok) throw new Error("Failed to load viva history");
  return r.json();
}

export async function getVivaStats() {
  const r = await apiFetch("/viva/stats", { headers: getAuthHeaders() });
  if (!r.ok) throw new Error("Failed to load viva stats");
  return r.json();
}
