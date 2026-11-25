// controllers/Viva.js — Viva Coach Oral Exam Simulator & Rubric/AI Evaluator
import VivaQuestion from "../models/VivaQuestion.js";
import VivaSession from "../models/VivaSession.js";
import { CLASS_10_VIVA_QUESTIONS } from "../data/class10VivaSeed.js";

const fail = (res, status, message, extra = {}) =>
  res.status(status).json({ success: false, message, ...extra });

function computeRating(score) {
  if (score >= 90) return { rating: 5, ratingLabel: "Outstanding" };
  if (score >= 75) return { rating: 4, ratingLabel: "Strong" };
  if (score >= 60) return { rating: 3, ratingLabel: "Good" };
  if (score >= 40) return { rating: 2, ratingLabel: "Developing" };
  return { rating: 1, ratingLabel: "Needs Practice" };
}

// Auto-seed Class X Viva Questions safely with concurrency lock & duplicate cleanup
let seedPromise = null;
export async function ensureSeedVivaQuestions() {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    try {
      // Remove any accidental duplicate questions from earlier concurrent seeds
      const existing = await VivaQuestion.find({ schoolClass: "10" }).select("_id question").lean();
      const seen = new Set();
      const dupIds = [];
      for (const doc of existing) {
        const key = String(doc.question || "").trim().toLowerCase();
        if (seen.has(key)) {
          dupIds.push(doc._id);
        } else {
          seen.add(key);
        }
      }
      if (dupIds.length > 0) {
        await VivaQuestion.deleteMany({ _id: { $in: dupIds } });
      }

      // Insert any seed questions not yet in DB
      const missing = (CLASS_10_VIVA_QUESTIONS || []).filter(
        (q) => !seen.has(String(q.question || "").trim().toLowerCase())
      );
      if (missing.length > 0) {
        await VivaQuestion.insertMany(missing);
        console.log(`Seeded ${missing.length} Class X Viva Questions`);
      }
    } catch (err) {
      console.error("Auto-seed error in Viva controller:", err);
    } finally {
      seedPromise = null;
    }
  })();

  return seedPromise;
}

// ── Rubric Evaluator (Deterministic + Optional AI Enhancement) ────────────────
function evaluateRubric(transcript, questionOrPoints = [], mode = "standard") {
  const isQuestionObj = !Array.isArray(questionOrPoints) && questionOrPoints !== null;
  const rubricPoints = isQuestionObj ? questionOrPoints.rubricPoints || [] : questionOrPoints;
  const modelAnswer = isQuestionObj ? String(questionOrPoints.modelAnswer || "") : "";
  const examinerTip = isQuestionObj ? String(questionOrPoints.examinerTip || "") : "";
  const normalized = String(transcript || "")
    .toLowerCase()
    .replace(/[^\w\s²³+=-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = normalized.split(" ").filter(Boolean);
  let totalWeight = 0;
  let earnedWeight = 0;
  const matchedPoints = [];
  const missedPoints = [];

  for (const rp of rubricPoints) {
    const weight = rp.weight || 1;
    totalWeight += weight;
    const keywords = rp.keywords || [];
    const hit = keywords.some((kw) => normalized.includes(kw.toLowerCase()));
    if (hit) {
      earnedWeight += weight;
      matchedPoints.push(rp.point);
    } else {
      missedPoints.push(rp.point);
    }
  }

  let rawScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  // Clarity/depth bonus or brevity penalty
  if (words.length < 6 && rawScore > 40) {
    rawScore = Math.max(25, rawScore - 15);
  } else if (mode === "strict" && words.length < 12 && rawScore > 50) {
    rawScore = Math.max(40, rawScore - 10);
  }

  const score = Math.min(100, Math.max(0, rawScore));
  const verdict = score >= 80 ? "excellent" : score >= 60 ? "good" : "needs_polish";

  // Build crisp, spoken-friendly deterministic feedback naming what was hit, what was missed, and what to say
  const lowerFirst = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1).replace(/\.$/, "") : "");
  const firstMatched = lowerFirst(matchedPoints[0]);
  const missedSummary = missedPoints.slice(0, 2).map(lowerFirst).join(" and ");
  const modelSentences = modelAnswer
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const suggestedLine = modelSentences[0] || examinerTip;

  let feedback = "";
  if (score >= 80 && missedPoints.length === 0) {
    feedback = examinerTip
      ? `Excellent explanation! You covered all ${rubricPoints.length} key checkpoints cleanly. Pro tip: ${examinerTip}`
      : `Excellent explanation! You covered all ${rubricPoints.length} key checkpoints cleanly.`;
  } else if (score >= 60) {
    feedback = missedSummary
      ? `Good start — you explained ${firstMatched || "the core idea"} well, but you missed mentioning ${missedSummary}. You should also say: "${suggestedLine}"`
      : `Good conceptual grasp covering ${matchedPoints.length} of ${rubricPoints.length} checkpoints.`;
  } else if (matchedPoints.length > 0) {
    feedback = missedSummary
      ? `You're on the right track with ${firstMatched}, but you missed ${missedSummary}. Next time, make sure you say: "${suggestedLine}"`
      : `You touched on ${matchedPoints.length} ${matchedPoints.length === 1 ? "point" : "points"}, but missed ${missedPoints.length} core ${missedPoints.length === 1 ? "detail" : "details"}.`;
  } else {
    feedback = missedSummary
      ? `You missed the core NCERT points — specifically ${missedSummary}. A crisp way to answer this in your viva is: "${suggestedLine}"`
      : `That didn't hit the core NCERT keywords yet. A strong way to answer this is: "${suggestedLine}"`;
  }

  return { score, verdict, matchedPoints, missedPoints, feedback };
}

