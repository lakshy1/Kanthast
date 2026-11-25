// Payments are not open yet. While this is false, every signed in student can open every lecture that has a video,
// and the library shows no paywall. Set it to true together with PAYMENTS_OPEN=true on the server
// (PRO_PAYMENTS_OPEN on Vercel) when payments go live; the first two lectures of each chapter then stay free.
export const PAYMENTS_OPEN = false;

// Lectures are not playable yet. While false, the homepage and exam pages ask for a waitlist email and say
// "coming soon". Set to true when real lectures play (and the server's PRO_LECTURES_LIVE is on); the pages then
// invite people to create an account and open a lecture. Check with: node scripts/readiness.mjs
export const LESSONS_OPEN = false;
