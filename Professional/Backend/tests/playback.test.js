import test from "node:test";
import assert from "node:assert/strict";
import { lectureKey, lectureIv } from "../utils/videoKeys.js";
import { rewriteMediaPlaylist } from "../services/playlist.js";
import { parseLectureId } from "../services/lectureLocator.js";
import {
  askedForKeyTooOften, isCurrentStream, startedTooMany, streamIdFrom, streamTag,
  MAX_LESSONS_PER_HOUR, MAX_LESSONS_PER_DAY, MAX_KEY_FETCHES_PER_STREAM,
} from "../services/streams.js";

const SECRET = "x".repeat(48);
const ID = "64b7f0c2a1b2c3d4e5f60718";

test("lecture ids must be 24 hex characters; anything else is rejected", () => {
  assert.deepEqual(parseLectureId(ID), { id: ID });
  assert.equal(parseLectureId(ID.toUpperCase()).id, ID);
  for (const bad of ["", null, "abc", `${ID}/../x`, "../" + ID, "g".repeat(24), ID + "0"]) assert.equal(parseLectureId(bad), null, String(bad));
});

test("keys are 16 bytes, differ per lecture and per secret, and need a long secret", () => {
  const a = lectureKey(SECRET, ID);
  assert.equal(a.length, 16);
  assert.notDeepEqual(a, lectureKey(SECRET, "64b7f0c2a1b2c3d4e5f60719"));
  assert.notDeepEqual(a, lectureKey("y".repeat(48), ID));
  assert.notDeepEqual(a, lectureIv(SECRET, ID));
  assert.throws(() => lectureKey("short", ID));
});

test("playlists get signed segment links and a key link back to this server", () => {
  const text = "#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI=\"KEY_URI_PLACEHOLDER\"\n#EXTINF:4,\nseg_0000.ts\n";
  const out = rewriteMediaPlaylist(text, (name) => `https://signed.example/${name}?sig=1`);
  assert.match(out, /URI="\.\.\/key"/);
  assert.match(out, /https:\/\/signed\.example\/seg_0000\.ts\?sig=1/);
  assert.doesNotMatch(out, /KEY_URI_PLACEHOLDER/);
});

test("one stream per account: only the current stream id is accepted", () => {
  const id = "a1b2c3d4-e5f6-4789-aabb-ccddeeff0011";
  assert.equal(streamIdFrom(id), id);
  assert.equal(streamIdFrom("nope"), null);
  assert.equal(isCurrentStream({ streamId: id }, id), true);
  assert.equal(isCurrentStream({ streamId: id }, "b1b2c3d4-e5f6-4789-aabb-ccddeeff0011"), false);
  assert.equal(isCurrentStream(null, id), false);
});

test("bulk starting lectures and over asking for the key are refused", () => {
  assert.equal(startedTooMany({ lastHour: 8, lastDay: 20 }), false);
  assert.equal(startedTooMany({ lastHour: MAX_LESSONS_PER_HOUR + 1, lastDay: 30 }), true);
  assert.equal(startedTooMany({ lastHour: 3, lastDay: MAX_LESSONS_PER_DAY + 1 }), true);
  assert.equal(askedForKeyTooOften(MAX_KEY_FETCHES_PER_STREAM), false);
  assert.equal(askedForKeyTooOften(MAX_KEY_FETCHES_PER_STREAM + 1), true);
  assert.equal(streamTag("a1b2c3d4-e5f6-4789-aabb-ccddeeff0011"), "A1B2");
});