async function maybeEnhanceFeedbackWithAI(question, transcript, rubricResult) {
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  const openaiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!geminiKey && !openaiKey) return rubricResult.feedback;

  const prompt = `You are Elena, a warm, sharp CBSE Class 10 Voice Tutor speaking aloud to a student.
Question: "${question.question}"
Model Answer: "${question.modelAnswer}"
Student's Spoken Answer: "${transcript}"
Rubric Score: ${rubricResult.score}%
Matched Points: ${rubricResult.matchedPoints.join("; ") || "None"}
Missed Points: ${rubricResult.missedPoints.join("; ") || "None"}

Respond in 2 to 3 natural, complete spoken sentences directly to the student:
- If the student says they don't know or asks you to answer, warmly teach them the crisp NCERT answer in 2 to 3 clear spoken sentences.
- Otherwise:
  1) Acknowledge what they got right (or gently correct any misconception in their phrasing).
  2) If anything was missed, explicitly tell them what point they missed AND give them the exact concise sentence they should say as well next time (e.g., "You missed mentioning magnesium oxide — next time you should also say that...").
Do NOT use markdown, bullet points, or asterisks, and do NOT tell them to "review the model answer".`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);

  try {
    if (geminiKey) {
      const models = [process.env.GEMINI_MODEL, "gemini-2.5-flash", "gemini-flash-latest"].filter(Boolean);
      for (const model of models) {
        const cleanModel = model.replace(/^models\//, "").trim();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${geminiKey}`;
        const genConfig = { temperature: 0.35, maxOutputTokens: 600 };
        if (cleanModel.includes("2.5")) {
          genConfig.thinkingConfig = { thinkingBudget: 0 };
        }
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: genConfig,
          }),
        });
        if (r.ok) {
          const data = await r.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text && text.length >= 25) return text;
        }
      }
    } else if (openaiKey) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.35,
          max_tokens: 140,
        }),
      });
      if (r.ok) {
        const data = await r.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    }
  } catch {
    // Silent fallback to deterministic rubric feedback
  } finally {
    clearTimeout(timer);
  }

  return rubricResult.feedback;
}

