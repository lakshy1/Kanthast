import crypto from "crypto";

// Every lecture's AES-128 key is derived from one master secret and the lecture id, so keys
// never need storing and the encoder and the server always agree on them.
export function lectureKey(secret, lectureId) {
  if (!secret || secret.length < 32) throw new Error("VIDEO_KEY_SECRET must be set (at least 32 characters).");
  return crypto.createHmac("sha256", secret).update(`kanthast-pro-lecture-key:${lectureId}`).digest().subarray(0, 16);
}

// A fixed, per-lecture initialisation vector (never the all zero default).
export function lectureIv(secret, lectureId) {
  return crypto.createHmac("sha256", secret).update(`kanthast-pro-lecture-iv:${lectureId}`).digest().subarray(0, 16);
}
