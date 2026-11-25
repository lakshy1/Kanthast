// Rules for "one active stream per account", kept apart from the database so they can be tested.
const STREAM_ID = /^[a-f0-9-]{16,64}$/i;

/** The stream id the player sends in the X-Stream-Id header, or null if it is missing or malformed. */
export const streamIdFrom = (value) => (STREAM_ID.test(String(value || "")) ? String(value) : null);

/** True only when this stream is the account's current one. */
export const isCurrentStream = (current, streamId) => Boolean(current && streamId && current.streamId === streamId);

/** Seconds watched as reported by a player: a whole number between 0 and a day, never trusted beyond that. */
export const clampSeconds = (value) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? Math.min(86_400, Math.max(0, n)) : 0;
};

// Anti-scraping limits. A student watches lessons of 2 to 3.5 minutes, so these are far above real use and
// far below what it takes to pull the whole catalogue with a script.
export const MAX_LESSONS_PER_HOUR = 40;
export const MAX_LESSONS_PER_DAY = 150;
export const MAX_KEY_FETCHES_PER_STREAM = 40;

/** True when an account has started too many different lessons recently (a sign of bulk downloading). */
export const startedTooMany = ({ lastHour = 0, lastDay = 0 }) => lastHour > MAX_LESSONS_PER_HOUR || lastDay > MAX_LESSONS_PER_DAY;

/** True when one stream has asked for the lesson key more often than a real player ever does. */
export const askedForKeyTooOften = (keyFetches) => Number(keyFetches) > MAX_KEY_FETCHES_PER_STREAM;

/** A short code from a stream id, shown in the watermark so a recording points to one viewing session. */
export const streamTag = (streamId) => String(streamId || "").replace(/[^a-f0-9]/gi, "").slice(0, 4).toUpperCase();
