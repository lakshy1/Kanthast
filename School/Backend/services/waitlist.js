const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INTERESTS = new Set(["professional", "school", "both"]);

/** Cleans a waitlist submission. Returns { ok: true, value } or { ok: false, message }. */
export function normalizeWaitlist(body = {}) {
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL.test(email)) return { ok: false, message: "Enter a valid email address." };
  const interest = INTERESTS.has(body.interest) ? body.interest : "both";
  return { ok: true, value: { email, interest, source: "kanthast-home" } };
}
