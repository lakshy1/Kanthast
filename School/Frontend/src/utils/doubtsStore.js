// Client-side Stale-While-Revalidate (SWR) & UI state retention store for the
// Doubts module (Gate/Consent/Quota, Class feed, My doubts, DoubtThread, Ask AI).
//
// Scoped strictly to the active auth token so logout or account switching wipes
// all cached data immediately and never leaks another student's state.

const STORAGE_KEY = "kanthastDoubtsStore_v1";
const TOKEN_KEY = "kanthastSchoolToken";

export const STALE_MS = {
  consent: 120_000, // 2 min
  quota: 30_000,    // 30 s
  feed: 30_000,     // 30 s
  thread: 15_000,   // 15 s
  ask: 20_000,      // 20 s
};

function currentToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

function makeEmptyStore(token = "") {
  return {
    token,
    gate: {
      consent: null, // "approved" | "needed"
      consentFetchedAt: 0,
      quota: null,
      mute: null,
      quotaFetchedAt: 0,
    },
    // Keyed by `${tab}:${subject}` (e.g. "class:__all__", "class:Science", "mine:")
    feeds: {},
    // Keyed by tab ("class" | "mine"): { subject, statusFilter, searchQuery, subjectCounts, deckIndex }
    tabUi: {},
    // Keyed by doubtId: { doubt, replies, fetchedAt }
    threads: {},
    // Ask AI state: { sessions, activeSessionId, messagesBySession, aiQuota, limitHit, input, attachment, fetchedAt }
    ask: {
      sessions: null,
      activeSessionId: "",
      messagesBySession: {},
      aiQuota: null,
      limitHit: null,
      input: "",
      attachment: null,
      fetchedAt: 0,
    },
    lastSection: "class",
  };
}

let store = makeEmptyStore(currentToken());
let hydrated = false;
const inFlight = new Map();

function persistStore() {
  try {
    if (!store.token) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    // Trim Ask message map to the active session + 2 most recent sessions so
    // sessionStorage never hits size limits during long sessions.
    const keepIds = new Set(
      [
        store.ask.activeSessionId,
        ...(store.ask.sessions || []).slice(-2).map((s) => s.sessionId),
      ].filter(Boolean)
    );
    const trimmedMessages = {};
    for (const [sid, msgs] of Object.entries(store.ask.messagesBySession || {})) {
      if (keepIds.has(sid) && Array.isArray(msgs)) {
        trimmedMessages[sid] = msgs.slice(-60);
      }
    }

    // Trim cached threads to the 12 most recent entries.
    const threadEntries = Object.entries(store.threads || {})
      .sort((a, b) => (b[1]?.fetchedAt || 0) - (a[1]?.fetchedAt || 0))
      .slice(0, 12);

    const payload = {
      token: store.token,
      gate: store.gate,
      feeds: store.feeds,
      tabUi: store.tabUi,
      threads: Object.fromEntries(threadEntries),
      ask: {
        ...store.ask,
        messagesBySession: trimmedMessages,
      },
      lastSection: store.lastSection || "class",
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage quota full or blocked: in-memory cache still holds full session.
  }
}

function ensureStore() {
  const token = currentToken();
  if (!token) {
    if (store.token || hydrated) {
      store = makeEmptyStore("");
      inFlight.clear();
      hydrated = true;
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage errors on clear.
      }
    }
    return store;
  }

  if (!hydrated || store.token !== token) {
    hydrated = true;
    inFlight.clear();
    let restored = null;
    try {
      const raw = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (raw && raw.token === token) restored = raw;
    } catch {
      restored = null;
    }
    const base = makeEmptyStore(token);
    if (restored) {
      store = {
        ...base,
        gate: { ...base.gate, ...(restored.gate || {}) },
        feeds: restored.feeds || {},
        tabUi: restored.tabUi || {},
        threads: restored.threads || {},
        ask: { ...base.ask, ...(restored.ask || {}) },
        lastSection: restored.lastSection || "class",
      };
    } else {
      store = base;
    }
  }
  return store;
}

