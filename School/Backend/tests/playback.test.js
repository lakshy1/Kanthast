import test from "node:test";
import assert from "node:assert/strict";
import { parseLessonId, playbackDecision as decide } from "../services/lessonAccess.js";

// Most rules below are about the paid launch, so they run with payments open.
const playbackDecision = (...args) => {
  process.env.PAYMENTS_OPEN = "true";
  try {
    return decide(...args);
  } finally {
    delete process.env.PAYMENTS_OPEN;
  }
};
import { rewriteMediaPlaylist } from "../services/playlist.js";
import { askedForKeyTooOften, startedTooMany, streamTag, MAX_LESSONS_PER_HOUR, MAX_LESSONS_PER_DAY, MAX_KEY_FETCHES_PER_STREAM } from "../services/streams.js";
import { lessonKey, lessonIv } from "../utils/videoKeys.js";

const SECRET = "x".repeat(48);
const future = new Date(Date.now() + 86_400_000).toISOString();
const past = new Date(Date.now() - 86_400_000).toISOString();

test("lesson ids parse, and junk is rejected", () => {
  assert.deepEqual(parseLessonId("c10-science-ch01-t03"), { id: "c10-science-ch01-t03", classNo: 10, subject: "science", chapter: 1, topic: 3 });
  assert.equal(parseLessonId("c8-information-technology-ch02-t05").subject, "information-technology");
  for (const bad of ["", null, "c7-science-ch01-t01", "c8-science-ch1-t1", "../c8-science-ch01-t01", "c8-science-ch01-t01/../x"]) {
    assert.equal(parseLessonId(bad), null, String(bad));
  }
});

test("signed out visitors can never play anything", () => {
  assert.equal(playbackDecision(null, parseLessonId("c8-science-ch01-t01")).allowed, false);
  assert.equal(playbackDecision(null, parseLessonId("c8-science-ch01-t01")).reason, "login");
});

test("the first two topics of every chapter are free for any signed in student", () => {
  const free = { subscriptionPurchased: false };
  assert.equal(playbackDecision(free, parseLessonId("c9-science-ch01-t01")).allowed, true);
  assert.equal(playbackDecision(free, parseLessonId("c9-science-ch07-t02")).allowed, true);
  assert.equal(playbackDecision(free, parseLessonId("c9-science-ch01-t03")).allowed, false);
});

test("later topics need an active plan for the same class", () => {
  const lesson = parseLessonId("c9-mathematics-ch01-t04");
  assert.equal(playbackDecision({ subscriptionPurchased: true, subscriptionValidTill: future, schoolClass: "9" }, lesson).allowed, true);
  assert.equal(playbackDecision({ subscriptionPurchased: true, subscriptionValidTill: future, schoolClass: "8" }, lesson).allowed, false, "wrong class");
  assert.equal(playbackDecision({ subscriptionPurchased: true, subscriptionValidTill: past, schoolClass: "9" }, lesson).allowed, false, "expired plan");
  assert.equal(playbackDecision({ subscriptionPurchased: false, schoolClass: "9" }, lesson).allowed, false, "no plan");
});

