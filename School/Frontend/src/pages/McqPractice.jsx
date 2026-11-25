// pages/McqPractice.jsx
// Full MCQ engine — setup → question loop → results screen
// Features: 3D perspective card transitions, tactile 3D action buttons (Previous on Left, Next/Confirm on Right),
// right pop-in badges, 3s auto-advance countdown with pause controls, interactive mistake review modal, and past history.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  FiArrowLeft, FiArrowRight, FiCheckCircle, FiXCircle, FiZap,
  FiClock, FiBookOpen, FiAward, FiRotateCcw, FiInfo, FiChevronDown,
  FiFilter, FiX, FiPause, FiPlay, FiList, FiEye, FiAlertCircle,
  FiChevronLeft, FiChevronRight
} from "react-icons/fi";
import { Eyebrow, Accent } from "../components/ui/Brandmarks";
import {
  fetchSubjects,
  fetchChapters,
  startMcqSession,
  submitMcqAnswer,
  getMcqResult,
  getMcqHistory
} from "../utils/practiceApi";
import "../styles/practice-studio.css";

const hasAuth = () =>
  Boolean(localStorage.getItem("kanthastSchoolToken") && localStorage.getItem("kanthastSchoolUser"));

const LETTERS = ["A", "B", "C", "D"];
const DIFF_LABELS = { 1: "Easy", 2: "Medium", 3: "Hard" };
const DIFF_CLASSES = { 1: "diff-easy", 2: "diff-medium", 3: "diff-hard" };
const COUNT_OPTIONS = [5, 10, 15, 20];