export function clearDoubtsStore() {
  store = makeEmptyStore("");
  hydrated = false;
  inFlight.clear();
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

if (typeof window !== "undefined") {
  const syncSession = () => {
    if (currentToken() !== store.token) clearDoubtsStore();
  };
  window.addEventListener("kanthast-session", syncSession);
  window.addEventListener("storage", (e) => {
    if (!e.key || e.key === TOKEN_KEY) syncSession();
  });
}

export function isFresh(fetchedAt, ttl) {
  return typeof fetchedAt === "number" && fetchedAt > 0 && Date.now() - fetchedAt < ttl;
}

/** Deduplicates concurrent identical fetches across mounts. */
export function dedupeRequest(key, fn) {
  if (inFlight.has(key)) return inFlight.get(key);
  const promise = Promise.resolve()
    .then(fn)
    .finally(() => {
      inFlight.delete(key);
    });
  inFlight.set(key, promise);
  return promise;
}

// ─── Gate (Consent, Quota, Mute) ───────────────────────────────────────────

export function getGateCache() {
  return ensureStore().gate;
}

export function setConsentCache(consent) {
  const s = ensureStore();
  s.gate = { ...s.gate, consent, consentFetchedAt: Date.now() };
  persistStore();
}

export function setQuotaCache({ quota, mute }) {
  const s = ensureStore();
  s.gate = {
    ...s.gate,
    ...(quota !== undefined ? { quota } : {}),
    ...(mute !== undefined ? { mute } : {}),
    quotaFetchedAt: Date.now(),
  };
  persistStore();
}

// ─── Feeds & Tab Filter UI ─────────────────────────────────────────────────

export const feedKey = (tab, subject = "") => `${tab}:${tab === "mine" ? "" : subject || "__all__"}`;

export function getFeedCache(tab, subject = "") {
  const s = ensureStore();
  return s.feeds[feedKey(tab, subject)] || null;
}

export function setFeedCache(tab, subject = "", { doubts, nextBefore }) {
  const s = ensureStore();
  s.feeds[feedKey(tab, subject)] = {
    doubts: Array.isArray(doubts) ? doubts : [],
    nextBefore: nextBefore || null,
    fetchedAt: Date.now(),
  };
  persistStore();
}

export function getTabUi(tab) {
  const s = ensureStore();
  return s.tabUi[tab] || null;
}

export function patchTabUi(tab, patch) {
  const s = ensureStore();
  s.tabUi[tab] = { ...(s.tabUi[tab] || {}), ...patch };
  persistStore();
}

export function invalidateFeedCaches() {
  const s = ensureStore();
  for (const key of Object.keys(s.feeds)) {
    s.feeds[key] = { ...s.feeds[key], fetchedAt: 0 };
  }
  persistStore();
}

// ─── Threads ───────────────────────────────────────────────────────────────

export function getThreadCache(id) {
  if (!id) return null;
  return ensureStore().threads[id] || null;
}

export function setThreadCache(id, { doubt, replies }) {
  if (!id) return;
  const s = ensureStore();
  s.threads[id] = {
    doubt,
    replies: Array.isArray(replies) ? replies : [],
    fetchedAt: Date.now(),
  };
  persistStore();
}

export function removeDoubtFromCaches(id) {
  if (!id) return;
  const s = ensureStore();
  delete s.threads[id];
  for (const [key, entry] of Object.entries(s.feeds)) {
    if (!entry?.doubts) continue;
    s.feeds[key] = {
      ...entry,
      doubts: entry.doubts.filter((d) => d.id !== id),
      fetchedAt: 0,
    };
  }
  persistStore();
}

/** Optimistically propagates doubt updates (helpful toggle, reply count, resolved) across cached feeds & thread. */
export function patchDoubtInCaches(id, updater) {
  if (!id || typeof updater !== "function") return;
  const s = ensureStore();
  if (s.threads[id]?.doubt) {
    s.threads[id] = { ...s.threads[id], doubt: updater(s.threads[id].doubt) };
  }
  for (const [key, entry] of Object.entries(s.feeds)) {
    if (!entry?.doubts) continue;
    let changed = false;
    const nextDoubts = entry.doubts.map((d) => {
      if (d.id !== id) return d;
      changed = true;
      return updater(d);
    });
    if (changed) s.feeds[key] = { ...entry, doubts: nextDoubts };
  }
  persistStore();
}

// ─── Ask AI (Chatbot) ──────────────────────────────────────────────────────

export function getAskCache() {
  return ensureStore().ask;
}

export function patchAskCache(patch) {
  const s = ensureStore();
  s.ask = { ...s.ask, ...patch };
  persistStore();
}

export function setAskSessionMessages(sessionId, messages) {
  if (!sessionId) return;
  const s = ensureStore();
  s.ask = {
    ...s.ask,
    messagesBySession: {
      ...(s.ask.messagesBySession || {}),
      [sessionId]: Array.isArray(messages) ? messages : [],
    },
  };
  persistStore();
}

const VALID_SECTIONS = new Set(["class", "ask", "mine"]);

export function setLastDoubtsSection(section) {
  if (!VALID_SECTIONS.has(section)) return;
  const s = ensureStore();
  if (s.lastSection === section) return;
  s.lastSection = section;
  persistStore();
}

export function getLastDoubtsPath() {
  const sec = ensureStore().lastSection;
  return VALID_SECTIONS.has(sec) ? `/doubts/${sec}` : "/doubts/class";
}