// ── GET /api/v1/viva/subjects?class=10 ───────────────────────────────────────
export const getSubjects = async (req, res) => {
  let { class: schoolClass = "10" } = req.query;
  await ensureSeedVivaQuestions();
  if (schoolClass !== "10") schoolClass = "10";

  try {
    const subjects = await VivaQuestion.distinct("subject", {
      schoolClass,
      isPublished: true,
    });

    const counts = await Promise.all(
      subjects.map(async (subject) => {
        const chapters = await VivaQuestion.distinct("chapterNo", {
          schoolClass,
          subject,
          isPublished: true,
        });
        const questionCount = await VivaQuestion.countDocuments({
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

// ── GET /api/v1/viva/chapters?class=10&subject=Science ───────────────────────
export const getChapters = async (req, res) => {
  let { class: schoolClass = "10", subject } = req.query;
  if (!subject) return fail(res, 400, "subject is required");
  await ensureSeedVivaQuestions();
  if (schoolClass !== "10") schoolClass = "10";

  try {
    const rows = await VivaQuestion.aggregate([
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

// ── POST /api/v1/viva/session/start (Auth required) ──────────────────────────
export const startSession = async (req, res) => {
  const userId = req.user._id;
  let {
    class: schoolClass = "10",
    subject,
    chapterNo,
    mode = "standard",
    difficulty = "mixed",
    count = 5,
  } = req.body;

  if (!subject) return fail(res, 400, "subject is required");
  if (schoolClass !== "10") schoolClass = "10";

  await ensureSeedVivaQuestions();

  try {
    const filter = { schoolClass, subject, isPublished: true };
    if (chapterNo) filter.chapterNo = Number(chapterNo);
    if (difficulty && difficulty !== "mixed") filter.difficulty = difficulty;

    let pool = await VivaQuestion.find(filter).lean();

    // Fallback to all difficulties in chapter/subject if filtered pool is empty
    if (pool.length === 0 && difficulty !== "mixed") {
      delete filter.difficulty;
      pool = await VivaQuestion.find(filter).lean();
    }

    if (pool.length === 0) {
      return fail(res, 404, "No viva questions found for this selection.");
    }

    // Deduplicate by question text so the same prompt is never asked twice in one session
    const seenQuestions = new Set();
    const uniquePool = pool.filter((q) => {
      const key = String(q.question || "").trim().toLowerCase();
      if (seenQuestions.has(key)) return false;
      seenQuestions.add(key);
      return true;
    });

    // Shuffle and slice
    const shuffled = [...uniquePool].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, Math.min(Number(count) || 5, shuffled.length));

    const chapterTitle = chapterNo
      ? chosen[0]?.chapterTitle || `Chapter ${chapterNo}`
      : "All Chapters";

    const session = await VivaSession.create({
      userId,
      schoolClass,
      subject,
      chapterNo: chapterNo ? Number(chapterNo) : null,
      chapterTitle,
      mode,
      difficulty,
      totalQuestions: chosen.length,
      questions: chosen.map((q) => q._id),
      evaluations: [],
      status: "in_progress",
    });

    const sanitizedQuestions = chosen.map((q) => ({
      id: q._id,
      subject: q.subject,
      chapterNo: q.chapterNo,
      chapterTitle: q.chapterTitle,
      difficulty: q.difficulty,
      examinerContext: q.examinerContext,
      question: q.question,
      hint: q.hint,
      rubricCount: q.rubricPoints?.length || 0,
    }));

    return res.status(201).json({
      success: true,
      sessionId: session._id,
      totalQuestions: chosen.length,
      mode,
      questions: sanitizedQuestions,
    });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// ── POST /api/v1/viva/session/:sessionId/answer (Auth required) ──────────────
export const submitAnswer = async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user._id;
  const { questionIndex, transcript, inputMode = "text", responseMs = 0 } = req.body;

  if (questionIndex === undefined || !transcript || !String(transcript).trim()) {
    return fail(res, 400, "questionIndex and transcript are required");
  }

  try {
    const session = await VivaSession.findOne({ _id: sessionId, userId });
    if (!session) return fail(res, 404, "Viva session not found");

    const qId = session.questions[questionIndex];
    if (!qId) return fail(res, 400, "Invalid questionIndex");

    const question = await VivaQuestion.findById(qId).lean();
    if (!question) return fail(res, 404, "Viva question not found");

    const rubricResult = evaluateRubric(transcript, question, session.mode);
    const feedback = await maybeEnhanceFeedbackWithAI(question, transcript, rubricResult);

    const evalEntry = {
      questionId: question._id,
      questionIndex: Number(questionIndex),
      transcript: String(transcript).trim(),
      inputMode,
      score: rubricResult.score,
      verdict: rubricResult.verdict,
      matchedPoints: rubricResult.matchedPoints,
      missedPoints: rubricResult.missedPoints,
      feedback,
      responseMs: Number(responseMs) || 0,
    };

    // Replace if already evaluated at this index, else push
    const existingIdx = session.evaluations.findIndex(
      (e) => e.questionIndex === Number(questionIndex)
    );
    if (existingIdx >= 0) {
      session.evaluations[existingIdx] = evalEntry;
    } else {
      session.evaluations.push(evalEntry);
    }

    // Recompute session totals & rating
    const totalEval = session.evaluations.length;
    const sumScore = session.evaluations.reduce((acc, e) => acc + e.score, 0);
    session.overallScore = totalEval > 0 ? Math.round(sumScore / totalEval) : 0;
    const { rating, ratingLabel } = computeRating(session.overallScore);
    session.rating = rating;
    session.ratingLabel = ratingLabel;
    session.strongCount = session.evaluations.filter((e) => e.score >= 70).length;
    session.needsWorkCount = session.evaluations.filter((e) => e.score < 70).length;

    if (totalEval >= session.totalQuestions) {
      session.status = "completed";
      session.completedAt = new Date();
    }

    await session.save();

    return res.json({
      success: true,
      evaluation: evalEntry,
      modelAnswer: question.modelAnswer,
      examinerTip: question.examinerTip,
      followUpQuestion: question.followUpQuestion,
      sessionComplete: session.status === "completed",
      overallScore: session.overallScore,
      rating: session.rating,
      ratingLabel: session.ratingLabel,
    });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// ── GET /api/v1/viva/session/:sessionId/result (Auth required) ───────────────
export const getResult = async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user._id;

  try {
    const session = await VivaSession.findOne({ _id: sessionId, userId })
      .populate("questions")
      .lean();
    if (!session) return fail(res, 404, "Viva session not found");

    const items = (session.questions || []).map((q, idx) => {
      const ev = (session.evaluations || []).find((e) => e.questionIndex === idx);
      return {
        questionIndex: idx,
        question: q.question,
        chapterTitle: q.chapterTitle,
        difficulty: q.difficulty,
        examinerContext: q.examinerContext,
        modelAnswer: q.modelAnswer,
        examinerTip: q.examinerTip,
        followUpQuestion: q.followUpQuestion,
        evaluation: ev || null,
      };
    });

    return res.json({
      success: true,
      session: {
        _id: session._id,
        subject: session.subject,
        chapterNo: session.chapterNo,
        chapterTitle: session.chapterTitle,
        mode: session.mode,
        totalQuestions: session.totalQuestions,
        overallScore: session.overallScore,
        rating: session.rating,
        ratingLabel: session.ratingLabel,
        strongCount: session.strongCount,
        needsWorkCount: session.needsWorkCount,
        completedAt: session.completedAt || session.updatedAt,
      },
      conversationLog: session.conversationLog || [],
      items,
    });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// ── POST /api/v1/viva/session/:sessionId/complete (Auth required) ────────────
export const completeSession = async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user._id;
  const { conversationLog = [], status = "completed" } = req.body;

  try {
    const session = await VivaSession.findOne({ _id: sessionId, userId });
    if (!session) return fail(res, 404, "Viva session not found");

    if (Array.isArray(conversationLog) && conversationLog.length > 0) {
      session.conversationLog = conversationLog.map((m) => ({
        speaker: m.speaker === "student" ? "student" : "elena",
        text: String(m.text || ""),
        kind: m.kind || "system",
        score: typeof m.score === "number" ? m.score : null,
        timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
      }));
    }

    if (status === "declined") {
      session.status = "declined";
    } else {
      session.status = "completed";
      session.completedAt = session.completedAt || new Date();
      if (!session.rating && session.evaluations.length > 0) {
        const { rating, ratingLabel } = computeRating(session.overallScore);
        session.rating = rating;
        session.ratingLabel = ratingLabel;
      }
    }

    await session.save();
    return res.json({
      success: true,
      status: session.status,
      overallScore: session.overallScore,
      rating: session.rating,
      ratingLabel: session.ratingLabel,
    });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// ── GET /api/v1/viva/history (Auth required) ─────────────────────────────────
export const getHistory = async (req, res) => {
  try {
    const sessions = await VivaSession.find({
      userId: req.user._id,
      status: "completed",
    })
      .sort({ completedAt: -1 })
      .limit(15)
      .select("-questions -evaluations -conversationLog")
      .lean();

    return res.json({ success: true, sessions });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// ── GET /api/v1/viva/stats (Auth required) ───────────────────────────────────
export const getStats = async (req, res) => {
  try {
    const completed = await VivaSession.find({
      userId: req.user._id,
      status: "completed",
    }).lean();

    const totalSessions = completed.length;
    const avgScore =
      totalSessions > 0
        ? Math.round(completed.reduce((acc, s) => acc + (s.overallScore || 0), 0) / totalSessions)
        : 0;

    return res.json({
      success: true,
      totalSessions,
      avgScore,
    });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};
