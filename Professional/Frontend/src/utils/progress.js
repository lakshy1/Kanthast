/**
 * Lecture progress: position, not just completion.
 *
 * The product previously stored only `kanthastWatched[videoId] = true`, so a
 * student who closed a lecture at minute 38 restarted it at zero. This adds
 * per-lecture playback position plus a "last watched" pointer, which is what
 * the Dashboard's Continue-watching card reads.
 *
 * Kept in localStorage alongside the existing watched map so nothing
 * server-side has to change.
 */

const POSITION_KEY = "kanthastProgress";
const LAST_KEY = "kanthastLastWatched";

// Below this we treat playback as "not really started"; above the completion
// ratio we stop offering a resume so the user isn't sent to the credits.
const MIN_RESUME_SECONDS = 15;
const COMPLETE_RATIO = 0.95;

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or private mode — progress is a convenience, never block playback */
  }
}

export function readProgressMap() {
  return readJson(POSITION_KEY, {});
}

/** Position for one lecture: { seconds, duration, updatedAt } or null. */
export function getProgress(videoId) {
  if (!videoId) return null;
  return readProgressMap()[videoId] || null;
}

/**
 * The second offset to resume from, or 0 when the lecture is unstarted,
 * effectively finished, or too close to the beginning to bother.
 */
export function getResumeSeconds(videoId) {
  const entry = getProgress(videoId);
  if (!entry?.seconds || !entry?.duration) return 0;
  if (entry.seconds < MIN_RESUME_SECONDS) return 0;
  if (entry.seconds / entry.duration >= COMPLETE_RATIO) return 0;
  return Math.floor(entry.seconds);
}

/** Persist playback position. Callers throttle this (~5s) via shouldPersist. */
export function saveProgress(videoId, seconds, duration, meta = {}) {
  if (!videoId || !Number.isFinite(seconds) || !Number.isFinite(duration)) return;
  if (duration <= 0) return;

  const map = readProgressMap();
  map[videoId] = {
    seconds: Math.floor(seconds),
    duration: Math.floor(duration),
    updatedAt: Date.now(),
  };
  writeJson(POSITION_KEY, map);

  // Pointer for the Dashboard's resume card.
  if (seconds / duration < COMPLETE_RATIO) {
    writeJson(LAST_KEY, {
      videoId,
      seconds: Math.floor(seconds),
      duration: Math.floor(duration),
      updatedAt: Date.now(),
      ...meta,
    });
  }
}

/** True roughly every `everySeconds` of playback, to avoid a write per tick. */
export function shouldPersist(seconds, everySeconds = 5) {
  return Math.floor(seconds) % everySeconds === 0;
}

/**
 * The lecture to offer as "Continue watching", or null.
 * Cleared automatically once that lecture is marked complete.
 */
export function getLastWatched() {
  const last = readJson(LAST_KEY, null);
  if (!last?.videoId) return null;

  const watched = readJson("kanthastWatched", {});
  if (watched[last.videoId]) return null;

  const remaining = Math.max(0, (last.duration || 0) - (last.seconds || 0));
  return {
    ...last,
    remainingSeconds: remaining,
    percent: last.duration
      ? Math.min(100, Math.round((last.seconds / last.duration) * 100))
      : 0,
  };
}

export function clearLastWatched() {
  try {
    localStorage.removeItem(LAST_KEY);
  } catch {
    /* no-op */
  }
}

/** "14:32 remaining" / "1h 04m remaining" */
export function formatRemaining(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m remaining`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")} remaining`;
}
