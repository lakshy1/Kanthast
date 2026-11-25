#!/usr/bin/env node
// Is Kanthast ready to switch from "coming soon" to "open"? Counts playable content on the live APIs.
// Usage: node scripts/readiness.mjs [baseUrl]    (default https://kanthast.in)
// Exit code 0 only when both products pass; use it before setting LESSONS_OPEN = true.
const base = (process.argv[2] || "https://kanthast.in").replace(/\/$/, "");
const SCHOOL_TOTAL = 923; // lessons scripted (School/Frontend/src/data/schoolCatalog.js)
const MIN_SCHOOL = 50;    // adjust: the smallest number of live lessons that makes opening worthwhile
const MIN_PRO = 20;

const getJson = async (path) => {
  const response = await fetch(`${base}${path}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${path} answered ${response.status}`);
  return response.json();
};

const rows = [];

try {
  const data = await getJson("/school/api/v1/playback/available");
  const live = Array.isArray(data.lessons) ? data.lessons.length : 0;
  rows.push({ product: "School", live, of: SCHOOL_TOTAL, need: MIN_SCHOOL, ok: live >= MIN_SCHOOL });
} catch (error) {
  rows.push({ product: "School", error: error.message, ok: false });
}

try {
  const data = await getJson("/professional/api/v1/medicine-usmle");
  const lectures = (data.content?.subjects || []).flatMap((s) => (s.chapters || []).flatMap((c) => c.videos || []));
  // The public API only marks a lecture playable (secure:<id>) while the server has PRO_LECTURES_LIVE on.
  const live = lectures.filter((v) => String(v.videoLink || "").startsWith("secure:")).length;
  rows.push({ product: "Professional", live, of: lectures.length, need: MIN_PRO, ok: live >= MIN_PRO,
    note: live === 0 ? "0 may also mean lectures are not marked live on the server yet" : "" });
} catch (error) {
  rows.push({ product: "Professional", error: error.message, ok: false });
}

for (const r of rows) {
  const status = r.ok ? "READY " : "NOT READY";
  console.log(r.error ? `${status}  ${r.product}: ${r.error}` : `${status}  ${r.product}: ${r.live} of ${r.of} playable (need ${r.need})${r.note ? `  [${r.note}]` : ""}`);
}
console.log("\nPayments: disabled. Rebuild Razorpay around plans before setting PAYMENTS_OPEN.");
process.exit(rows.every((r) => r.ok) ? 0 : 1);
