// Payments are not open yet. While this is false, every lesson that has a video is free for any signed in
// student, and the library shows no paywall. Set it to true together with PAYMENTS_OPEN=true on the server
// (SCHOOL_PAYMENTS_OPEN on Vercel) when payments go live; the first two lessons of each chapter then stay free.
export const PAYMENTS_OPEN = false;

// Lessons are not playable for everyone yet. While false, the homepage counts down to the first lessons.
// Set to true once lessons play for signed-in students (check with: node scripts/readiness.mjs).
export const LESSONS_OPEN = false;
