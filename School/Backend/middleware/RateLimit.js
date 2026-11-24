// Fixed-window, in-memory rate limiter. Counts are kept per server instance,
// so on serverless hosting this is a best-effort brake on abuse, not a hard
// global cap. Move to a shared store (Redis/Mongo) if strict limits are needed.
const buckets = new Map();

export const rateLimit = ({ name, windowMs, max, message }) => {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${name}:${req.user?.id || req.ip || "unknown"}`;
    let bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        success: false,
        message: message || `Too many requests. Try again in ${retryAfter} seconds.`,
      });
    }

    // Drop expired buckets now and then so the map cannot grow without bound.
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (now > b.resetAt) buckets.delete(k);
    }
    return next();
  };
};

const MINUTE = 60_000;

// Credential guessing: login, admin login.
export const loginLimiter = rateLimit({ name: "login", windowMs: 15 * MINUTE, max: 10, message: "Too many login attempts. Please wait a few minutes and try again." });
// Anything that sends an email (OTP, reset link) or creates an account.
export const emailLimiter = rateLimit({ name: "email", windowMs: 15 * MINUTE, max: 5, message: "Too many requests. Please wait a few minutes and try again." });
export const signupLimiter = rateLimit({ name: "signup", windowMs: 60 * MINUTE, max: 10, message: "Too many sign-up attempts. Please try again later." });
export const resetLimiter = rateLimit({ name: "reset", windowMs: 15 * MINUTE, max: 10, message: "Too many attempts. Please wait a few minutes and try again." });
// Contact form and file uploads.
export const contactLimiter = rateLimit({ name: "contact", windowMs: 60 * MINUTE, max: 5, message: "Too many messages. Please try again later." });
export const uploadLimiter = rateLimit({ name: "upload", windowMs: 10 * MINUTE, max: 20 });
