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
