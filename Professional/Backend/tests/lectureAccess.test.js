import test from "node:test";
import assert from "node:assert/strict";
import { lectureDecision, publicLibrary } from "../services/lectureAccess.js";

const future = new Date(Date.now() + 86_400_000).toISOString();
const past = new Date(Date.now() - 86_400_000).toISOString();
const withPayments = (fn) => {
  process.env.PAYMENTS_OPEN = "true";
  process.env.LECTURES_LIVE = "true";
  try {
    return fn();
  } finally {
    delete process.env.PAYMENTS_OPEN;
    delete process.env.LECTURES_LIVE;
  }
};
const whenLive = (fn) => {
  process.env.LECTURES_LIVE = "true";
  try {
    return fn();
  } finally {
    delete process.env.LECTURES_LIVE;
  }
};

test("signed out visitors are always turned away", () => {
  assert.equal(lectureDecision(null, 0).allowed, false);
  assert.equal(withPayments(() => lectureDecision(null, 0)).reason, "login");
});

test("until payments open, any signed in student can open any lecture", () => {
  delete process.env.PAYMENTS_OPEN;
  assert.deepEqual(whenLive(() => lectureDecision({ subscriptionPurchased: false }, 9)), { allowed: true, reason: "free-until-payments-open" });
});

test("while lectures are not released, nothing is playable and the library says coming soon", () => {
  delete process.env.LECTURES_LIVE;
  assert.deepEqual(lectureDecision({ subscriptionPurchased: false }, 0), { allowed: false, reason: "coming_soon" });
  const library = publicLibrary({ subjects: [{ chapters: [{ videos: [{ _id: "v1", videoLink: "https://www.youtube.com/watch?v=abcdefghijk" }] }] }] });
  assert.equal(library.subjects[0].chapters[0].videos[0].videoLink, "");
});

test("once payments are open: two free lectures per chapter, then a plan is needed", () => {
  const free = { subscriptionPurchased: false };
  assert.equal(withPayments(() => lectureDecision(free, 0)).allowed, true);
  assert.equal(withPayments(() => lectureDecision(free, 1)).allowed, true);
  assert.equal(withPayments(() => lectureDecision(free, 2)).allowed, false);
  assert.equal(withPayments(() => lectureDecision({ subscriptionPurchased: true, subscriptionValidTill: future }, 5)).allowed, true);
  assert.equal(withPayments(() => lectureDecision({ subscriptionPurchased: true, subscriptionValidTill: past }, 5)).allowed, false, "expired plan");
});

test("the public library never contains a real video link or image link", () => {
  process.env.LECTURES_LIVE = "true";
  const library = publicLibrary({
    courseTitle: "X",
    subjects: [{ name: "S", chapters: [{ name: "C", videos: [
      { _id: "v1", name: "With video", videoLink: "https://www.youtube.com/watch?v=abcdefghijk", photos: [{ imageLink: "https://img.example/a.png" }] },
      { _id: "v2", name: "No video", videoLink: "  ", photos: [] },
    ] }] }],
  });
  const [withVideo, without] = library.subjects[0].chapters[0].videos;
  assert.equal(withVideo.videoLink, "secure:v1");
  assert.deepEqual(withVideo.photos, []);
  assert.equal(without.videoLink, "");
  assert.doesNotMatch(JSON.stringify(library), /youtube|img\.example/);
  delete process.env.LECTURES_LIVE;
});
