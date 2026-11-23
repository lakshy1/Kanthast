// End-to-end test for Doubts moderation (/api/v1/admin/doubts) and the mute on student writes.
// NOT picked up by `npm test`. Run:  node tests/e2e/moderation.e2e.mjs   (from School/Backend)
//
// Wired exactly like doubts.e2e.mjs: the throwaway database below (name asserted before any write,
// dropped at the end), its own servers on their own ports (no real email: BREVO_API_KEY is invalid),
// and a local Gemini stub (GEMINI_BASE_URL) so nothing reaches Google. Run it after, not alongside,
// doubts.e2e.mjs: both use the same database.
import { spawn } from "node:child_process";
import http from "node:http";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const DB = "kanthast_school_e2e_api";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = path.resolve(HERE, "../..");
process.env.MONGODB_DB = DB; // set before dotenv so .env can never override it
dotenv.config({ path: path.join(BACKEND, ".env"), quiet: true });
process.env.MONGODB_DB = DB;
if (!process.env.MONGODB_URL || !process.env.JWT_SECRET) throw new Error("MONGODB_URL / JWT_SECRET missing");

const { default: User } = await import("../../models/User.js");
const { default: ParentConsent } = await import("../../models/ParentConsent.js");
const { default: Doubt } = await import("../../models/Doubt.js");
const { default: DoubtReply } = await import("../../models/DoubtReply.js");
const { default: DoubtReport } = await import("../../models/DoubtReport.js");
const { default: ModerationAction } = await import("../../models/ModerationAction.js");

const RUN = crypto.randomBytes(3).toString("hex");
const A = "http://localhost:4131"; // no AI key: moderation allows everything not caught by patterns
const B = "http://localhost:4132"; // Gemini stub (AI answers, Ask AI)
const STUB_KEY = "e2e-stub-key";
const children = [];
const results = [];
const leaks = [];
const notes = [];

async function portFree(port) {
  const net = await import("node:net");
  for (const host of ["127.0.0.1", "::1"]) {
    const busy = await new Promise((resolve) => {
      const sock = net.connect({ port, host });
      sock.once("connect", () => { sock.destroy(); resolve(true); });
      sock.once("error", () => resolve(false));
    });
    if (busy) return false;
  }
  return true;
}

// ------------------------------------------------------------------ Gemini stub (as in doubts.e2e.mjs)
const STUB_ANSWER = "STUB AI ANSWER: Ice floats because it is less dense than water.";
const STUB_FULL = "STUB FULL: Take 3 from both sides to get 2x = 4, so x = 2.";
const STUB_DRAFT = { title: "Why does ice float on water? (stub draft)", body: "I still do not understand density.", subject: "Science", chapter: "Matter" };
let STUB = "";
const stub = http.createServer(async (req, res) => {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const url = new URL(req.url, "http://stub");
  const send = (status, obj) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
  const reply = (text) => send(200, { candidates: [{ content: { parts: [{ text }] } }] });
  if (url.searchParams.get("key") !== STUB_KEY) return send(403, { error: { message: "API key not valid (stub)" } });
  if (req.method === "GET" && /^\/v1(beta)?\/models$/.test(url.pathname)) {
    return send(200, { models: [{ name: "models/stub-flash", supportedGenerationMethods: ["generateContent"] }] });
  }
  const m = /^\/v1(beta)?\/models\/([^/:]+):generateContent$/.exec(url.pathname);
  if (req.method !== "POST" || !m) return send(404, { error: { message: "not found (stub)" } });
  let body = {};
  try { body = JSON.parse(raw || "{}"); } catch {}
  const system = (body.systemInstruction?.parts || []).map((p) => p.text || "").join("\n");
  const all = (body.contents || []).flatMap((c) => c.parts || []).map((p) => p.text || "").join("\n");
  if (/review posts/i.test(system)) return reply(JSON.stringify({ allowed: true, reason: "ok", language: "english", english_version: "" }));
  if (/patient tutor/i.test(system)) return reply(STUB_ANSWER);
  if (/turn a student's chat/i.test(system)) return reply(JSON.stringify(STUB_DRAFT));
  if (/Kanthast Support Assistant/.test(all)) return reply(STUB_FULL);
  return send(400, { error: { message: "stub: unknown request" } });
});

async function startServer(port, aiKey, extraEnv = {}) {
  if (!(await portFree(port))) throw new Error(`port ${port} is already in use by another process; refusing to run`);
  const env = { ...process.env, MONGODB_DB: DB, BREVO_API_KEY: "e2e-invalid-key", PORT: String(port), GEMINI_BASE_URL: STUB, OPENAI_API_KEY: "", DOUBT_POSTS_FREE: "50", ...extraEnv };
  if (aiKey !== undefined) env.GEMINI_API_KEY = aiKey;
  const child = spawn("node", ["server.js"], { cwd: BACKEND, env, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", (d) => {
    const s = String(d);
    if (/DB Connected/.test(s) && !s.includes(DB)) throw new Error("server connected to wrong DB: " + s);
  });
  child.stderr.on("data", () => {});
  children.push(child);
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://localhost:${port}/health`);
      if (r.status === 200) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`server on ${port} did not become healthy`);
}

// Student data a moderator must never be sent: account secrets, and anything from the parent's approval.
const SECRET_KEYS = /"(lastName|password|image|email|accountType|token|additionalDetails|requestedBy|sourceChatSession|parentEmail|parentName|contactNumber)"\s*:/;
const call = async (base, token, method, url, body, raw) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (raw !== undefined) { payload = raw; headers["Content-Type"] = "application/json"; }
  else if (body !== undefined) { payload = JSON.stringify(body); headers["Content-Type"] = "application/json"; }
  const res = await fetch(base + url, { method, headers, body: payload });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = null; }
  if (SECRET_KEYS.test(text) || text.includes(`LASTNAME${RUN}`) || text.includes(`IMG_${RUN}`) ||
      text.includes(`hashedpw-${RUN}`) || text.includes(`e2e.${RUN}.`) || text.includes(`parent.${RUN}.`) || text.includes(`PHONE${RUN}`)) {
    leaks.push(`${method} ${url} -> ${text.slice(0, 200)}`);
  }
  return { status: res.status, body: json, text, req: `${method} ${url} ${body ? JSON.stringify(body).slice(0, 120) : ""}` };
};
const api = (base, token, method, url, body, raw) => call(base, token, method, "/api/v1/doubts" + url, body, raw);
const adm = (token, method, url, body, raw, base = A) => call(base, token, method, "/api/v1/admin/doubts" + url, body, raw);
const expect = (r, status, code) => {
  const ok = r.status === status && (code === undefined || r.body?.code === code);
  if (!ok) throw new Error(`${r.req}\n  expected ${status}${code ? " " + code : ""}, got ${r.status} ${r.text.slice(0, 300)}`);
  return r;
};

