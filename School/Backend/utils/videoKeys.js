import crypto from "crypto";

// Every lesson's AES-128 key is derived from one master secret and the lesson id, so keys
// never need storing and the encoder and the server always agree on them.
export function lessonKey(secret, lessonId) {
  if (!secret || secret.length < 32) throw new Error("VIDEO_KEY_SECRET must be set (at least 32 characters).");
  return crypto.createHmac("sha256", secret).update(`kanthast-lesson-key:${lessonId}`).digest().subarray(0, 16);
}

// A fixed, per-lesson initialisation vector (never the all zero default).
export function lessonIv(secret, lessonId) {
  return crypto.createHmac("sha256", secret).update(`kanthast-lesson-iv:${lessonId}`).digest().subarray(0, 16);
}
