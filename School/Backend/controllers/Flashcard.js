// controllers/Flashcard.js — Flashcard Studio Controller with SuperMemo SM-2 Spaced Repetition
import Flashcard from "../models/Flashcard.js";
import FlashcardSession from "../models/FlashcardSession.js";
import FlashcardProgress from "../models/FlashcardProgress.js";
import { CLASS_10_FLASHCARDS } from "../data/class10FlashcardSeed.js";

// Helper: standard error response
const fail = (res, status, message, extra = {}) =>
  res.status(status).json({ success: false, message, ...extra });

// Ensure seed cards are synced safely without duplicates
let flashcardSeedPromise = null;
export async function ensureSeedFlashcards() {
  if (flashcardSeedPromise) return flashcardSeedPromise;

  flashcardSeedPromise = (async () => {
    try {
      const existing = await Flashcard.find({ schoolClass: "10" }).select("front").lean();
      const seen = new Set(existing.map((c) => String(c.front || "").trim().toLowerCase()));
      const missing = (CLASS_10_FLASHCARDS || []).filter(
        (c) => !seen.has(String(c.front || "").trim().toLowerCase())
      );
      if (missing.length > 0) {
        await Flashcard.insertMany(missing);
        console.log(`Auto-synced ${missing.length} Class X Flashcards`);
      }
    } catch (err) {
      console.error("Auto-seed error in Flashcard controller:", err);
    } finally {
      flashcardSeedPromise = null;
    }
  })();

  return flashcardSeedPromise;
}

