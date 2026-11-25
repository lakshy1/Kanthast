// Mcq.js — controller for Practice Studio MCQ module
// Routes: /api/v1/mcq/*
import McqQuestion from "../models/McqQuestion.js";
import McqSession from "../models/McqSession.js";
import McqProgress from "../models/McqProgress.js";
import { CLASS_10_MCQ_QUESTIONS } from "../data/class10McqSeed.js";

// Ensure questions are synced safely without duplicates
let mcqSeedPromise = null;
async function ensureSeedQuestions() {
  if (mcqSeedPromise) return mcqSeedPromise;

  mcqSeedPromise = (async () => {
    try {
      const existing = await McqQuestion.find({ schoolClass: "10" }).select("stem").lean();
      const seen = new Set(existing.map((q) => String(q.stem || "").trim().toLowerCase()));
      const missing = (CLASS_10_MCQ_QUESTIONS || []).filter(
        (q) => !seen.has(String(q.stem || "").trim().toLowerCase())
      );
      if (missing.length > 0) {
        await McqQuestion.insertMany(missing);
        console.log(`Auto-synced ${missing.length} Class X MCQ questions`);
      }
    } catch (err) {
      console.error("Auto-seed error in Mcq controller:", err);
    } finally {
      mcqSeedPromise = null;
    }
  })();

  return mcqSeedPromise;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const fail = (res, status, message, extra = {}) =>
  res.status(status).json({ success: false, message, ...extra });

// Strip the correct answer index + distractor notes before sending to client.
// The client shuffles the options array by itself — we return a shuffleSeed so
// the server can verify the submission with the same mapping.
function safeQuestion(q, shuffleSeed) {
  const opts = shuffleSeed
    ? shuffleSeed.map((i) => ({ text: q.options[i].text }))
    : q.options.map((o) => ({ text: o.text }));

  return {
    id: q._id,
    stem: q.stem,
    options: opts,
    subject: q.subject,
    chapterNo: q.chapterNo,
    chapterTitle: q.chapterTitle,
    topicNo: q.topicNo,
    topicTitle: q.topicTitle,
    difficulty: q.difficulty,
    shuffleSeed, // the index permutation: opts[0] = original options[shuffleSeed[0]]
  };
}

// Fisher-Yates shuffle for option indices [0,1,2,3]
function shuffleIndices() {
  const a = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── GET /api/v1/mcq/subjects?class=10 ────────────────────────────────────────
// Lists subjects that have published questions for a given class.
export const getSubjects = async (req, res) => {
  let { class: schoolClass = "10" } = req.query;
  await ensureSeedQuestions();

  // If requested class has no questions yet, default to Class 10 so content is always accessible
  if (schoolClass !== "10") {
    schoolClass = "10";
  }

  try {
    const subjects = await McqQuestion.distinct("subject", {
      schoolClass,
      isPublished: true,
    });
    // Return chapter counts per subject for the picker UI
    const counts = await Promise.all(
      subjects.map(async (subject) => {
        const chapters = await McqQuestion.distinct("chapterNo", {
          schoolClass,
          subject,
          isPublished: true,
        });
        const questionCount = await McqQuestion.countDocuments({
          schoolClass,
          subject,
          isPublished: true,
        });
        return { subject, chapterCount: chapters.length, questionCount };
      })
    );
    return res.json({ success: true, subjects: counts });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// ── GET /api/v1/mcq/chapters?class=10&subject=Science ────────────────────────
export const getChapters = async (req, res) => {
  let { class: schoolClass = "10", subject } = req.query;
  if (!subject) return fail(res, 400, "subject is required");
  await ensureSeedQuestions();

  if (schoolClass !== "10") {
    schoolClass = "10";
  }

  try {
    const rows = await McqQuestion.aggregate([
      { $match: { schoolClass, subject, isPublished: true } },
      {
        $group: {
          _id: { chapterNo: "$chapterNo", chapterTitle: "$chapterTitle" },
          questionCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.chapterNo": 1 } },
    ]);
    const chapters = rows.map((r) => ({
      chapterNo: r._id.chapterNo,
      chapterTitle: r._id.chapterTitle,
      questionCount: r.questionCount,
    }));
    return res.json({ success: true, chapters });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// ── POST /api/v1/mcq/session/start (auth required) ───────────────────────────
// Body: { class, subject, chapterNo?, mode, difficulty, count }
// Returns the first question (with shuffled options) + session id.
export const startSession = async (req, res) => {
  const userId = req.user._id;
  let {
    class: schoolClass = "10",
    subject,
    chapterNo,
    mode = "practice",
    difficulty = "mixed",
    count = 10,
  } = req.body;

  if (!subject) return fail(res, 400, "subject is required");

  // Practice tests are currently live for Class X — allow all enrolled students to access
  if (schoolClass !== "10") {
    schoolClass = "10";
  }

  await ensureSeedQuestions();

  try {
    // Build filter
    const filter = { schoolClass, subject, isPublished: true };
    if (chapterNo) filter.chapterNo = Number(chapterNo);
    if (difficulty !== "mixed") filter.difficulty = { easy: 1, medium: 2, hard: 3 }[difficulty];

    // Pull questions — priority order: due for review first, then random
    const dueIds = await McqProgress.find({
      user: userId,
      nextReviewAt: { $lte: new Date() },
    })
      .sort({ nextReviewAt: 1 })
      .select("question")
      .lean();

    const dueSet = new Set(dueIds.map((d) => String(d.question)));
    const allQs = await McqQuestion.find(filter)
      .select("_id difficulty")
      .lean();

    if (allQs.length === 0)
      return fail(res, 404, "No questions found for this selection. Try a different subject or chapter.");

    // Sort: due questions first, then random
    const due = allQs.filter((q) => dueSet.has(String(q._id)));
    const fresh = allQs.filter((q) => !dueSet.has(String(q._id))).sort(() => Math.random() - 0.5);
    const pool = [...due, ...fresh].slice(0, Math.min(count, 40));

    const questionIds = pool.map((q) => q._id);

    const session = await McqSession.create({
      user: userId,
      schoolClass,
      subject,
      chapterNo: chapterNo ? Number(chapterNo) : null,
      mode,
      difficulty,
      questionIds,
      totalQuestions: questionIds.length,
    });

    // Fetch and return first question (safe)
    const firstQ = await McqQuestion.findById(questionIds[0]).lean();
    const seed = shuffleIndices();

    return res.status(201).json({
      success: true,
      sessionId: session._id,
      totalQuestions: questionIds.length,
      currentIndex: 0,
      question: safeQuestion(firstQ, seed),
    });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// ── POST /api/v1/mcq/session/:sessionId/answer ───────────────────────────────
// Body: { questionIndex, shuffleSeed, chosenShuffledIndex, responseMs }
// Returns: verdict + explanation + (if not last) next question.
export const submitAnswer = async (req, res) => {
  const userId = req.user._id;
  const { sessionId } = req.params;
  const { questionIndex, shuffleSeed, chosenShuffledIndex, responseMs } = req.body;

  try {
    const session = await McqSession.findOne({ _id: sessionId, user: userId }).lean();
    if (!session) return fail(res, 404, "Session not found.");
    if (session.status !== "active") return fail(res, 400, "Session is already complete.");

    const qIndex = Number(questionIndex);
    if (qIndex < 0 || qIndex >= session.questionIds.length)
      return fail(res, 400, "Invalid question index.");

    const questionId = session.questionIds[qIndex];
    const q = await McqQuestion.findById(questionId).lean();
    if (!q) return fail(res, 500, "Question not found.");

    // Reverse the shuffle to get the original option index the student picked
    const originalIndex =
      chosenShuffledIndex != null && shuffleSeed?.length === 4
        ? shuffleSeed[chosenShuffledIndex]
        : chosenShuffledIndex;

    const isCorrect = originalIndex === q.correctIndex;
    const chosenOption = q.options[originalIndex];
    const correctOption = q.options[q.correctIndex];

    // Update session answers array
    await McqSession.updateOne(
      { _id: sessionId },
      {
        $push: {
          answers: {
            questionId,
            chosenIndex: originalIndex ?? null,
            isCorrect,
            responseMs: responseMs ?? null,
            answeredAt: new Date(),
          },
        },
      }
    );

    // Update spaced-repetition progress
    let grade;
    if (originalIndex == null) grade = 1; // skipped
    else if (!isCorrect) grade = 1;
    else if (responseMs && responseMs < 8000) grade = 5; // quick correct
    else if (responseMs && responseMs < 20000) grade = 4; // normal correct
    else grade = 3; // slow correct

    const progress = await McqProgress.findOne({ user: userId, question: questionId });
    if (progress) {
      McqProgress.sm2Update(progress, grade);
      progress.totalAttempts += 1;
      if (isCorrect) progress.totalCorrect += 1;
      progress.lastAnsweredAt = new Date();
      progress.lastCorrect = isCorrect;
      await progress.save();
    } else {
      const newP = new McqProgress({ user: userId, question: questionId });
      McqProgress.sm2Update(newP, grade);
      newP.totalAttempts = 1;
      newP.totalCorrect = isCorrect ? 1 : 0;
      newP.lastAnsweredAt = new Date();
      newP.lastCorrect = isCorrect;
      await newP.save();
    }

    // Build feedback payload (distractor note for wrong picks)
    const distractorNote =
      !isCorrect && chosenOption?.distractorNote ? chosenOption.distractorNote : "";

    const feedback = {
      isCorrect,
      correctIndex: q.correctIndex, // original index
      correctText: correctOption.text,
      explanation: q.explanation,
      keyConcept: q.keyConcept || "",
      distractorNote,
    };

    // Check if more questions remain
    const nextIndex = qIndex + 1;
    const isLast = nextIndex >= session.questionIds.length;

    if (isLast) {
      // Close the session
      const freshAnswers = (await McqSession.findById(sessionId).select("answers").lean()).answers;
      const allAnswers = [...(freshAnswers || [])];
      const correctCount = allAnswers.filter((a) => a.isCorrect).length;
      const timeTakenMs = freshAnswers.length
        ? freshAnswers.reduce((acc, a) => acc + (a.responseMs || 0), 0)
        : null;

      await McqSession.updateOne(
        { _id: sessionId },
        {
          $set: {
            status: "done",
            correctCount,
            score: Math.round((correctCount / session.totalQuestions) * 100),
            timeTakenMs,
            completedAt: new Date(),
          },
        }
      );
      return res.json({ success: true, feedback, isLast: true, nextIndex: null });
    }

    // Fetch next question
    const nextQ = await McqQuestion.findById(session.questionIds[nextIndex]).lean();
    const seed = shuffleIndices();

    return res.json({
      success: true,
      feedback,
      isLast: false,
      nextIndex,
      nextQuestion: safeQuestion(nextQ, seed),
    });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// ── GET /api/v1/mcq/session/:sessionId/result ────────────────────────────────
export const getResult = async (req, res) => {
  const userId = req.user._id;
  const { sessionId } = req.params;
  try {
    const session = await McqSession.findOne({ _id: sessionId, user: userId })
      .populate("questionIds", "stem subject chapterTitle difficulty options correctIndex explanation keyConcept")
      .lean();
    if (!session) return fail(res, 404, "Session not found.");

    // Build a rich question review
    const review = session.answers.map((a, i) => {
      const q = session.questionIds[i];
      const chosenText = (a.chosenIndex !== null && q?.options?.[a.chosenIndex])
        ? q.options[a.chosenIndex].text
        : "Skipped / Unanswered";
      const correctText = (q?.correctIndex != null && q?.options?.[q.correctIndex])
        ? q.options[q.correctIndex].text
        : "";
      const chosenDistractorNote = (a.chosenIndex !== null && q?.options?.[a.chosenIndex])
        ? q.options[a.chosenIndex].distractorNote
        : "";

      return {
        questionId: q?._id,
        index: i + 1,
        stem: q?.stem,
        subject: q?.subject,
        chapterTitle: q?.chapterTitle,
        difficulty: q?.difficulty,
        isCorrect: a.isCorrect,
        chosenIndex: a.chosenIndex,
        chosenText,
        correctIndex: q?.correctIndex,
        correctText,
        distractorNote: chosenDistractorNote,
        explanation: q?.explanation,
        keyConcept: q?.keyConcept,
        responseMs: a.responseMs,
      };
    });

    return res.json({
      success: true,
      session: {
        id: session._id,
        subject: session.subject,
        chapterNo: session.chapterNo,
        mode: session.mode,
        difficulty: session.difficulty,
        status: session.status,
        score: session.score,
        correctCount: session.correctCount,
        totalQuestions: session.totalQuestions,
        timeTakenMs: session.timeTakenMs,
        completedAt: session.completedAt,
        review,
      },
    });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// ── GET /api/v1/mcq/history (auth) ───────────────────────────────────────────
export const getHistory = async (req, res) => {
  const userId = req.user._id;
  try {
    const sessions = await McqSession.find({ user: userId, status: "done" })
      .sort({ completedAt: -1 })
      .limit(20)
      .select("subject chapterNo mode score correctCount totalQuestions timeTakenMs completedAt")
      .lean();
    return res.json({ success: true, sessions });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// ── GET /api/v1/mcq/stats (auth) ─────────────────────────────────────────────
// Returns per-subject mastery percentages for the dashboard widget.
export const getStats = async (req, res) => {
  const userId = req.user._id;
  let { class: schoolClass = "10" } = req.query;
  try {
    const filter = { user: userId, status: "done" };
    if (schoolClass && schoolClass !== "all") {
      filter.schoolClass = schoolClass;
    }
    const sessions = await McqSession.find(filter).select("subject correctCount totalQuestions").lean();

    const bySubject = {};
    for (const s of sessions) {
      if (!bySubject[s.subject]) bySubject[s.subject] = { correct: 0, total: 0 };
      bySubject[s.subject].correct += s.correctCount;
      bySubject[s.subject].total += s.totalQuestions;
    }

    const stats = Object.entries(bySubject).map(([subject, { correct, total }]) => ({
      subject,
      mastery: total > 0 ? Math.round((correct / total) * 100) : 0,
      questionsAttempted: total,
    }));

    return res.json({ success: true, stats });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// ── Admin: seed questions (admin only) ───────────────────────────────────────
export const seedQuestions = async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || questions.length === 0)
    return fail(res, 400, "questions array required");
  try {
    const inserted = await McqQuestion.insertMany(questions, { ordered: false });
    return res.status(201).json({ success: true, inserted: inserted.length });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};
