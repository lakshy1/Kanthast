// Payments are not open yet. While this is false, every signed in student can open every lecture that has a video,
// and the library shows no paywall. Set it to true together with PAYMENTS_OPEN=true on the server
// (PRO_PAYMENTS_OPEN on Vercel) when payments go live; the first two lectures of each chapter then stay free.
export const PAYMENTS_OPEN = false;
