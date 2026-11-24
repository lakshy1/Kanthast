import test from "node:test";
import assert from "node:assert/strict";
import { rateLimit } from "../middleware/RateLimit.js";
import { purchaseSubscription } from "../controllers/Profile.js";
import { resetPassword } from "../controllers/ResetPassword.js";

const makeRes = () => {
  const res = { statusCode: 200, headers: {}, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  res.set = (k, v) => ((res.headers[k] = v), res);
  return res;
};

test("rate limiter lets requests through, then returns 429 with Retry-After", () => {
  const limiter = rateLimit({ name: "t1", windowMs: 60_000, max: 3 });
  const req = { ip: "1.2.3.4" };
  let passed = 0;
  for (let i = 0; i < 3; i++) limiter(req, makeRes(), () => passed++);
  assert.equal(passed, 3);

  const res = makeRes();
  let called = false;
  limiter(req, res, () => (called = true));
  assert.equal(called, false);
  assert.equal(res.statusCode, 429);
  assert.ok(Number(res.headers["Retry-After"]) >= 1);
});

test("rate limits are tracked per client, not shared", () => {
  const limiter = rateLimit({ name: "t2", windowMs: 60_000, max: 1 });
  limiter({ ip: "a" }, makeRes(), () => {});
  let other = false;
  limiter({ ip: "b" }, makeRes(), () => (other = true));
  assert.equal(other, true);
});

test("a client cannot give itself a subscription by faking a payment", async () => {
  const res = makeRes();
  await purchaseSubscription(
    { user: { id: "someone" }, body: { planDurationYears: 1, schoolClass: "X", dummyPaymentStatus: "success", dummyPaymentId: "FAKE_1" } },
    res
  );
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.success, false);
});

test("password reset rejects malformed tokens and weak passwords before touching the database", async () => {
  for (const token of [undefined, { $ne: null }, "short", "z".repeat(64)]) {
    const res = makeRes();
    await resetPassword({ body: { token, newPassword: "longenough1" } }, res);
    assert.equal(res.statusCode, 400);
  }
  const res = makeRes();
  await resetPassword({ body: { token: "a".repeat(64), newPassword: "short" } }, res);
  assert.equal(res.statusCode, 400);
});