class Skip extends Error {}
async function t(name, fn) {
  try { await fn(); results.push({ name, ok: true }); console.log("PASS", name); }
  catch (e) {
    if (e instanceof Skip) { results.push({ name, ok: true, skip: true }); console.log("SKIP", name, "-", e.message); return; }
    results.push({ name, ok: false, err: e.message }); console.log("FAIL", name, "\n    " + e.message.split("\n").join("\n    "));
  }
}

let seq = 0;
const sign = (id) => jwt.sign({ id: String(id) }, process.env.JWT_SECRET, { issuer: "kanthast-school", audience: "kanthast-school", expiresIn: "1h" });
async function mkUser({ cls = "8", consent = true, admin = false, first } = {}) {
  assert.equal(mongoose.connection.name, DB);
  const _id = new mongoose.Types.ObjectId();
  seq += 1;
  const user = await User.create({
    _id, firstName: first || `Fn${seq}`, lastName: `LASTNAME${RUN}x${seq}`, email: `e2e.${RUN}.${seq}@example.test`,
    password: `hashedpw-${RUN}`, contactNumber: `PHONE${RUN}${seq}`, accountType: admin ? "Admin" : "Student",
    additionalDetails: new mongoose.Types.ObjectId(), image: `IMG_${RUN}_${seq}`, schoolClass: admin ? "" : cls,
  });
  if (consent && !admin) {
    await ParentConsent.create({ user: _id, parentName: "Parent", parentEmail: `parent.${RUN}.${seq}@example.test`, status: "approved", approvedAt: new Date() });
  }
  const token = admin
    ? jwt.sign({ id: String(_id), accountType: "Admin" }, process.env.JWT_SECRET, { issuer: "kanthast-school", audience: "kanthast-school", expiresIn: "1h" })
    : sign(_id);
  return { id: String(_id), token, user };
}

let n = 0;
const clean = (s = "Why does ice float on water") => ({ subject: "Science", title: `${s} ${RUN} ${++n}`, body: "I read the chapter but am confused." });
// Items made straight in the database, for cases that are not about posting.
const mkDoubt = (author, over = {}) => Doubt.create({ author: author.id, schoolClass: "8", subject: "Science", title: `Seeded doubt ${RUN} ${++n}`, body: "Seeded body text", status: "live", ...over });
async function mkReply(doubt, author, over = {}) {
  const reply = await DoubtReply.create({ doubt: doubt._id, author: author ? author.id : null, isAI: !author, body: `Seeded reply ${RUN} ${++n}`, status: "live", ...over });
  if ((over.status || "live") === "live") await Doubt.updateOne({ _id: doubt._id }, { $inc: { replyCount: 1 }, ...(author ? {} : { $set: { hasAiAnswer: true } }) });
  return reply;
}
const report = (u, targetType, targetId, reason = "spam", note) =>
  api(A, u.token, "POST", "/report", { targetType, targetId: String(targetId), reason, ...(note ? { note } : {}) });
const act = (admin, type, id, action, note) => adm(admin.token, "POST", `/items/${type}/${id}/action`, { action, ...(note !== undefined ? { note } : {}) });
const inQueue = async (admin, id, status = "open", type) => {
  let cursor = "";
  for (let i = 0; i < 20; i++) {
    const r = expect(await adm(admin.token, "GET", `/queue?status=${status}${type ? `&type=${type}` : ""}${cursor ? `&cursor=${cursor}` : ""}`), 200);
    const hit = r.body.items.find((e) => e.id === String(id));
    if (hit) return hit;
    if (!r.body.nextCursor) return null;
    cursor = r.body.nextCursor;
  }
  return null;
};
const actionsFor = (id) => ModerationAction.countDocuments({ target: id });

let cleanedUp = false;
async function cleanup() {
  if (cleanedUp) return; cleanedUp = true;
  for (const c of children) { try { c.kill("SIGTERM"); } catch {} }
  try { stub.close(); } catch {}
  try {
    if (mongoose.connection.readyState === 1) {
      assert.equal(mongoose.connection.name, DB);
      await mongoose.connection.dropDatabase();
      console.log(`dropped database ${DB}`);
    }
  } catch (e) { console.log("cleanup error:", e.message); }
  try { await mongoose.disconnect(); } catch {}
}
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, async () => { await cleanup(); process.exit(1); });

// Successful admin writes made during the run; each must have written exactly one ModerationAction.
let okWrites = 0;
const counted = (r) => { if (r.status === 200) okWrites += 1; return r; };