test("segments become signed links and the key link points back at the server", () => {
  const playlist = ["#EXTM3U", '#EXT-X-KEY:METHOD=AES-128,URI="KEY_URI_PLACEHOLDER",IV=0xab', "#EXTINF:4.0,", "seg_0000.ts", "#EXTINF:4.0,", "seg_0001.ts", "#EXT-X-ENDLIST", ""].join("\n");
  const out = rewriteMediaPlaylist(playlist, (name) => `https://store.example/${name}?sig=1`);
  assert.match(out, /URI="\.\.\/key"/);
  assert.doesNotMatch(out, /KEY_URI_PLACEHOLDER/);
  assert.match(out, /https:\/\/store\.example\/seg_0000\.ts\?sig=1/);
  assert.match(out, /#EXT-X-ENDLIST/);
});

test("keys are stable per lesson, differ between lessons and secrets, and are 16 bytes", () => {
  const a = lessonKey(SECRET, "c8-science-ch01-t01");
  assert.equal(a.length, 16);
  assert.deepEqual(a, lessonKey(SECRET, "c8-science-ch01-t01"));
  assert.notDeepEqual(a, lessonKey(SECRET, "c8-science-ch01-t02"));
  assert.notDeepEqual(a, lessonKey("y".repeat(48), "c8-science-ch01-t01"));
  assert.notDeepEqual(a, lessonIv(SECRET, "c8-science-ch01-t01"));
  assert.throws(() => lessonKey("short", "c8-science-ch01-t01"));
});

test("until payments open, every signed in student can watch every lesson, and signed out visitors still cannot", () => {
  delete process.env.PAYMENTS_OPEN;
  const lesson = parseLessonId("c10-science-ch05-t07");
  assert.deepEqual(decide({ subscriptionPurchased: false, schoolClass: "8" }, lesson), { allowed: true, reason: "free-until-payments-open" });
  assert.equal(decide(null, lesson).allowed, false);
});

import { clampSeconds, isCurrentStream, streamIdFrom } from "../services/streams.js";
import { normalizeWaitlist } from "../services/waitlist.js";

test("only the account's current stream may keep playing", () => {
  const current = { streamId: "11111111-2222-3333-4444-555555555555" };
  assert.equal(isCurrentStream(current, "11111111-2222-3333-4444-555555555555"), true);
  assert.equal(isCurrentStream(current, "99999999-2222-3333-4444-555555555555"), false, "a second device");
  assert.equal(isCurrentStream(null, "11111111-2222-3333-4444-555555555555"), false);
  assert.equal(isCurrentStream(current, null), false);
});

test("stream ids and watched seconds are validated", () => {
  assert.equal(streamIdFrom("11111111-2222-3333-4444-555555555555"), "11111111-2222-3333-4444-555555555555");
  for (const bad of [undefined, "", "short", "../../etc/passwd", "x".repeat(40)]) assert.equal(streamIdFrom(bad), null, String(bad));
  assert.equal(clampSeconds(125.9), 125);
  assert.equal(clampSeconds(-5), 0);
  assert.equal(clampSeconds("abc"), 0);
  assert.equal(clampSeconds(10 ** 9), 86_400);
});

test("waitlist emails are cleaned and bad ones rejected", () => {
  assert.deepEqual(normalizeWaitlist({ email: "  Asha@Example.COM ", interest: "school" }), { ok: true, value: { email: "asha@example.com", interest: "school", source: "kanthast-home" } });
  assert.equal(normalizeWaitlist({ email: "a@b.co", interest: "nonsense" }).value.interest, "both");
  for (const bad of [{}, { email: "" }, { email: "no-at-sign" }, { email: "a@b" }, { email: 123 }, { email: "a@" + "b".repeat(260) + ".com" }]) {
    assert.equal(normalizeWaitlist(bad).ok, false, JSON.stringify(bad).slice(0, 40));
  }
});

test("bulk starting lessons is refused, normal use is not", () => {
  assert.equal(startedTooMany({ lastHour: 12, lastDay: 30 }), false);
  assert.equal(startedTooMany({ lastHour: MAX_LESSONS_PER_HOUR, lastDay: 40 }), false);
  assert.equal(startedTooMany({ lastHour: MAX_LESSONS_PER_HOUR + 1, lastDay: 41 }), true);
  assert.equal(startedTooMany({ lastHour: 5, lastDay: MAX_LESSONS_PER_DAY + 1 }), true);
});

test("a stream that keeps asking for the key is refused", () => {
  assert.equal(askedForKeyTooOften(3), false);
  assert.equal(askedForKeyTooOften(MAX_KEY_FETCHES_PER_STREAM), false);
  assert.equal(askedForKeyTooOften(MAX_KEY_FETCHES_PER_STREAM + 1), true);
});

test("the watermark session tag comes from the stream id and is short", () => {
  assert.equal(streamTag("a1b2c3d4-e5f6-4789-aabb-ccddeeff0011"), "A1B2");
  assert.equal(streamTag(""), "");
  assert.equal(streamTag(null), "");
});
