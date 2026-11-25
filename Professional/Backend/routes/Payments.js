import express from "express";

// Payments are disabled on purpose. The old capture/verify flow was built around a courseId from an
// earlier course model and is not wired to plans or to server-side entitlements. Every route answers 503,
// whatever keys are configured, so no order can be created and no plan can be granted by calling the API.
// Rebuild around plans (create order, verify signature, grant entitlement) before re-enabling; see PAYMENTS_OPEN.
const router = express.Router();

router.all("/*splat", (_req, res) =>
  res.status(503).json({ success: false, message: "Payments are not open yet. Nothing can be charged." })
);

export default router;