try {
  await mongoose.connect(process.env.MONGODB_URL, { dbName: DB, serverSelectionTimeoutMS: 15000 });
  assert.equal(mongoose.connection.name, DB, "refusing to run: wrong database");
  await mongoose.connection.dropDatabase(); // clean slate (name asserted above)

  await new Promise((resolve) => stub.listen(0, "127.0.0.1", resolve));
  STUB = `http://127.0.0.1:${stub.address().port}`;
  await startServer(4131, "");
  await startServer(4132, STUB_KEY);

  const admin = await mkUser({ admin: true, first: "Moderator" });
  const admin2 = await mkUser({ admin: true, first: "Moderator2" });
  const author = await mkUser({ first: "Riya" });
  const helper = await mkUser({ first: "Arjun" });
  const reporters = await Promise.all(Array.from({ length: 8 }, () => mkUser()));
  const [r1, r2, r3, r4, r5, r6, r7, r8] = reporters;

  // ------------------------------------------------------------------ authorization
  const ADMIN_ROUTES = [
    ["GET", "/queue"], ["GET", "/queue/counts"], ["GET", "/items/doubt/000000000000000000000000"],
    ["POST", "/items/doubt/000000000000000000000000/action"], ["GET", "/users/000000000000000000000000"],
    ["POST", "/users/000000000000000000000000/mute"], ["POST", "/users/000000000000000000000000/unmute"], ["GET", "/actions"],
  ];
  await t("auth: no token -> 401 and a student token -> 403 on every admin route", async () => {
    for (const [m, u] of ADMIN_ROUTES) {
      expect(await adm(null, m, u, m === "GET" ? undefined : {}), 401);
      expect(await adm(author.token, m, u, m === "GET" ? undefined : { action: "remove", days: 1, reason: "abc" }), 403, "forbidden");
    }
    const bad = jwt.sign({ id: admin.id, accountType: "Admin" }, process.env.JWT_SECRET, { issuer: "other", audience: "other", expiresIn: "1h" });
    expect(await adm(bad, "GET", "/queue"), 401);
    // A student who claims to be an admin in the token is still a student: the role comes from the database.
    const claim = jwt.sign({ id: author.id, accountType: "Admin" }, process.env.JWT_SECRET, { issuer: "kanthast-school", audience: "kanthast-school", expiresIn: "1h" });
    expect(await adm(claim, "GET", "/queue"), 403, "forbidden");
  });
  await t("auth: the admin token does not open the student class feed or its writes", async () => {
    for (const [m, u] of [["GET", "/feed"], ["GET", "/mine"], ["GET", "/quota"], ["POST", "/"], ["POST", "/report"],
      ["POST", "/000000000000000000000000/replies"], ["POST", "/000000000000000000000000/ai-answer"]]) {
      expect(await api(A, admin.token, m, u, m === "GET" ? undefined : clean()), 403, "admin_account");
    }
  });

  // ------------------------------------------------------------------ queue contents
  let d1;
  await t("queue: empty at first; open count 0", async () => {
    const r = expect(await adm(admin.token, "GET", "/queue"), 200);
    assert.deepEqual(r.body.items, []);
    assert.equal(r.body.nextCursor, null);
    assert.equal(expect(await adm(admin.token, "GET", "/queue/counts"), 200).body.counts.open, 0);
    assert.deepEqual(expect(await adm(admin.token, "GET", "/queue?status=resolved"), 200).body.items, []);
  });
  await t("queue: one report puts a live doubt in the queue; three hide it; still ONE entry with counts, reasons and notes", async () => {
    d1 = expect(await api(A, author.token, "POST", "/", clean("Rude doubt to be reported")), 201).body.doubt.id;
    expect(await report(r1, "doubt", d1, "abuse", "This is rude to Meera"), 201);
    let e = await inQueue(admin, d1);
    assert.ok(e, "in the open queue after one report");
    assert.equal(e.status, "live");
    assert.equal(e.openReports, 1);
    assert.equal(e.autoHidden, false);
    expect(await report(r2, "doubt", d1, "abuse"), 201);
    expect(await report(r3, "doubt", d1, "spam", "Not about studies"), 201);
    assert.equal((await Doubt.findById(d1)).status, "pending");
    const r = expect(await adm(admin.token, "GET", "/queue"), 200);
    const entries = r.body.items.filter((x) => x.id === d1);
    assert.equal(entries.length, 1, "one entry per item, not per report");
    e = entries[0];
    assert.equal(e.type, "doubt");
    assert.equal(e.status, "pending");
    assert.equal(e.autoHidden, true);
    assert.equal(e.openReports, 3);
    assert.equal(e.schoolClass, "8");
    assert.equal(e.subject, "Science");
    assert.match(e.title, /Rude doubt to be reported/);
    assert.deepEqual(e.reasons, [{ reason: "abuse", count: 2 }, { reason: "spam", count: 1 }]);
    assert.deepEqual(e.latestNotes.map((x) => x.note), ["Not about studies", "This is rude to Meera"]);
    assert.deepEqual(e.author, { id: author.id, firstName: "Riya", schoolClass: "8" });
    assert.deepEqual(e.allowedActions, ["approve", "remove"]);
    assert.ok(e.createdAt && e.sortAt && e.lastReportedAt);
    assert.equal(expect(await adm(admin.token, "GET", "/queue/counts"), 200).body.counts.open, 1);
  });

  let doubtR, replyR;
  await t("queue: a reported reply shows its parent doubt's title, class and subject", async () => {
    doubtR = await mkDoubt(author, { subject: "Mathematics", title: `Parent doubt for replies ${RUN}` });
    replyR = await mkReply(doubtR, helper);
    expect(await report(r1, "reply", replyR._id, "wrong_answer", "2 + 2 is not 5"), 201);
    const e = await inQueue(admin, replyR._id, "open", "reply");
    assert.ok(e);
    assert.equal(e.type, "reply");
    assert.deepEqual(e.parent, { id: String(doubtR._id), title: `Parent doubt for replies ${RUN}`, status: "live" });
    assert.equal(e.subject, "Mathematics");
    assert.equal(e.schoolClass, "8");
    assert.equal(e.title, "");
    assert.match(e.excerpt, /Seeded reply/);
    assert.deepEqual(e.author, { id: helper.id, firstName: "Arjun", schoolClass: "8" });
    // type filter
    const onlyDoubts = expect(await adm(admin.token, "GET", "/queue?type=doubt"), 200).body.items;
    assert.ok(onlyDoubts.every((x) => x.type === "doubt") && !onlyDoubts.some((x) => x.id === String(replyR._id)));
  });
  await t("queue: an item held as pending with no reports is in the queue too", async () => {
    const held = await mkDoubt(author, { status: "pending", holdReason: "held" });
    const e = await inQueue(admin, held._id);
    assert.ok(e);
    assert.equal(e.openReports, 0);
    assert.equal(e.status, "pending");
    await Doubt.updateOne({ _id: held._id }, { $set: { status: "removed", holdReason: "deleted_by_author" } }); // out of the way
    assert.equal(await inQueue(admin, held._id), null, "a deleted item without reports is not in the queue");
  });
  await t("queue: newest-reported first, cursor pages with no gaps or repeats", async () => {
    const extra = [];
    for (let i = 0; i < 23; i++) {
      const d = await mkDoubt(author);
      await DoubtReport.create({ reporter: r8.id, targetType: "doubt", target: d._id, schoolClass: "8", reason: "spam", createdAt: new Date(Date.now() - (i + 1) * 60000) });
      extra.push(String(d._id));
    }
    const seen = [];
    let cursor = "";
    let pages = 0;
    do {
      const r = expect(await adm(admin.token, "GET", `/queue${cursor ? `?cursor=${cursor}` : ""}`), 200);
      pages += 1;
      assert.ok(r.body.items.length <= 20);
      seen.push(...r.body.items);
      cursor = r.body.nextCursor || "";
    } while (cursor && pages < 10);
    assert.ok(pages >= 2, "more than one page");
    const ids = seen.map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length, "no repeats");
    for (const id of extra) assert.ok(ids.includes(id), "every item reached");
    const times = seen.map((x) => Date.parse(x.sortAt));
    assert.deepEqual(times, [...times].sort((a, b) => b - a), "newest first");
    assert.equal(expect(await adm(admin.token, "GET", "/queue/counts"), 200).body.counts.open, ids.length);
    // close these 23 so later cases see a small queue
    await DoubtReport.updateMany({ target: { $in: extra } }, { $set: { status: "resolved", resolution: "dismissed" } });
  });
  await t("queue: bad filters and cursors -> 400 invalid", async () => {
    // Repeated keys arrive as arrays: refused, never turned into text.
    for (const q of ["status=closed", "type=post", "status=open&status=resolved", "type=doubt&type=reply", "cursor=abc", "cursor=a&cursor=b",
      "cursor=" + Buffer.from("2026-01-01_zzz").toString("base64url")]) {
      expect(await adm(admin.token, "GET", `/queue?${q}`), 400, "invalid");
    }
    expect(await adm(admin.token, "GET", "/actions?cursor=nope"), 400, "invalid");
  });

  // ------------------------------------------------------------------ item detail
  await t("item: full text, every report (reporter first name only), history; unknown or mismatched -> 404", async () => {
    const r = expect(await adm(admin.token, "GET", `/items/doubt/${d1}`), 200);
    const it = r.body.item;
    assert.equal(it.id, d1);
    assert.equal(it.body, "I read the chapter but am confused.");
    assert.equal(it.reports.length, 3);
    assert.ok(it.reports.every((x) => x.status === "open" && x.reporter?.firstName && Object.keys(x.reporter).sort().join() === "firstName,id"));
    assert.deepEqual(it.actions, []);
    const rr = expect(await adm(admin.token, "GET", `/items/reply/${replyR._id}`), 200).body.item;
    assert.equal(rr.parent.body, "Seeded body text");
    assert.deepEqual(rr.parent.author, { id: author.id, firstName: "Riya", schoolClass: "8" });
    for (const u of [`/items/doubt/${replyR._id}`, `/items/reply/${d1}`, "/items/doubt/ffffffffffffffffffffffff",
      "/items/post/" + d1, "/items/doubt/abc", "/items/doubt/" + encodeURIComponent('{"$ne":null}')]) {
      expect(await adm(admin.token, "GET", u), 404, "not_found");
    }
  });

  // ------------------------------------------------------------------ action validation
  await t("action: bad action, note or id -> 400 / 404, and nothing is written", async () => {
    const before = await ModerationAction.countDocuments();
    for (const body of [{}, { action: "delete" }, { action: ["approve"] }, { action: { $ne: 1 } }, { action: "approve", note: { a: 1 } },
      { action: "approve", note: ["x"] }, { action: "approve", note: 5 }, { action: "approve", note: "x".repeat(501) }]) {
      expect(await adm(admin.token, "POST", `/items/doubt/${d1}/action`, body), 400, "invalid");
    }
    expect(await adm(admin.token, "POST", `/items/doubt/${d1}/action`, undefined, "not json"), 400);
    expect(await act(admin, "doubt", "ffffffffffffffffffffffff", "approve"), 404, "not_found");
    expect(await act(admin, "reply", d1, "approve"), 404, "not_found");
    expect(await act(admin, "user", d1, "approve"), 404, "not_found");
    assert.equal(await ModerationAction.countDocuments(), before);
    assert.equal((await Doubt.findById(d1)).status, "pending");
  });

  // ------------------------------------------------------------------ approve + re-report rule
  await t("approve: a hidden doubt goes live, its reports are dismissed, one audit record; back in the feed", async () => {
    const r = counted(expect(await act(admin, "doubt", d1, "approve", "Not rude, just blunt"), 200));
    assert.equal(r.body.item.status, "live");
    assert.equal(r.body.item.openReports, 0);
    assert.ok(r.body.item.reports.every((x) => x.status === "resolved" && x.resolution === "dismissed"));
    assert.equal(r.body.action.action, "approve");
    assert.equal(r.body.action.beforeStatus, "pending");
    assert.equal(r.body.action.afterStatus, "live");
    assert.equal(r.body.action.reportsResolved, 3);
    assert.equal(r.body.action.note, "Not rude, just blunt");
    assert.equal(await actionsFor(d1), 1);
    const doc = await ModerationAction.findOne({ target: d1 });
    assert.equal(String(doc.admin), admin.id);
    assert.equal(String(doc.targetAuthor), author.id);
    expect(await api(A, r4.token, "GET", `/${d1}`), 200);
    const feed = expect(await api(A, r4.token, "GET", "/feed?subject=Science&limit=30"), 200).body.doubts;
    assert.equal(feed.find((x) => x.id === d1)?.status, "live", "listed in the class feed again");
    assert.equal(await inQueue(admin, d1), null, "left the open queue");
    const res = await inQueue(admin, d1, "resolved");
    assert.ok(res, "now in the resolved list");
    assert.equal(res.totalReports, 3);
  });
  await t("approve: the same reporters cannot hide it again; it needs 3 NEW reports, and one new report re-opens it", async () => {
    expect(await report(r1, "doubt", d1, "abuse"), 200); // already reported: no new report
    expect(await report(r4, "doubt", d1, "abuse"), 201);
    assert.ok(await inQueue(admin, d1), "one new report puts it back in the open queue");
    assert.equal(await inQueue(admin, d1, "resolved"), null);
    expect(await report(r5, "doubt", d1, "abuse"), 201);
    assert.equal((await Doubt.findById(d1)).status, "live", "2 new reports: still live");
    expect(await report(r6, "doubt", d1, "abuse"), 201);
    assert.equal((await Doubt.findById(d1)).status, "pending", "3 new reports hide it again");
    assert.equal((await inQueue(admin, d1)).openReports, 3);
  });
  await t("approve: nothing to approve -> 409 invalid_state, no audit record", async () => {
    const d = await mkDoubt(author);
    expect(await act(admin, "doubt", d._id, "approve"), 409, "invalid_state");
    expect(await act(admin, "doubt", d._id, "restore"), 409, "invalid_state");
    assert.equal(await actionsFor(d._id), 0);
  });

  // ------------------------------------------------------------------ remove / restore a doubt
  await t("remove: a doubt is gone from feed, thread, similar and other students' views; its author sees it as removed in My doubts", async () => {
    const r = counted(expect(await act(admin, "doubt", d1, "remove", "Repeated rudeness"), 200));
    assert.equal(r.body.item.status, "removed");
    assert.ok(r.body.item.reports.filter((x) => x.status === "resolved").every((x) => ["dismissed", "upheld"].includes(x.resolution)));
    assert.equal(r.body.item.reports.filter((x) => x.resolution === "upheld").length, 3, "the 3 open reports upheld");
    assert.equal(r.body.action.reportsResolved, 3);
    assert.deepEqual(r.body.item.allowedActions, ["restore"]);
    expect(await api(A, r7.token, "GET", `/${d1}`), 404, "not_found");
    expect(await api(A, author.token, "GET", `/${d1}`), 404, "not_found");
    assert.ok(!expect(await api(A, r7.token, "GET", "/feed"), 200).body.doubts.some((x) => x.id === d1));
    const sim = expect(await api(A, r7.token, "GET", "/similar?q=" + encodeURIComponent("Rude doubt to be reported")), 200).body.doubts;
    assert.ok(!sim.some((x) => x.id === d1));
    const mine = expect(await api(A, author.token, "GET", "/mine"), 200).body.doubts.find((x) => x.id === d1);
    assert.ok(mine, "the author still sees it");
    assert.equal(mine.status, "removed");
    assert.equal(mine.removedByModerator, true);
    expect(await api(A, r7.token, "POST", `/${d1}/replies`, { body: "Replying to a removed doubt" }), 404);
    expect(await api(A, author.token, "DELETE", `/${d1}`), 404, "not_found");
    expect(await act(admin, "doubt", d1, "remove"), 409, "invalid_state");
  });
  await t("restore: undoes the remove; the doubt is live and in the feed again", async () => {
    const r = counted(expect(await act(admin, "doubt", d1, "restore"), 200));
    assert.equal(r.body.item.status, "live");
    assert.equal(r.body.action.beforeStatus, "removed");
    assert.equal(r.body.action.afterStatus, "live");
    expect(await api(A, r7.token, "GET", `/${d1}`), 200);
    const mine = expect(await api(A, author.token, "GET", "/mine"), 200).body.doubts.find((x) => x.id === d1);
    assert.equal(mine.removedByModerator, false);
    assert.equal(await actionsFor(d1), 3, "approve, remove, restore: three records");
    const hist = expect(await adm(admin.token, "GET", `/items/doubt/${d1}`), 200).body.item.actions;
    assert.deepEqual(hist.map((x) => x.action), ["restore", "remove", "approve"]);
  });
  await t("author deleted a reported doubt: only 'remove' (closes reports) applies; restore is refused", async () => {
    const d = await mkDoubt(author);
    expect(await report(r1, "doubt", d._id, "spam"), 201);
    expect(await api(A, author.token, "DELETE", `/${d._id}`), 200);
    const e = await inQueue(admin, d._id);
    assert.equal(e.status, "deleted_by_author");
    assert.deepEqual(e.allowedActions, ["remove"]);
    expect(await act(admin, "doubt", d._id, "restore"), 409, "invalid_state");
    expect(await act(admin, "doubt", d._id, "approve"), 409, "invalid_state");
    const r = counted(expect(await act(admin, "doubt", d._id, "remove"), 200));
    assert.equal(r.body.item.status, "deleted_by_author");
    assert.equal(r.body.item.reports[0].resolution, "upheld");
    assert.equal(await inQueue(admin, d._id), null);
    const mine = expect(await api(A, author.token, "GET", "/mine"), 200).body.doubts;
    assert.ok(!mine.some((x) => x.id === String(d._id)), "a doubt the author deleted stays out of My doubts");
  });

  // ------------------------------------------------------------------ replies and counters
  await t("remove reply: replyCount drops, the accepted mark is cleared, the reply is hidden for everyone; restore puts the count back", async () => {
    const d = await mkDoubt(author);
    const keep = await mkReply(d, r7);
    const bad = await mkReply(d, helper);
    expect(await api(A, author.token, "POST", `/${d._id}/accept/${bad._id}`), 200);
    assert.equal((await Doubt.findById(d._id)).replyCount, 2);
    const r = counted(expect(await act(admin, "reply", bad._id, "remove", "Copied answer"), 200));
    assert.equal(r.body.item.status, "removed");
    let doc = await Doubt.findById(d._id);
    assert.equal(doc.replyCount, 1);
    assert.equal(doc.acceptedReply, null);
    for (const u of [author, helper, r7]) {
      const th = expect(await api(A, u.token, "GET", `/${d._id}`), 200).body;
      assert.deepEqual(th.replies.map((x) => x.id), [String(keep._id)], "removed reply hidden, even from its author");
    }
    counted(expect(await act(admin, "reply", bad._id, "restore"), 200));
    doc = await Doubt.findById(d._id);
    assert.equal(doc.replyCount, 2);
    assert.equal(doc.acceptedReply, null, "the accepted mark is not given back; the asker can mark it again");
  });
  await t("remove an AI answer: hasAiAnswer clears so the class can ask again; restore sets it back", async () => {
    const d = await mkDoubt(author);
    const ai = await mkReply(d, null);
    assert.equal((await Doubt.findById(d._id)).hasAiAnswer, true);
    counted(expect(await act(admin, "reply", ai._id, "remove"), 200));
    let doc = await Doubt.findById(d._id);
    assert.equal(doc.hasAiAnswer, false);
    assert.equal(doc.replyCount, 0);
    const e = expect(await adm(admin.token, "GET", `/items/reply/${ai._id}`), 200).body.item;
    assert.equal(e.isAI, true);
    assert.equal(e.author, null);
    counted(expect(await act(admin, "reply", ai._id, "restore"), 200));
    doc = await Doubt.findById(d._id);
    assert.equal(doc.hasAiAnswer, true);
    assert.equal(doc.replyCount, 1);
  });
  await t("a reply hidden by reports: approve adds it back to replyCount once; remove of a hidden one does not drop it twice", async () => {
    const d = await mkDoubt(author);
    const a = await mkReply(d, helper);
    const b = await mkReply(d, helper);
    for (const u of [r1, r2, r3]) expect(await report(u, "reply", a._id, "abuse"), 201);
    for (const u of [r1, r2, r3]) expect(await report(u, "reply", b._id, "abuse"), 201);
    assert.equal((await Doubt.findById(d._id)).replyCount, 0, "both hidden by reports");
    counted(expect(await act(admin, "reply", a._id, "approve"), 200));
    assert.equal((await Doubt.findById(d._id)).replyCount, 1);
    counted(expect(await act(admin, "reply", b._id, "remove"), 200));
    assert.equal((await Doubt.findById(d._id)).replyCount, 1, "already off the count while hidden");
    const th = expect(await api(A, r7.token, "GET", `/${d._id}`), 200).body;
    assert.deepEqual(th.replies.map((x) => x.id), [String(a._id)]);
  });

  // ------------------------------------------------------------------ concurrency
  await t("concurrency: 6 admins approve the same hidden doubt at once -> exactly one 200, one record, reports resolved once", async () => {
    const d = await mkDoubt(author);
    for (const u of [r1, r2, r3]) expect(await report(u, "doubt", d._id, "spam"), 201);
    const rs = await Promise.all(Array.from({ length: 6 }, (_, i) => act(i % 2 ? admin2 : admin, "doubt", d._id, "approve")));
    const ok = rs.filter((r) => r.status === 200);
    notes.push(`concurrent approve statuses: ${rs.map((r) => `${r.status}${r.body?.code ? ":" + r.body.code : ""}`).join(",")}`);
    assert.equal(ok.length, 1, rs.map((r) => r.status).join(","));
    okWrites += 1;
    for (const r of rs.filter((x) => x.status !== 200)) assert.ok(r.status === 409 && ["conflict", "invalid_state"].includes(r.body.code), r.text);
    assert.equal(await actionsFor(d._id), 1);
    const reps = await DoubtReport.find({ target: d._id });
    assert.ok(reps.every((x) => x.status === "resolved" && x.resolution === "dismissed"));
    assert.equal(ok[0].body.action.reportsResolved, 3);
  });
  await t("concurrency: approve and remove raced on one item -> one wins; reports all share its resolution", async () => {
    const d = await mkDoubt(author);
    for (const u of [r1, r2, r3]) expect(await report(u, "doubt", d._id, "spam"), 201);
    const rs = await Promise.all([act(admin, "doubt", d._id, "approve"), act(admin2, "doubt", d._id, "remove"), act(admin, "doubt", d._id, "remove"), act(admin2, "doubt", d._id, "approve")]);
    const ok = rs.filter((r) => r.status === 200);
    assert.equal(ok.length, 1, rs.map((r) => r.status).join(","));
    okWrites += 1;
    const won = ok[0].body.action.action;
    const reps = await DoubtReport.find({ target: d._id });
    assert.ok(reps.every((x) => x.status === "resolved" && x.resolution === (won === "approve" ? "dismissed" : "upheld")));
    assert.equal((await Doubt.findById(d._id)).status, won === "approve" ? "live" : "removed");
    assert.equal(await actionsFor(d._id), 1);
  });
  await t("concurrency: 5 removes of one live reply at once -> replyCount drops exactly once", async () => {
    const d = await mkDoubt(author);
    await mkReply(d, r7);
    const x = await mkReply(d, helper);
    const rs = await Promise.all(Array.from({ length: 5 }, () => act(admin, "reply", x._id, "remove")));
    assert.equal(rs.filter((r) => r.status === 200).length, 1);
    okWrites += 1;
    assert.equal((await Doubt.findById(d._id)).replyCount, 1);
    assert.equal(await actionsFor(x._id), 1);
  });
  await t("concurrency: a student's third report and an admin's approve on the same item never both apply", async () => {
    const d = await mkDoubt(author);
    const rep = await mkReply(d, helper);
    for (const u of [r1, r2]) expect(await report(u, "reply", rep._id, "spam"), 201);
    const [rr, ar] = await Promise.all([report(r3, "reply", rep._id, "spam"), act(admin, "reply", rep._id, "approve")]);
    if (ar.status === 200) okWrites += 1;
    const doc = await DoubtReply.findById(rep._id);
    const parent = await Doubt.findById(d._id);
    notes.push(`report vs approve race: report ${rr.status}, approve ${ar.status}${ar.body?.code ? " " + ar.body.code : ""}, reply now ${doc.status}`);
    assert.equal(parent.replyCount, doc.status === "live" ? 1 : 0, "replyCount matches the reply's final status");
  });

  // ------------------------------------------------------------------ mute
  const muted = await mkUser({ first: "Kabir" });
  const target = await mkDoubt(helper);
  await t("mute: bad duration, reason or user -> 400 / 404; an admin can't be muted (403); nothing written", async () => {
    const before = await ModerationAction.countDocuments();
    for (const body of [{ days: "7", reason: "spam" }, { days: 2, reason: "spam" }, { days: [7], reason: "spam" }, { days: { $gt: 0 }, reason: "spam" },
      { reason: "spam" }, { days: 7 }, { days: 7, reason: "ab" }, { days: 7, reason: { a: "spamming" } }, { days: 7, reason: ["spamming"] },
      { days: 7, reason: "x".repeat(301) }, { days: "Permanent", reason: "spam" }]) {
      expect(await adm(admin.token, "POST", `/users/${muted.id}/mute`, body), 400, "invalid");
    }
    expect(await adm(admin.token, "POST", "/users/ffffffffffffffffffffffff/mute", { days: 7, reason: "spam" }), 404, "not_found");
    expect(await adm(admin.token, "POST", "/users/abc/mute", { days: 7, reason: "spam" }), 404, "not_found");
    expect(await adm(admin.token, "POST", `/users/${admin2.id}/mute`, { days: 7, reason: "spam" }), 403, "cannot_mute_admin");
    expect(await adm(admin.token, "POST", `/users/${admin.id}/mute`, { days: 1, reason: "self" }), 403, "cannot_mute_admin");
    expect(await adm(admin.token, "POST", `/users/${muted.id}/unmute`), 409, "not_muted");
    assert.equal(await ModerationAction.countDocuments(), before);
  });
  await t("mute 7 days: posting, replying and asking for an AI answer -> 403 muted with mutedUntil", async () => {
    const t0 = Date.now();
    const r = counted(expect(await adm(admin.token, "POST", `/users/${muted.id}/mute`, { days: 7, reason: "Spamming the feed" }), 200));
    assert.equal(r.body.mute.muted, true);
    assert.equal(r.body.mute.permanent, false);
    const until = Date.parse(r.body.mute.mutedUntil);
    assert.ok(Math.abs(until - (t0 + 7 * 864e5)) < 60000, "about 7 days from now");
    assert.equal(r.body.action.action, "mute");
    assert.equal(r.body.action.muteDays, 7);
    assert.equal(r.body.action.beforeStatus, "active");
    for (const [base, m, u, body] of [[A, "POST", "/", clean()], [A, "POST", `/${target._id}/replies`, { body: "My reply here" }],
      [B, "POST", `/${target._id}/ai-answer`, {}]]) {
      const res = expect(await api(base, muted.token, m, u, body), 403, "muted");
      assert.equal(res.body.mutedUntil, r.body.mute.mutedUntil);
      assert.equal(res.body.permanent, false);
      assert.match(res.body.message, /^You can't post until \d{1,2} [A-Z][a-z]{2}\.$/);
    }
    assert.equal(await Doubt.countDocuments({ author: muted.id }), 0);
    assert.equal(await DoubtReply.countDocuments({ author: muted.id }), 0);
    assert.equal((await Doubt.findById(target._id)).hasAiAnswer, false, "no AI answer claimed");
  });
  await t("mute: a muted student can still read, report, mark helpful, see the mute in /quota and use Ask AI", async () => {
    expect(await api(A, muted.token, "GET", "/feed"), 200);
    expect(await api(A, muted.token, "GET", `/${target._id}`), 200);
    expect(await api(A, muted.token, "GET", "/mine"), 200);
    const q = expect(await api(A, muted.token, "GET", "/quota"), 200).body;
    assert.equal(q.mute.muted, true);
    assert.ok(q.mute.mutedUntil);
    assert.equal(q.mute.reason, undefined, "the moderator's reason is not shown to the student");
    expect(await api(A, muted.token, "POST", `/${target._id}/helpful`), 200);
    expect(await report(muted, "doubt", target._id, "other"), 201);
    expect(await call(B, muted.token, "POST", "/api/v1/chat/send", { message: "How do I solve 2x + 3 = 7?" }), 200);
    expect(await api(B, muted.token, "GET", "/ai-quota"), 200);
    // An unmuted student's quota says so.
    assert.equal(expect(await api(A, r7.token, "GET", "/quota"), 200).body.mute.muted, false);
  });
  await t("mute: a chat save during a mute does not undo it (the mute has no schema default to write back)", async () => {
    // The chat controller saves the whole user after the AI call. Mute after a chat, then chat again.
    expect(await call(B, muted.token, "POST", "/api/v1/chat/send", { message: "One more question about fractions" }), 200);
    expect(await api(A, muted.token, "POST", "/", clean()), 403, "muted");
  });
  await t("mute expiry: checked at request time, no job; once the end passes the student can post, and unmute is 409", async () => {
    await User.updateOne({ _id: muted.id }, { $set: { "doubtsMute.until": new Date(Date.now() - 1000) } });
    expect(await api(A, muted.token, "POST", "/", clean()), 201);
    assert.equal(expect(await api(A, muted.token, "GET", "/quota"), 200).body.mute.muted, false);
    expect(await adm(admin.token, "POST", `/users/${muted.id}/unmute`), 409, "not_muted");
  });
  await t("permanent mute, then unmute: blocked with no end date, then free to post again", async () => {
    const r = counted(expect(await adm(admin.token, "POST", `/users/${muted.id}/mute`, { days: "permanent", reason: "Repeated abuse" }), 200));
    assert.equal(r.body.mute.permanent, true);
    assert.equal(r.body.mute.mutedUntil, null);
    const res = expect(await api(A, muted.token, "POST", `/${target._id}/replies`, { body: "Trying to reply" }), 403, "muted");
    assert.equal(res.body.mutedUntil, null);
    assert.equal(res.body.permanent, true);
    assert.equal(res.body.message, "Posting is turned off for your account.");
    const u = counted(expect(await adm(admin.token, "POST", `/users/${muted.id}/unmute`, { note: "Spoke to the parent" }), 200));
    assert.equal(u.body.mute.muted, false);
    assert.equal(u.body.action.beforeStatus, "muted");
    assert.equal(u.body.action.afterStatus, "active");
    expect(await api(A, muted.token, "POST", `/${target._id}/replies`, { body: "Now I can reply" }), 201);
    expect(await adm(admin.token, "POST", `/users/${muted.id}/unmute`), 409, "not_muted");
  });
  await t("mute: muting again replaces the mute (1 day -> 30 days); 4 admins muting at once -> exactly one applies", async () => {
    counted(expect(await adm(admin.token, "POST", `/users/${muted.id}/mute`, { days: 1, reason: "First warning" }), 200));
    const r = counted(expect(await adm(admin.token, "POST", `/users/${muted.id}/mute`, { days: 30, reason: "Second warning" }), 200));
    assert.equal(r.body.action.beforeStatus, "muted");
    assert.ok(Date.parse(r.body.mute.mutedUntil) > Date.now() + 29 * 864e5);
    counted(expect(await adm(admin.token, "POST", `/users/${muted.id}/unmute`), 200));
    const other = await mkUser();
    const before = await ModerationAction.countDocuments({ target: other.id });
    const rs = await Promise.all([1, 7, 30, "permanent"].map((days, i) => adm(i % 2 ? admin2.token : admin.token, "POST", `/users/${other.id}/mute`, { days, reason: "Concurrent mute" })));
    const ok = rs.filter((x) => x.status === 200);
    notes.push(`concurrent mute statuses: ${rs.map((x) => `${x.status}${x.body?.code ? ":" + x.body.code : ""}`).join(",")}`);
    assert.equal(ok.length, 1);
    okWrites += 1;
    for (const x of rs.filter((y) => y.status !== 200)) expect(x, 409, "conflict");
    assert.equal(await ModerationAction.countDocuments({ target: other.id }), before + 1);
  });

  // ------------------------------------------------------------------ user summary
  await t("user summary: counts, removed count, reports against them, mute state and past actions; first name, class and id only", async () => {
    const r = expect(await adm(admin.token, "GET", `/users/${helper.id}`), 200).body;
    assert.deepEqual(r.user, { id: helper.id, firstName: "Arjun", schoolClass: "8", role: "student" });
    assert.ok(r.replies.total >= 6, JSON.stringify(r.replies));
    assert.ok(r.replies.removed >= 2, JSON.stringify(r.replies));
    assert.equal(r.removedCount, r.doubts.removed + r.replies.removed);
    assert.ok(r.reports.total >= 7 && r.reports.upheld >= 3, JSON.stringify(r.reports));
    assert.equal(r.mute.muted, false);
    assert.ok(r.actions.length >= 3 && r.actions.every((a) => a.targetAuthor?.id === helper.id));
    const m = expect(await adm(admin.token, "GET", `/users/${muted.id}`), 200).body;
    assert.ok(m.actions.some((a) => a.action === "mute") && m.actions.some((a) => a.action === "unmute"));
    expect(await adm(admin.token, "GET", "/users/abc"), 404, "not_found");
    expect(await adm(admin.token, "GET", "/users/ffffffffffffffffffffffff"), 404, "not_found");
    const muteNow = counted(expect(await adm(admin.token, "POST", `/users/${helper.id}/mute`, { days: 1, reason: "Cool off" }), 200));
    const s = expect(await adm(admin.token, "GET", `/users/${helper.id}`), 200).body;
    assert.equal(s.mute.muted, true);
    assert.equal(s.mute.reason, "Cool off");
    assert.equal(s.mute.mutedBy.firstName, "Moderator");
    assert.equal(s.mute.mutedUntil, muteNow.body.mute.mutedUntil);
    counted(expect(await adm(admin.token, "POST", `/users/${helper.id}/unmute`), 200));
  });

  // ------------------------------------------------------------------ audit log
  await t("audit: every successful action wrote exactly one record; the log pages newest first", async () => {
    const total = await ModerationAction.countDocuments();
    assert.equal(total, okWrites, `records ${total}, successful writes ${okWrites}`);
    const seen = [];
    let cursor = "";
    let pages = 0;
    do {
      const r = expect(await adm(admin.token, "GET", `/actions${cursor ? `?cursor=${cursor}` : ""}`), 200);
      pages += 1;
      seen.push(...r.body.actions);
      cursor = r.body.nextCursor || "";
    } while (cursor && pages < 10);
    assert.equal(seen.length, total);
    assert.equal(new Set(seen.map((a) => a.id)).size, total);
    const times = seen.map((a) => Date.parse(a.createdAt));
    assert.deepEqual(times, [...times].sort((a, b) => b - a));
    notes.push(`audit: ${total} records over ${pages} page(s)`);
    // Enough records for several pages (inserting is appending), then walk them again.
    const base = Date.now() - 864e5;
    await ModerationAction.insertMany(Array.from({ length: 45 }, (_, i) => ({ admin: admin.id, action: "approve", targetType: "doubt",
      target: new mongoose.Types.ObjectId(), createdAt: new Date(base - Math.floor(i / 3) * 1000) }))); // 3 share each second
    const all = [];
    cursor = "";
    pages = 0;
    do {
      const r = expect(await adm(admin.token, "GET", `/actions${cursor ? `?cursor=${cursor}` : ""}`), 200);
      pages += 1;
      assert.ok(r.body.actions.length <= 30);
      all.push(...r.body.actions);
      cursor = r.body.nextCursor || "";
    } while (cursor && pages < 10);
    assert.equal(all.length, total + 45);
    assert.equal(new Set(all.map((x) => x.id)).size, total + 45, "no repeats across pages, ties included");
    assert.ok(pages >= 3);
    const a = seen.find((x) => x.action === "remove" && x.targetType === "doubt");
    assert.ok(a.admin.firstName && a.targetLabel && a.beforeStatus && a.afterStatus);
  });
  await t("audit: append-only: no route changes or deletes a record, and the model refuses it too", async () => {
    const one = await ModerationAction.findOne();
    for (const m of ["PUT", "PATCH", "DELETE"]) {
      for (const u of [`/actions/${one._id}`, "/actions"]) {
        const r = await adm(admin.token, m, u, {});
        assert.equal(r.status, 404, `${m} ${u} -> ${r.status}`);
      }
    }
    await assert.rejects(() => ModerationAction.updateOne({ _id: one._id }, { $set: { note: "edited" } }), /append-only/);
    await assert.rejects(() => ModerationAction.deleteOne({ _id: one._id }), /append-only/);
    await assert.rejects(() => ModerationAction.findOneAndUpdate({ _id: one._id }, { $set: { note: "x" } }), /append-only/);
    assert.equal((await ModerationAction.findById(one._id)).note, one.note);
  });

  // ------------------------------------------------------------------ privacy
  await t("privacy: no email, last name, phone, image, password, account type or parent details in any response", async () => {
    if (leaks.length) throw new Error(`${leaks.length} leaking responses, first: ${leaks[0]}`);
  });
} catch (e) {
  console.error("FATAL:", e.stack || e.message);
  results.push({ name: "harness", ok: false, err: String(e.message) });
} finally {
  await cleanup();
}

console.log("\n=== NOTES ===");
for (const x of notes) console.log(" -", x);
const failed = results.filter((r) => !r.ok);
const skipped = results.filter((r) => r.skip).length;
console.log(`\n${results.length - failed.length - skipped}/${results.length} passed, ${skipped} skipped, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