// ── GET /api/v1/flashcards/subjects?class=10 ─────────────────────────────────
export const getSubjects = async (req, res) => {
  let { class: schoolClass = "10" } = req.query;
  await ensureSeedFlashcards();

  if (schoolClass !== "10") {
    schoolClass = "10";
  }

  try {
    const subjects = await Flashcard.distinct("subject", {
      schoolClass,
      isPublished: true,
    });

    const counts = await Promise.all(
      subjects.map(async (subject) => {
        const chapters = await Flashcard.distinct("chapterNo", {
          schoolClass,
          subject,
          isPublished: true,
        });
        const cardCount = await Flashcard.countDocuments({
          schoolClass,
          subject,
          isPublished: true,
        });
        return { subject, chapterCount: chapters.length, cardCount };
      })
    );

    return res.json({ success: true, subjects: counts });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// ── GET /api/v1/flashcards/chapters?class=10&subject=Science ─────────────────
export const getChapters = async (req, res) => {
  let { class: schoolClass = "10", subject } = req.query;
  if (!subject) return fail(res, 400, "subject is required");
  await ensureSeedFlashcards();

  if (schoolClass !== "10") {
    schoolClass = "10";
  }

  try {
    const rows = await Flashcard.aggregate([
      { $match: { schoolClass, subject, isPublished: true } },
      {
        $group: {
          _id: { chapterNo: "$chapterNo", chapterTitle: "$chapterTitle" },
          cardCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.chapterNo": 1 } },
    ]);

    const chapters = rows.map((r) => ({
      chapterNo: r._id.chapterNo,
      chapterTitle: r._id.chapterTitle,
      cardCount: r.cardCount,
    }));

    return res.json({ success: true, chapters });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// ── POST /api/v1/flashcards/session/start (Auth required) ────────────────────
// Body: { class, subject, chapterNo?, mode, limit }
export const startSession = async (req, res) => {
  const userId = req.user._id;
  let {
    class: schoolClass = "10",
    subject,
    chapterNo,
    mode = "practice",
    limit = 15,
  } = req.body;

  if (!subject) return fail(res, 400, "subject is required");

  if (schoolClass !== "10") {
    schoolClass = "10";
  }

  await ensureSeedFlashcards();

  try {
    const filter = {
      schoolClass,
      subject,
      isPublished: true,
    };
    if (chapterNo !== undefined && chapterNo !== null && chapterNo !== "") {
      filter.chapterNo = Number(chapterNo);
    }

    let cards = [];

    if (mode === "spaced_review") {
      // Find cards due today or earlier for this user
      const dueProgress = await FlashcardProgress.find({
        user: userId,
        subject,
        nextReviewAt: { $lte: new Date() },
      })
        .select("card")
        .limit(Number(limit) || 20);

      const dueCardIds = dueProgress.map((p) => p.card);

      if (dueCardIds.length > 0) {
        cards = await Flashcard.find({
          _id: { $in: dueCardIds },
          isPublished: true,
        });
      }
    }

    // If practice mode or not enough due cards, fetch standard deck
    if (cards.length === 0) {
      cards = await Flashcard.find(filter).limit(Number(limit) || 20);
    }

    if (cards.length === 0) {
      return fail(res, 404, "No flashcards found for selected criteria.");
    }

    // Shuffle deck for fresh retrieval
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);

    // Create session in database
    const session = await FlashcardSession.create({
      user: userId,
      schoolClass,
      subject,
      chapterNo: chapterNo ? Number(chapterNo) : null,
      chapterTitle: chapterNo && cards[0] ? cards[0].chapterTitle : "All Chapters",
      mode,
      cardsTotal: shuffledCards.length,
      cardsReviewed: [],
      status: "in_progress",
    });

    return res.json({
      success: true,
      sessionId: session._id,
      cardsTotal: shuffledCards.length,
      cards: shuffledCards.map((c) => ({
        id: c._id,
        front: c.front,
        frontHint: c.frontHint,
        back: c.back,
        keyTakeaway: c.keyTakeaway,
        mnemonic: c.mnemonic,
        formula: c.formula,
        subject: c.subject,
        chapterNo: c.chapterNo,
        chapterTitle: c.chapterTitle,
        topicTitle: c.topicTitle,
        difficulty: c.difficulty,
        tags: c.tags,
      })),
    });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// ── POST /api/v1/flashcards/session/:sessionId/rate (Auth required) ──────────
// Body: { cardId, rating, responseMs }
// rating: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
export const rateCard = async (req, res) => {
  const userId = req.user._id;
  const { sessionId } = req.params;
  const { cardId, rating, responseMs = 0 } = req.body;

  if (!cardId) return fail(res, 400, "cardId is required");
  const numRating = Number(rating);
  if (![1, 2, 3, 4].includes(numRating)) {
    return fail(res, 400, "rating must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy)");
  }

  try {
    const session = await FlashcardSession.findOne({ _id: sessionId, user: userId });
    if (!session) return fail(res, 404, "Session not found");

    const card = await Flashcard.findById(cardId);
    if (!card) return fail(res, 404, "Card not found");

    // ── SuperMemo SM-2 Algorithm ───────────────────────────────────────────────
    // Map 1-4 scale to SM-2 quality (0 to 5):
    // 1 (Again) -> 1 (blackout / incorrect)
    // 2 (Hard)  -> 3 (correct with difficulty)
    // 3 (Good)  -> 4 (correct with hesitation)
    // 4 (Easy)  -> 5 (perfect recall)
    const qualityMap = { 1: 1, 2: 3, 3: 4, 4: 5 };
    const quality = qualityMap[numRating];

    let progress = await FlashcardProgress.findOne({ user: userId, card: cardId });
    if (!progress) {
      progress = new FlashcardProgress({
        user: userId,
        card: cardId,
        schoolClass: card.schoolClass,
        subject: card.subject,
        easeFactor: 2.5,
        interval: 0,
        repetition: 0,
      });
    }

    let { easeFactor, interval, repetition } = progress;

    if (quality < 3) {
      // Failed recall: reset repetitions and interval to 1 day
      repetition = 0;
      interval = 1;
    } else {
      // Successful recall
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetition += 1;
    }

    // Calculate new Ease Factor:
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextReviewAt = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);

    progress.easeFactor = easeFactor;
    progress.interval = interval;
    progress.repetition = repetition;
    progress.nextReviewAt = nextReviewAt;
    progress.lastReviewedAt = new Date();
    progress.lastRating = numRating;
    progress.history.push({
      rating: numRating,
      interval,
      easeFactor,
      reviewedAt: new Date(),
    });

    await progress.save();

    // ── Update Session State ──────────────────────────────────────────────────
    session.cardsReviewed.push({
      card: cardId,
      rating: numRating,
      responseMs: Number(responseMs) || 0,
      reviewedAt: new Date(),
    });

    if (numRating === 1) session.againCount += 1;
    else if (numRating === 2) session.hardCount += 1;
    else if (numRating === 3) session.goodCount += 1;
    else if (numRating === 4) session.easyCount += 1;

    const totalReviewed = session.cardsReviewed.length;
    const masteredCount = session.goodCount + session.easyCount;
    session.masteryScore = totalReviewed > 0 ? Math.round((masteredCount / totalReviewed) * 100) : 0;

    if (totalReviewed >= session.cardsTotal) {
      session.status = "completed";
      session.completedAt = new Date();
    }

    await session.save();

    return res.json({
      success: true,
      cardId,
      rating: numRating,
      nextReviewIntervalDays: interval,
      nextReviewAt,
      session: {
        totalReviewed,
        cardsTotal: session.cardsTotal,
        masteryScore: session.masteryScore,
        againCount: session.againCount,
        hardCount: session.hardCount,
        goodCount: session.goodCount,
        easyCount: session.easyCount,
        isCompleted: session.status === "completed",
      },
    });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// ── GET /api/v1/flashcards/session/:sessionId/result (Auth required) ─────────
export const getResult = async (req, res) => {
  const userId = req.user._id;
  const { sessionId } = req.params;

  try {
    const session = await FlashcardSession.findOne({ _id: sessionId, user: userId })
      .populate("cardsReviewed.card");

    if (!session) return fail(res, 404, "Session not found");

    return res.json({
      success: true,
      session: {
        id: session._id,
        subject: session.subject,
        chapterNo: session.chapterNo,
        chapterTitle: session.chapterTitle,
        mode: session.mode,
        cardsTotal: session.cardsTotal,
        masteryScore: session.masteryScore,
        againCount: session.againCount,
        hardCount: session.hardCount,
        goodCount: session.goodCount,
        easyCount: session.easyCount,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        cardsReviewed: session.cardsReviewed.map((cr) => ({
          rating: cr.rating,
          responseMs: cr.responseMs,
          reviewedAt: cr.reviewedAt,
          card: cr.card
            ? {
                id: cr.card._id,
                front: cr.card.front,
                frontHint: cr.card.frontHint,
                back: cr.card.back,
                keyTakeaway: cr.card.keyTakeaway,
                mnemonic: cr.card.mnemonic,
                formula: cr.card.formula,
                subject: cr.card.subject,
                chapterNo: cr.card.chapterNo,
                chapterTitle: cr.card.chapterTitle,
                topicTitle: cr.card.topicTitle,
                difficulty: cr.card.difficulty,
              }
            : null,
        })),
      },
    });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// ── GET /api/v1/flashcards/history (Auth required) ───────────────────────────
export const getHistory = async (req, res) => {
  const userId = req.user._id;

  try {
    const sessions = await FlashcardSession.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(15)
      .select("subject chapterNo chapterTitle masteryScore cardsTotal againCount hardCount goodCount easyCount status startedAt completedAt createdAt");

    return res.json({ success: true, history: sessions });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// ── GET /api/v1/flashcards/stats (Auth required) ─────────────────────────────
export const getStats = async (req, res) => {
  const userId = req.user._id;

  try {
    // Total unique cards reviewed by user
    const totalProgress = await FlashcardProgress.countDocuments({ user: userId });

    // Cards due for spaced repetition right now
    const dueCount = await FlashcardProgress.countDocuments({
      user: userId,
      nextReviewAt: { $lte: new Date() },
    });

    // Subject mastery breakdown
    const subjectStats = await FlashcardSession.aggregate([
      { $match: { user: userId, status: "completed" } },
      {
        $group: {
          _id: "$subject",
          avgMastery: { $avg: "$masteryScore" },
          sessionsCount: { $sum: 1 },
          cardsReviewed: { $sum: { $size: "$cardsReviewed" } },
        },
      },
    ]);

    const stats = subjectStats.map((s) => ({
      subject: s._id,
      avgMastery: Math.round(s.avgMastery),
      sessionsCount: s.sessionsCount,
      cardsReviewed: s.cardsReviewed,
    }));

    return res.json({
      success: true,
      totalCardsReviewed: totalProgress,
      dueCount,
      subjects: stats,
    });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// ── POST /api/v1/flashcards/admin/seed (Admin only) ──────────────────────────
export const seedCards = async (req, res) => {
  try {
    let inserted = 0;
    for (const card of CLASS_10_FLASHCARDS) {
      await Flashcard.updateOne(
        { schoolClass: card.schoolClass, subject: card.subject, front: card.front },
        { $set: card },
        { upsert: true }
      );
      inserted++;
    }
    return res.json({ success: true, message: `Successfully upserted ${inserted} flashcards` });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};
