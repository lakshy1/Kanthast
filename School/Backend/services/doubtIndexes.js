// Makes sure the Doubts indexes exist before requests rely on them.
//
// Mongoose builds indexes in the background once it connects. On a fresh database the first
// requests can arrive before that finishes: GET /similar then fails with "text index required
// for $text query", and two first-ever reservations for one user could both insert a usage
// record because the unique (user, day) index is not there yet. Serverless cold starts make
// this likely, so requests wait for the build here (once per server copy; later requests
// get an already settled promise).
import Doubt from "../models/Doubt.js";
import DoubtReply from "../models/DoubtReply.js";
import DoubtReaction from "../models/DoubtReaction.js";
import DoubtReport from "../models/DoubtReport.js";
import DailyUsage from "../models/DailyUsage.js";
import ParentConsent from "../models/ParentConsent.js";
import ModerationAction from "../models/ModerationAction.js";

const MODELS = [Doubt, DoubtReply, DoubtReaction, DoubtReport, DailyUsage, ParentConsent, ModerationAction];
// Never hold a request longer than this; handlers cope with a missing index.
const MAX_WAIT_MS = 8000;

let ready = null;
let settled = false;
let failedBefore = false;

/**
 * Resolves to true once the indexes exist, false if building them failed (it is tried again
 * on a later request). rebuild: true builds them again, for when they vanished under a
 * running server (a database reset).
 */
export function doubtIndexesReady({ rebuild = false } = {}) {
  // Several requests may ask for a rebuild at once: one build in flight is enough.
  if (!ready || (rebuild && settled)) {
    // The first time, join the build Mongoose already started. Model.init() keeps its first
    // result, so a retry after a failure has to call createIndexes() itself.
    const build = rebuild || failedBefore ? (model) => model.createIndexes() : (model) => model.init();
    settled = false;
    ready = Promise.all(MODELS.map(build))
      .then(() => true)
      .catch((error) => {
        console.error("[doubts:indexes]", error?.message || error);
        failedBefore = true;
        ready = null;
        return false;
      })
      .finally(() => {
        settled = true;
      });
  }
  return ready;
}

/** Waits for the indexes, but never longer than MAX_WAIT_MS. */
export async function awaitDoubtIndexes() {
  let timer;
  await Promise.race([
    doubtIndexesReady(),
    new Promise((resolve) => {
      timer = setTimeout(resolve, MAX_WAIT_MS);
    }),
  ]);
  clearTimeout(timer);
}

/** Route middleware: wait (briefly) for the indexes, then carry on either way. */
export const waitForDoubtIndexes = async (req, res, next) => {
  await awaitDoubtIndexes();
  next();
};

/** True for the error MongoDB gives when a $text query finds no text index. */
export const isMissingTextIndex = (error) =>
  error?.code === 27 || /text index required/i.test(String(error?.message || ""));