// ── 3D Card Transition Variants ───────────────────────────────────────────────
const cardVariants = {
  enter: (dir) => ({
    x: dir > 0 ? 120 : -120,
    rotateY: dir > 0 ? 16 : -16,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    rotateY: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 320,
      damping: 26,
    },
  },
  exit: (dir) => ({
    x: dir > 0 ? -120 : 120,
    rotateY: dir > 0 ? -16 : 16,
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.22,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

// ── Utility: score ring SVG ───────────────────────────────────────────────────
function ScoreRing({ score, size = 120 }) {
  const r = 48;
  const C = 2 * Math.PI * r;
  const offset = C * (1 - score / 100);
  const color =
    score >= 80 ? "rgb(var(--positive))" :
    score >= 50 ? "rgb(var(--caution))" :
    "rgb(var(--critical))";

  return (
    <svg width={size} height={size} viewBox="0 0 110 110" aria-hidden="true">
      <circle className="score-ring-track" cx="55" cy="55" r={r} />
      <Motion.circle
        className="score-ring-fill"
        cx="55" cy="55" r={r}
        stroke={color}
        strokeDasharray={C}
        initial={{ strokeDashoffset: C }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "55px 55px" }}
      />
      <text
        x="55" y="58"
        textAnchor="middle"
        fontSize="20"
        fontWeight="800"
        fontFamily="inherit"
        fill={color}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {score}%
      </text>
    </svg>
  );
}

// ── Streak badge ──────────────────────────────────────────────────────────────
function StreakBadge({ streak }) {
  if (streak < 2) return null;
  return (
    <Motion.div
      key={streak}
      className="streak-pop inline-flex items-center gap-1 bg-caution-soft text-caution border border-caution/30 rounded-full px-3 py-1 text-mini font-bold"
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.4 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      🔥 {streak} in a row!
    </Motion.div>
  );
}

// ── Option Card with Right Pop-in Badge ────────────────────────────────────────
function OptionCard({ letter, text, state, onClick, disabled }) {
  const isCorrect = state === "correct" || state === "correct-unselected";
  const isIncorrect = state === "incorrect";

  return (
    <button
      className="mcq-option w-full text-left relative flex items-center justify-between"
      data-state={state || undefined}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled && !state}
      aria-pressed={state === "selected"}
      aria-label={`Option ${letter}: ${text}`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
        <span className="mcq-letter flex-shrink-0 mt-0.5" aria-hidden="true">{letter}</span>
        <span className="text-sm leading-snug text-ink">{text}</span>
      </div>

      {/* Pop-in badges from the right side */}
      {isCorrect && (
        <span className="correct-pop-badge flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-positive/15 text-positive text-mini font-bold border border-positive/30 shadow-sm">
          <FiCheckCircle size={14} /> Correct
        </span>
      )}

      {isIncorrect && (
        <span className="correct-pop-badge flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-critical/15 text-critical text-mini font-bold border border-critical/30 shadow-sm">
          <FiXCircle size={14} /> Your answer
        </span>
      )}
    </button>
  );
}

// ── Explanation Panel with Auto-advance Progress ──────────────────────────────
function ExplanationPanel({ feedback, shuffleSeed, autoAdvanceSeconds, isPaused, onTogglePause, onHoverPause }) {
  if (!feedback) return null;

  const correctShuffledIndex = shuffleSeed
    ? shuffleSeed.indexOf(feedback.correctIndex)
    : feedback.correctIndex;
  const correctLetter = LETTERS[correctShuffledIndex] || "?";

  return (
    <AnimatePresence>
      <Motion.div
        className="explanation-card mt-4 overflow-hidden relative"
        style={{ background: feedback.isCorrect ? "rgb(var(--positive-soft))" : "rgb(var(--critical-soft))" }}
        initial={{ opacity: 0, y: 14, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: 14, height: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onMouseEnter={() => onHoverPause?.(true)}
      >
        {/* Countdown header bar */}
        {autoAdvanceSeconds != null && (
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-line/40">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span className="text-micro font-bold tracking-wide">
                {isPaused
                  ? "Auto-advance paused — read at your own pace"
                  : `Next question in ${autoAdvanceSeconds}s…`}
              </span>
            </div>
            <button
              type="button"
              onClick={onTogglePause}
              className="text-micro font-bold px-2 py-0.5 rounded-md border border-current/30 hover:bg-current/10 transition flex items-center gap-1"
            >
              {isPaused ? <><FiPlay size={10} /> Resume</> : <><FiPause size={10} /> Pause</>}
            </button>
          </div>
        )}

        {/* Verdict line */}
        <div className="flex items-center gap-2 mb-2.5">
          {feedback.isCorrect
            ? <FiCheckCircle className="text-positive flex-shrink-0" size={18} />
            : <FiXCircle className="text-critical flex-shrink-0" size={18} />
          }
          <span className={`text-sm font-bold ${feedback.isCorrect ? "text-positive" : "text-critical"}`}>
            {feedback.isCorrect
              ? "Correct! Well done."
              : `The correct answer is Option ${correctLetter}: ${feedback.correctText}`}
          </span>
        </div>

        {/* Distractor note */}
        {!feedback.isCorrect && feedback.distractorNote && (
          <div className="mb-2.5 p-2 rounded-lg bg-critical/10 border border-critical/20">
            <p className="text-mini text-ink-muted leading-relaxed">
              <strong className="text-critical font-semibold">Traps to avoid: </strong>
              {feedback.distractorNote}
            </p>
          </div>
        )}

        {/* Main explanation */}
        <div className="flex gap-2">
          <FiInfo className="text-ink-subtle flex-shrink-0 mt-0.5" size={14} />
          <p className="text-sm text-ink-muted leading-relaxed">{feedback.explanation}</p>
        </div>

        {/* Key concept pill */}
        {feedback.keyConcept && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-brand-soft text-brand rounded-full px-3 py-1 text-mini font-semibold">
            <FiZap size={11} /> {feedback.keyConcept}
          </div>
        )}
      </Motion.div>
    </AnimatePresence>
  );
}

// ── Enhanced Question Review Modal ────────────────────────────────────────────
function ReviewModal({ review = [], initialFilter = "incorrect", onClose, subjectTitle = "" }) {
  const [filter, setFilter] = useState(initialFilter);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const correctItems = review.filter((r) => r.isCorrect);
  const incorrectItems = review.filter((r) => !r.isCorrect);

  const displayedItems =
    filter === "correct" ? correctItems :
    filter === "incorrect" ? incorrectItems :
    review;

  return (
    <div className="review-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-line/80 bg-surface flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-soft text-brand text-mini font-bold mb-1.5">
              <FiBookOpen size={12} /> {subjectTitle || "Practice Test"} Review
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold font-display text-ink tracking-tight">
              Review Your Answers
            </h2>
            <p className="text-xs md:text-sm text-ink-muted mt-0.5">
              Analyze where you excelled and review trap distractors to master every concept.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-line bg-surface-sunken hover:bg-surface text-ink-subtle hover:text-ink transition flex items-center justify-center flex-shrink-0 shadow-sm"
            aria-label="Close modal"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Segmented Filter Control */}
        <div className="px-6 py-3.5 border-b border-line/80 bg-surface-sunken/40 flex items-center justify-between gap-3">
          <div className="inline-flex p-1 rounded-xl bg-surface-sunken border border-line/80 gap-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilter("incorrect")}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                filter === "incorrect"
                  ? "bg-surface text-critical shadow-sm border border-line/60"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-critical" />
              Mistakes ({incorrectItems.length})
            </button>

            <button
              type="button"
              onClick={() => setFilter("correct")}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                filter === "correct"
                  ? "bg-surface text-positive shadow-sm border border-line/60"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-positive" />
              Correct ({correctItems.length})
            </button>

            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                filter === "all"
                  ? "bg-surface text-ink shadow-sm border border-line/60"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              All ({review.length})
            </button>
          </div>

          <span className="text-micro font-semibold text-ink-subtle hidden sm:block">
            {displayedItems.length} question{displayedItems.length === 1 ? "" : "s"} shown
          </span>
        </div>

        {/* Question List */}
        <div className="review-modal-scroll overflow-y-auto px-6 py-5 space-y-5 flex-1">
          {displayedItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-full bg-positive-soft text-positive mx-auto flex items-center justify-center mb-3">
                <FiCheckCircle size={24} />
              </div>
              <p className="text-base font-bold text-ink mb-1">
                {filter === "incorrect" ? "Zero mistakes found!" : "No questions in this section."}
              </p>
              <p className="text-xs text-ink-muted max-w-xs mx-auto">
                {filter === "incorrect"
                  ? "Outstanding job! You answered every question correctly in this test."
                  : "Switch tabs above to view other questions."}
              </p>
            </div>
          ) : (
            displayedItems.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-line bg-surface shadow-sm p-5 md:p-6 transition hover:border-line-strong space-y-4"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-line/60">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-surface-sunken border border-line text-ink font-mono">
                      Q{item.index || idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-ink-muted truncate max-w-[200px] sm:max-w-xs">
                      {item.chapterTitle || item.subject}
                    </span>
                  </div>

                  {item.isCorrect ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-positive-soft text-positive border border-positive/30">
                      <FiCheckCircle size={14} /> Correct
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-critical-soft text-critical border border-critical/30">
                      <FiXCircle size={14} /> Incorrect
                    </span>
                  )}
                </div>

                {/* Question Stem */}
                <h4 className="text-base font-bold text-ink leading-snug">
                  {item.stem}
                </h4>

                {/* Answer Comparison */}
                <div className="space-y-2.5">
                  {!item.isCorrect ? (
                    <>
                      {/* What user selected */}
                      <div className="rounded-xl border border-critical/30 bg-critical-soft/30 p-3.5 space-y-2">
                        <div className="flex items-start gap-2.5">
                          <FiXCircle className="text-critical flex-shrink-0 mt-0.5" size={16} />
                          <div className="flex-1 min-w-0">
                            <p className="text-micro font-bold uppercase tracking-wide text-critical mb-0.5">
                              Your answer
                            </p>
                            <p className="text-sm font-semibold text-ink leading-snug line-through opacity-85">
                              {item.chosenText}
                            </p>
                          </div>
                        </div>

                        {/* Trap distractor note */}
                        {item.distractorNote && (
                          <div className="pt-2 border-t border-critical/20 flex items-start gap-2 text-xs text-ink-muted">
                            <FiAlertCircle size={14} className="text-caution flex-shrink-0 mt-0.5" />
                            <p className="leading-relaxed">
                              <strong className="text-ink font-semibold">Common Trap: </strong>
                              {item.distractorNote}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Correct answer */}
                      <div className="rounded-xl border border-positive/30 bg-positive-soft/30 p-3.5 flex items-start gap-2.5">
                        <FiCheckCircle className="text-positive flex-shrink-0 mt-0.5" size={16} />
                        <div className="flex-1 min-w-0">
                          <p className="text-micro font-bold uppercase tracking-wide text-positive mb-0.5">
                            Correct answer
                          </p>
                          <p className="text-sm font-bold text-ink leading-snug">
                            {item.correctText}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* When user got it correct */
                    <div className="rounded-xl border border-positive/30 bg-positive-soft/20 p-3.5 flex items-start gap-2.5">
                      <FiCheckCircle className="text-positive flex-shrink-0 mt-0.5" size={16} />
                      <div className="flex-1 min-w-0">
                        <p className="text-micro font-bold uppercase tracking-wide text-positive mb-0.5">
                          You answered correctly
                        </p>
                        <p className="text-sm font-bold text-ink leading-snug">
                          {item.correctText}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Explanation Drawer */}
                {item.explanation && (
                  <div className="rounded-xl bg-surface-sunken/60 border border-line/70 p-4 space-y-2">
                    <p className="text-micro font-bold uppercase tracking-wider text-ink-subtle flex items-center gap-1.5">
                      <FiInfo size={12} className="text-brand" /> Detailed Explanation
                    </p>
                    <p className="text-sm text-ink-muted leading-relaxed">
                      {item.explanation}
                    </p>
                    {item.keyConcept && (
                      <div className="pt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-soft text-brand text-xs font-bold">
                          <FiZap size={11} /> {item.keyConcept}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-line/80 bg-surface flex items-center justify-between gap-4">
          <p className="text-xs text-ink-subtle hidden sm:block">
            Tip: Reviewing mistakes immediately after practice boosts long-term recall by up to 40%.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="btn-3d btn-3d-secondary text-xs py-2 px-5 ml-auto"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Results Screen with Clickable Stat Cards ──────────────────────────────────
function ResultsScreen({ result, onRestart, subject }) {
  const [reviewFilter, setReviewFilter] = useState(null);

  if (!result) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="inline-block animate-spin w-8 h-8 border-3 border-brand border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-semibold text-ink-muted">Calculating your score…</p>
      </div>
    );
  }

  const { score, correctCount, totalQuestions, timeTakenMs, review = [] } = result;
  const incorrectCount = totalQuestions - correctCount;
  const minutes = timeTakenMs ? Math.floor(timeTakenMs / 60000) : null;
  const seconds = timeTakenMs ? Math.round((timeTakenMs % 60000) / 1000) : null;

  const verdict =
    score >= 80 ? { text: "Excellent work!", color: "text-positive", emoji: "🏆" } :
    score >= 60 ? { text: "Good effort!", color: "text-caution", emoji: "👍" } :
    { text: "Keep practising!", color: "text-critical", emoji: "💪" };

  return (
    <>
      <Motion.div
        className="max-w-lg mx-auto text-center py-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="text-5xl mb-3">{verdict.emoji}</div>
        <h2 className="text-2xl font-extrabold font-display text-ink mb-1">{verdict.text}</h2>
        <p className="text-ink-muted mb-6">{subject} practice session complete</p>

        {/* Score ring */}
        <div className="flex justify-center mb-6">
          <ScoreRing score={score} size={140} />
        </div>

        {/* Clickable Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          {/* Correct Button Card */}
          <button
            type="button"
            onClick={() => setReviewFilter("correct")}
            className="clickable-stat-card rounded-card border border-positive/40 bg-surface p-3.5 text-center group"
            title="Click to review correct questions"
          >
            <p className="text-2xl font-extrabold font-display text-positive tabular-nums">{correctCount}</p>
            <p className="text-mini font-semibold text-positive mt-0.5 flex items-center justify-center gap-1">
              Correct <FiArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
            </p>
          </button>

          {/* Incorrect Button Card */}
          <button
            type="button"
            onClick={() => setReviewFilter("incorrect")}
            className="clickable-stat-card rounded-card border border-critical/40 bg-surface p-3.5 text-center group"
            title="Click to review mistakes"
          >
            <p className="text-2xl font-extrabold font-display text-critical tabular-nums">{incorrectCount}</p>
            <p className="text-mini font-semibold text-critical mt-0.5 flex items-center justify-center gap-1">
              Incorrect <FiArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
            </p>
          </button>

          {/* Time Taken Card */}
          <div className="rounded-card border border-line bg-surface p-3.5 text-center">
            <p className="text-2xl font-extrabold font-display text-ink tabular-nums">
              {minutes != null ? `${minutes}:${String(seconds).padStart(2, "0")}` : "—"}
            </p>
            <p className="text-mini text-ink-subtle mt-0.5">Time taken</p>
          </div>
        </div>

        <p className="text-micro text-ink-subtle mb-8 flex items-center justify-center gap-1">
          <FiEye size={12} /> Tap <strong>Correct</strong> or <strong>Incorrect</strong> above to review questions
        </p>

        {/* Actions with 3D tactile buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={onRestart} className="btn-3d btn-3d-primary flex items-center gap-2">
            <FiRotateCcw size={16} /> Practice again
          </button>
          <button
            onClick={() => setReviewFilter("all")}
            className="btn-3d btn-3d-secondary flex items-center gap-2"
          >
            <FiList size={16} /> Review all questions
          </button>
          <Link to="/practice" className="btn-secondary flex items-center gap-2 justify-center">
            <FiArrowLeft size={16} /> Studio
          </Link>
        </div>
      </Motion.div>

      {/* Review Modal popup */}
      {reviewFilter && (
        <ReviewModal
          review={review}
          initialFilter={reviewFilter}
          onClose={() => setReviewFilter(null)}
          subjectTitle={subject}
        />
      )}
    </>
  );
}

// ── Session Picker with History ───────────────────────────────────────────────
function SessionPicker({ onStart, loading: starting }) {
  const [selectedClass, setSelectedClass] = useState("10");
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  const [subject, setSubject] = useState("");
  const [chapterNo, setChapterNo] = useState("");
  const [mode, setMode] = useState("practice");
  const [difficulty, setDifficulty] = useState("mixed");
  const [count, setCount] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  // Recent MCQ attempts history
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyReview, setHistoryReview] = useState(null);
  const [loadingReviewId, setLoadingReviewId] = useState(null);

  const loadSubjects = useCallback((cls = "10") => {
    setLoadingSubjects(true);
    fetchSubjects(cls)
      .then((d) => {
        const subs = d.subjects || [];
        setSubjects(subs);
        if (subs.length) {
          setSubject((curr) => {
            const exists = subs.some((s) => s.subject === curr);
            return exists ? curr : subs[0].subject;
          });
        } else {
          setSubject("");
        }
      })
      .catch(() => {
        setSubjects([]);
      })
      .finally(() => setLoadingSubjects(false));
  }, []);

  useEffect(() => {
    loadSubjects(selectedClass);
  }, [selectedClass, loadSubjects]);

  useEffect(() => {
    setLoadingHistory(true);
    getMcqHistory()
      .then((d) => setHistory(d.sessions || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    if (!subject) return;
    setChapterNo("");
    setChapters([]);
    fetchChapters(subject, selectedClass)
      .then((d) => setChapters(d.chapters || []))
      .catch(() => {});
  }, [subject, selectedClass]);

  const handleStart = () => {
    if (!subject) return;
    onStart({
      class: selectedClass,
      subject,
      chapterNo: chapterNo || undefined,
      mode,
      difficulty,
      count,
    });
  };

  const handleOpenPastReview = async (pastSessionId) => {
    setLoadingReviewId(pastSessionId);
    try {
      const data = await getMcqResult(pastSessionId);
      if (data?.session?.review) {
        setHistoryReview(data.session);
      }
    } catch {
      alert("Could not load past review details.");
    } finally {
      setLoadingReviewId(null);
    }
  };

  const selectedSubjectInfo = subjects.find((s) => s.subject === subject);

  return (
    <Motion.div
      className="max-w-lg mx-auto py-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-6">
        <Link to="/practice" className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-ink transition-colors">
          <FiArrowLeft size={14} /> Practice Studio
        </Link>
        <div className="mt-4">
          <Eyebrow icon={FiZap}>Active Recall</Eyebrow>
          <h1 className="text-3xl font-extrabold font-display text-ink tracking-tight mt-2">
            MCQ <Accent after=".">Practice</Accent>
          </h1>
          <p className="text-sm text-ink-muted mt-1.5">
            One question at a time, with instant feedback and mistake review.
          </p>
        </div>
      </div>

      <div className="ps-card p-6 space-y-5">
        {/* Class selector dropdown */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">Class</label>
            <span className="text-micro font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full bg-brand-soft text-brand">
              Class X Live
            </span>
          </div>
          <div className="relative">
            <select
              className="field appearance-none pr-10 cursor-pointer font-medium"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="10">Class 10 (Available)</option>
              <option value="9" disabled>Class 9 (Coming soon)</option>
              <option value="11" disabled>Class 11 (Coming soon)</option>
              <option value="12" disabled>Class 12 (Coming soon)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-ink-subtle">
              <FiChevronDown size={16} />
            </div>
          </div>
          <p className="text-micro text-ink-subtle mt-1.5">
            Only Class X questions are available currently. All students can practice this material.
          </p>
        </div>

        {/* Subject picker */}
        <div>
          <label className="label">Subject</label>
          {loadingSubjects ? (
            <div className="h-11 rounded-control bg-surface-sunken animate-pulse" />
          ) : subjects.length === 0 ? (
            <div className="rounded-control border border-line bg-surface-sunken p-4 text-center">
              <p className="text-sm text-ink-muted mb-2">No subjects loaded yet.</p>
              <button
                type="button"
                onClick={() => loadSubjects(selectedClass)}
                className="btn-secondary text-sm py-1.5 px-3"
              >
                Reload questions
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {subjects.map((s) => (
                <button
                  key={s.subject}
                  onClick={() => setSubject(s.subject)}
                  className={`flex flex-col items-start p-3 rounded-control border text-left transition-colors duration-fast ${
                    subject === s.subject
                      ? "border-brand bg-brand-soft"
                      : "border-line bg-surface-sunken hover:border-brand/50"
                  }`}
                >
                  <span className="text-sm font-semibold text-ink leading-snug">{s.subject}</span>
                  <span className="text-micro text-ink-subtle mt-0.5">
                    {s.questionCount} questions
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chapter picker (optional) */}
        {chapters.length > 0 && (
          <div>
            <label className="label">Chapter (optional — leave blank for all)</label>
            <select
              className="field"
              value={chapterNo}
              onChange={(e) => setChapterNo(e.target.value)}
            >
              <option value="">All chapters ({selectedSubjectInfo?.questionCount || "?"} questions)</option>
              {chapters.map((c) => (
                <option key={c.chapterNo} value={c.chapterNo}>
                  Ch {c.chapterNo}: {c.chapterTitle} ({c.questionCount}Q)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Advanced filters toggle */}
        <div>
          <button
            onClick={() => setShowFilters((p) => !p)}
            className="flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink transition"
          >
            <FiFilter size={14} />
            Advanced options
            <FiChevronDown
              size={14}
              className={`transition-transform duration-fast ${showFilters ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {showFilters && (
              <Motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="pt-4 space-y-4"
              >
                <div>
                  <label className="label">Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setMode("practice")}
                      className={`p-3 rounded-control border text-left transition-colors duration-fast ${
                        mode === "practice"
                          ? "border-brand bg-brand-soft"
                          : "border-line bg-surface-sunken"
                      }`}
                    >
                      <p className="text-sm font-semibold text-ink">Practice</p>
                      <p className="text-micro text-ink-subtle mt-0.5">Instant feedback & explanations</p>
                    </button>
                    <button
                      onClick={() => setMode("test")}
                      className={`p-3 rounded-control border text-left transition-colors duration-fast ${
                        mode === "test"
                          ? "border-brand bg-brand-soft"
                          : "border-line bg-surface-sunken"
                      }`}
                    >
                      <p className="text-sm font-semibold text-ink">Exam mode</p>
                      <p className="text-micro text-ink-subtle mt-0.5">Results only at the end</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Difficulty</label>
                  <div className="flex gap-2">
                    {["mixed", "easy", "medium", "hard"].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-2 rounded-control text-sm font-semibold capitalize transition-colors duration-fast border ${
                          difficulty === d
                            ? "border-brand bg-brand-soft text-brand"
                            : "border-line bg-surface-sunken text-ink-muted hover:border-brand/50"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Number of questions</label>
                  <div className="flex gap-2">
                    {COUNT_OPTIONS.map((n) => (
                      <button
                        key={n}
                        onClick={() => setCount(n)}
                        className={`flex-1 py-2 rounded-control text-sm font-bold tabular-nums transition-colors duration-fast border ${
                          count === n
                            ? "border-brand bg-brand-soft text-brand"
                            : "border-line bg-surface-sunken text-ink-muted hover:border-brand/50"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3D Start Button */}
        <button
          className="btn-3d btn-3d-primary w-full"
          onClick={handleStart}
          disabled={!subject || starting}
        >
          {starting ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading questions…
            </span>
          ) : (
            <span className="flex items-center gap-2 justify-center">
              <FiZap size={16} /> Start {count} questions
            </span>
          )}
        </button>
      </div>

      {/* ── Recent MCQ Attempts History Section ──────────────────────────────── */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-base font-bold font-display text-ink flex items-center gap-2">
            <FiClock size={16} className="text-brand" /> Recent MCQ Attempts
          </h2>
          {history.length > 0 && (
            <span className="text-micro font-semibold text-ink-subtle">
              {history.length} completed
            </span>
          )}
        </div>

        {loadingHistory ? (
          <div className="rounded-card border border-line bg-surface p-6 text-center">
            <div className="inline-block animate-spin w-5 h-5 border-2 border-brand border-t-transparent rounded-full mb-2" />
            <p className="text-xs text-ink-muted">Loading your past attempts…</p>
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-card border border-line bg-surface p-6 text-center">
            <p className="text-sm font-semibold text-ink mb-1">No practice attempts yet</p>
            <p className="text-xs text-ink-muted max-w-xs mx-auto">
              Choose your subject above and start your first test. Your scores and reviews will be saved here.
            </p>
          </div>
        ) : (
          <div className="rounded-card border border-line bg-surface shadow-e1 divide-y divide-line overflow-hidden">
            {history.slice(0, 6).map((session) => {
              const scorePct = session.score ?? 0;
              const isGood = scorePct >= 70;
              const dateStr = session.completedAt
                ? new Date(session.completedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—";

              return (
                <div key={session._id} className="p-4 flex items-center justify-between gap-3 hover:bg-surface-sunken/40 transition">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink truncate">{session.subject}</span>
                      <span className={`text-micro font-bold px-2 py-0.5 rounded-full ${
                        isGood ? "bg-positive-soft text-positive" : "bg-critical-soft text-critical"
                      }`}>
                        {scorePct}%
                      </span>
                    </div>
                    <p className="text-micro text-ink-subtle mt-0.5">
                      {session.correctCount}/{session.totalQuestions} correct
                      {session.chapterNo ? ` · Ch ${session.chapterNo}` : ""} · {dateStr}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenPastReview(session._id)}
                    disabled={loadingReviewId === session._id}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 flex-shrink-0"
                  >
                    {loadingReviewId === session._id ? (
                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiEye size={13} />
                    )}
                    Review
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Review Modal */}
      {historyReview && (
        <ReviewModal
          review={historyReview.review || []}
          initialFilter="all"
          onClose={() => setHistoryReview(null)}
          subjectTitle={historyReview.subject}
        />
      )}
    </Motion.div>
  );
}

// ── Question Screen with 3D Transitions & Bilateral Buttons ───────────────────
function QuestionScreen({
  question,
  questionIndex,
  totalQuestions,
  sessionId,
  mode,
  savedAnswer,
  direction,
  onAnswerRecord,
  onAdvance,
  onPrevious,
  onComplete,
}) {
  const [selected, setSelected] = useState(savedAnswer ? savedAnswer.chosenIndex : null);
  const [feedback, setFeedback] = useState(savedAnswer ? savedAnswer.feedback : null);
  const [submitting, setSubmitting] = useState(false);
  const [streak, setStreak] = useState(0);
  const [shake, setShake] = useState(false);

  // 3-second auto-advance timer states
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const startTimeRef = useRef(Date.now());
  const questionKey = `${sessionId}-${questionIndex}`;

  // Sync state when questionIndex or question changes
  useEffect(() => {
    if (savedAnswer) {
      setSelected(savedAnswer.chosenIndex);
      setFeedback(savedAnswer.feedback);
      setAutoAdvanceSeconds(null);
      setIsPaused(false);
    } else {
      setSelected(null);
      setFeedback(null);
      setAutoAdvanceSeconds(null);
      setIsPaused(false);
      startTimeRef.current = Date.now();
    }
    setShake(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [question?.id, questionIndex, savedAnswer]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle pause / resume
  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setAutoAdvanceSeconds((prev) => {
          if (prev == null) return null;
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleNext();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleHoverPause = () => {
    if (!isPaused && autoAdvanceSeconds != null && autoAdvanceSeconds > 0) {
      togglePause();
    }
  };

  // Keyboard shortcuts: 1-4 to select, ArrowLeft for prev, Enter/Space/ArrowRight for next
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft" && questionIndex > 0) {
        e.preventDefault();
        onPrevious();
        return;
      }
      if (feedback) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
          e.preventDefault();
          handleNext();
        }
        return;
      }
      const idx = ["1", "2", "3", "4"].indexOf(e.key);
      if (idx !== -1 && !isAnswered) {
        e.preventDefault();
        setSelected(idx);
      }
      if ((e.key === "Enter" || e.key === " ") && selected !== null && !isAnswered) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, feedback, questionIndex]); // eslint-disable-line

  const handleSubmit = async () => {
    if (selected === null || submitting) return;
    setSubmitting(true);
    const responseMs = Date.now() - startTimeRef.current;
    try {
      const result = await submitMcqAnswer(sessionId, {
        questionIndex,
        shuffleSeed: question.shuffleSeed,
        chosenShuffledIndex: selected,
        responseMs,
      });

      if (mode === "practice") {
        setFeedback(result.feedback);
        // Start 3-second auto-advance countdown
        setAutoAdvanceSeconds(3);
        setIsPaused(false);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setAutoAdvanceSeconds((prev) => {
            if (prev == null) return null;
            if (prev <= 1) {
              clearInterval(timerRef.current);
              handleNext();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

      // Update streak
      if (result.feedback.isCorrect) {
        setStreak((s) => s + 1);
      } else {
        setStreak(0);
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }

      if (result.isLast) {
        if (mode !== "practice") {
          onComplete(result.feedback);
        }
      }

      onAnswerRecord({
        index: questionIndex,
        chosenIndex: selected,
        feedback: result.feedback,
        isCorrect: result.feedback.isCorrect,
        isLast: result.isLast,
        nextQuestion: result.nextQuestion,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onAdvance();
  };

  const isAnswered = feedback !== null;
  const progress = ((questionIndex + 1) / totalQuestions) * 100;

  // Determine option states
  const getOptionState = (i) => {
    if (!isAnswered) {
      return selected === i ? "selected" : null;
    }
    const originalI = question.shuffleSeed ? question.shuffleSeed[i] : i;
    if (originalI === feedback.correctIndex) {
      return i === selected ? "correct" : "correct-unselected";
    }
    if (i === selected) return "incorrect";
    return "locked";
  };

  const diffLabel = DIFF_LABELS[question.difficulty] || "";
  const diffClass = DIFF_CLASSES[question.difficulty] || "";

  return (
    <div className="w-full flex items-center justify-center gap-2 sm:gap-4 md:gap-5 flex-1 my-auto py-1">
      {/* ── Left Arrow Button (Vertically Centered to Question Container) ── */}
      <div className="flex-shrink-0 flex items-center justify-center">
        <button
          type="button"
          onClick={onPrevious}
          disabled={questionIndex === 0}
          className="flank-arrow-btn flank-arrow-left group"
          title={questionIndex > 0 ? "Previous question (← ArrowLeft)" : "First question"}
          aria-label="Previous question"
        >
          <FiChevronLeft size={24} className="translate-x-[-1px] group-hover:-translate-x-1 transition-transform duration-200" />
        </button>
      </div>

      {/* ── Center: Question Container ── */}
      <div className="flex-1 max-w-4xl min-w-0 perspective-container w-full">
        <AnimatePresence mode="wait" custom={direction}>
          <Motion.div
            key={questionKey}
            custom={direction}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Progress bar */}
            <div className="mb-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs sm:text-sm font-semibold text-ink-muted tabular-nums">
                  Question {questionIndex + 1} of {totalQuestions}
                </span>
                <div className="flex items-center gap-2">
                  <AnimatePresence mode="wait">
                    {streak >= 2 && <StreakBadge key={streak} streak={streak} />}
                  </AnimatePresence>
                  {diffLabel && (
                    <span className={`text-micro font-semibold uppercase tracking-[0.1em] ${diffClass}`}>
                      {diffLabel}
                    </span>
                  )}
                </div>
              </div>
              <div className="practice-progress-bar h-1.5 rounded-full overflow-hidden">
                <Motion.div
                  className="practice-progress-fill"
                  initial={{ width: `${((questionIndex) / totalQuestions) * 100}%` }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 mb-2.5">
              <FiBookOpen size={14} className="text-ink-subtle" />
              <span className="text-xs text-ink-subtle font-medium">
                {question.subject} · {question.chapterTitle}
                {question.topicTitle ? ` · ${question.topicTitle}` : ""}
              </span>
            </div>

            {/* Question stem */}
            <div className={`rounded-xl border border-line bg-surface shadow-e1 p-4.5 sm:p-5.5 mb-3.5 ${shake ? "mcq-shake" : ""}`}>
              <p className="text-base sm:text-lg font-bold font-display text-ink leading-relaxed">{question.stem}</p>
            </div>

            {/* Keyboard hint */}
            <p className="text-xs text-ink-subtle mb-2 text-right hidden md:block">
              Press <kbd className="px-1.5 py-0.5 rounded bg-surface-sunken border border-line font-mono text-xs">1</kbd>
              –<kbd className="px-1.5 py-0.5 rounded bg-surface-sunken border border-line font-mono text-xs">4</kbd> to select,
              <kbd className="ml-1 px-1.5 py-0.5 rounded bg-surface-sunken border border-line font-mono text-xs">Enter</kbd> or right arrow to proceed
            </p>

            {/* Options in Responsive 2-column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
              {question.options.map((opt, i) => (
                <OptionCard
                  key={i}
                  letter={LETTERS[i]}
                  text={opt.text}
                  state={getOptionState(i)}
                  onClick={() => !isAnswered && setSelected(i)}
                  disabled={isAnswered}
                />
              ))}
            </div>

            {/* Explanation with 3-second auto-advance */}
            {mode === "practice" && feedback && (
              <ExplanationPanel
                feedback={feedback}
                shuffleSeed={question.shuffleSeed}
                autoAdvanceSeconds={autoAdvanceSeconds}
                isPaused={isPaused}
                onTogglePause={togglePause}
                onHoverPause={handleHoverPause}
              />
            )}

            {/* In-card Action for Confirming Answer */}
            {!isAnswered && (
              <div className="mt-6 flex items-center justify-between pt-3 border-t border-line/40">
                <span className="text-micro text-ink-subtle hidden sm:block">
                  {selected !== null ? "Click right arrow or press Enter" : "Pick an option to continue"}
                </span>
                <button
                  type="button"
                  className="btn-3d btn-3d-primary ml-auto text-xs py-2 px-4"
                  onClick={handleSubmit}
                  disabled={selected === null || submitting}
                >
                  {submitting ? "Checking…" : "Confirm answer"}
                </button>
              </div>
            )}
          </Motion.div>
        </AnimatePresence>
      </div>

      {/* ── Right Arrow Button (Vertically Centered to Question Container) ── */}
      <div className="flex-shrink-0 flex items-center justify-center">
        <button
          type="button"
          onClick={isAnswered ? handleNext : handleSubmit}
          disabled={!isAnswered && (selected === null || submitting)}
          className={`flank-arrow-btn flank-arrow-right group ${
            isAnswered || selected !== null ? "flank-arrow-active" : ""
          }`}
          title={
            isAnswered
              ? questionIndex + 1 < totalQuestions
                ? "Next question (→ ArrowRight)"
                : "See results"
              : selected !== null
              ? "Confirm answer (Enter)"
              : "Select an option first"
          }
          aria-label={isAnswered ? "Next question" : "Confirm answer"}
        >
          <FiChevronRight size={28} className="translate-x-[1px] group-hover:translate-x-1 transition-transform duration-200" />
        </button>
      </div>
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function McqPractice() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("setup"); // setup | active | results
  const [sessionId, setSessionId] = useState(null);

  // Array of questions and answers for bi-directional navigation
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = next, -1 = prev

  const [totalQuestions, setTotalQuestions] = useState(0);
  const [sessionConfig, setSessionConfig] = useState({});
  const [starting, setStarting] = useState(false);
  const [result, setResult] = useState(null);
  const pendingResultRef = useRef(null);

  useEffect(() => {
    if (!hasAuth()) { navigate("/login", { replace: true }); }
  }, [navigate]);

  // Fetch real session result from server when entering results screen
  useEffect(() => {
    if (phase === "results" && sessionId) {
      getMcqResult(sessionId)
        .then((data) => {
          if (data?.session) {
            setResult(data.session);
          }
        })
        .catch(() => {});
    }
  }, [phase, sessionId]);

  const handleStart = async (config) => {
    setStarting(true);
    try {
      const data = await startMcqSession({ schoolClass: config.class || "10", ...config });
      setSessionId(data.sessionId);
      setQuestions([data.question]);
      setAnswers([]);
      setCurrentIndex(0);
      setDirection(1);
      setTotalQuestions(data.totalQuestions);
      setSessionConfig(config);
      setPhase("active");
    } catch (err) {
      alert(err.message || "Could not start session. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  const handleAnswerRecord = ({ index, chosenIndex, feedback, isCorrect, isLast, nextQuestion }) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[index] = { chosenIndex, feedback, isCorrect };
      return copy;
    });

    pendingResultRef.current = { isLast, nextQuestion };
  };

  const handleAdvance = () => {
    setDirection(1);
    // If we're at the last question
    if (currentIndex + 1 >= totalQuestions || pendingResultRef.current?.isLast) {
      setResult(null);
      setPhase("results");
      return;
    }

    // If next question is available from submission
    if (pendingResultRef.current?.nextQuestion) {
      const nextQ = pendingResultRef.current.nextQuestion;
      setQuestions((prev) => {
        const copy = [...prev];
        copy[currentIndex + 1] = nextQ;
        return copy;
      });
      pendingResultRef.current = null;
    }

    setCurrentIndex((i) => i + 1);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleRestart = () => {
    setPhase("setup");
    setSessionId(null);
    setQuestions([]);
    setAnswers([]);
    setCurrentIndex(0);
    setDirection(1);
    setTotalQuestions(0);
    setResult(null);
    pendingResultRef.current = null;
  };

  const currentQuestion = questions[currentIndex];
  const savedAnswer = answers[currentIndex];

  return (
    <>
      <Helmet>
        <title>MCQ Practice | Kanthast School</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className={`transition-all duration-300 ${
        phase === "active"
          ? "w-full max-w-6xl mx-auto px-3 sm:px-5 md:px-6 py-2 sm:py-3.5 min-h-[calc(100dvh-var(--navbar-h,4rem))] flex flex-col justify-between"
          : "max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-8 min-h-screen"
      }`}>
        <AnimatePresence mode="wait">
          {phase === "setup" && (
            <Motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SessionPicker onStart={handleStart} loading={starting} />
            </Motion.div>
          )}

          {phase === "active" && currentQuestion && (
            <Motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <QuestionScreen
                question={currentQuestion}
                questionIndex={currentIndex}
                totalQuestions={totalQuestions}
                sessionId={sessionId}
                mode={sessionConfig.mode || "practice"}
                subject={sessionConfig.subject || ""}
                savedAnswer={savedAnswer}
                direction={direction}
                onAnswerRecord={handleAnswerRecord}
                onAdvance={handleAdvance}
                onPrevious={handlePrevious}
                onComplete={() => {
                  setPhase("results");
                }}
              />
            </Motion.div>
          )}

          {phase === "results" && (
            <Motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResultsScreen
                result={result}
                subject={sessionConfig.subject || ""}
                onRestart={handleRestart}
              />
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
