// pages/FlashcardPractice.jsx
// Flashcard Practice Engine — 3D tactile flip physics, SM-2 Spaced Repetition,
// bilateral flank navigation arrows, audio feedback, interactive results gauge & modal.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  FiArrowLeft, FiArrowRight, FiRotateCw, FiCheck, FiX, FiLayers,
  FiBookOpen, FiAward, FiClock, FiCheckCircle, FiAlertCircle,
  FiChevronLeft, FiChevronRight, FiList, FiRefreshCw, FiZap,
  FiInfo, FiStar, FiChevronDown, FiTarget
} from "react-icons/fi";
import { Eyebrow, Accent } from "../components/ui/Brandmarks";
import {
  fetchFlashcardSubjects,
  fetchFlashcardChapters,
  startFlashcardSession,
  rateFlashcard,
  getFlashcardResult,
  getFlashcardHistory,
  getFlashcardStats
} from "../utils/practiceApi";
import "../styles/practice-studio.css";

const hasAuth = () =>
  Boolean(localStorage.getItem("kanthastSchoolToken") && localStorage.getItem("kanthastSchoolUser"));

const SUBJECT_THEMES = {
  Science: {
    color: "#059669",
    softBg: "rgba(5, 150, 105, 0.08)",
    badgeBorder: "rgba(5, 150, 105, 0.25)",
    text: "#059669",
  },
  Mathematics: {
    color: "#2563eb",
    softBg: "rgba(37, 99, 235, 0.08)",
    badgeBorder: "rgba(37, 99, 235, 0.25)",
    text: "#2563eb",
  },
  "Social Science": {
    color: "#d97706",
    softBg: "rgba(217, 119, 6, 0.08)",
    badgeBorder: "rgba(217, 119, 6, 0.25)",
    text: "#d97706",
  },
};

const getSubjectTheme = (subj) =>
  SUBJECT_THEMES[subj] || {
    color: "#1d4ed8",
    softBg: "rgba(29, 78, 216, 0.08)",
    badgeBorder: "rgba(29, 78, 216, 0.25)",
    text: "#1d4ed8",
  };

const RATING_INFO = {
  1: { label: "Again", days: "< 1 day", desc: "Repeat today", color: "#ef4444", bg: "#fef2f2" },
  2: { label: "Hard", days: "+1 day", desc: "Recalled with difficulty", color: "#f59e0b", bg: "#fffbeb" },
  3: { label: "Good", days: "+3 days", desc: "Solid recall", color: "#3b82f6", bg: "#eff6ff" },
  4: { label: "Easy", days: "+7 days", desc: "Instant mastery", color: "#10b981", bg: "#ecfdf5" },
};

// Subtle Web Audio sound effects
function playCardSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "flip") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(560, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "rate-mastered") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === "rate-again") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(190, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    }
  } catch {
    // AudioContext blocked or unsupported, silently skip
  }
}

// ── 3D Card Animation Variants ────────────────────────────────────────────────
const cardSlideVariants = {
  enter: (dir) => ({
    x: dir > 0 ? 90 : -90,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 340, damping: 28 },
  },
  exit: (dir) => ({
    x: dir > 0 ? -90 : 90,
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.18, ease: "easeInOut" },
  }),
};

// ── Score Ring Gauge ──────────────────────────────────────────────────────────
function MasteryRing({ score = 0, size = 150 }) {
  const r = 58;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(circ - (score / 100) * circ);
    }, 150);
    return () => clearTimeout(t);
  }, [score, circ]);

  const color = score >= 80 ? "#10b981" : score >= 50 ? "#3b82f6" : "#f59e0b";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox="0 0 140 140">
        <circle
          className="score-ring-track"
          cx="70"
          cy="70"
          r={r}
        />
        <circle
          className="score-ring-fill"
          cx="70"
          cy="70"
          r={r}
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold font-display tabular-nums text-ink">{score}%</span>
        <span className="text-micro font-bold uppercase tracking-wider text-ink-subtle">Mastery</span>
      </div>
    </div>
  );
}

// ── Flashcard Review Modal ────────────────────────────────────────────────────
function FlashcardReviewModal({ isOpen, onClose, cardsReviewed = [], initialTab = "all", subject = "" }) {
  const [filterTab, setFilterTab] = useState(initialTab);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const mistakes = cardsReviewed.filter((c) => c.rating <= 2);
  const mastered = cardsReviewed.filter((c) => c.rating >= 3);

  const displayedCards =
    filterTab === "mistakes" ? mistakes :
    filterTab === "mastered" ? mastered :
    cardsReviewed;

  return (
    <div className="review-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="review-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-line bg-surface">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
                <FiLayers size={18} />
              </span>
              <h2 className="text-xl font-bold font-display text-ink">Deck Card Review</h2>
            </div>
            <p className="text-xs text-ink-muted">
              {subject ? `${subject} • ` : ""}Review memory cards, spaced repetition intervals and mnemonic tips.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-line text-ink-muted hover:text-ink hover:bg-surface-sunken transition-colors"
            aria-label="Close review modal"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-3 border-b border-line bg-surface-sunken flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterTab("mistakes")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterTab === "mistakes"
                ? "bg-critical text-white shadow-sm"
                : "bg-surface text-ink-muted border border-line hover:border-line-strong"
            }`}
          >
            <FiAlertCircle size={13} />
            Needs Review ({mistakes.length})
          </button>
          <button
            onClick={() => setFilterTab("mastered")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterTab === "mastered"
                ? "bg-positive text-white shadow-sm"
                : "bg-surface text-ink-muted border border-line hover:border-line-strong"
            }`}
          >
            <FiCheckCircle size={13} />
            Mastered ({mastered.length})
          </button>
          <button
            onClick={() => setFilterTab("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterTab === "all"
                ? "bg-brand text-brand-fg shadow-sm"
                : "bg-surface text-ink-muted border border-line hover:border-line-strong"
            }`}
          >
            <FiList size={13} />
            All Cards ({cardsReviewed.length})
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="review-modal-scroll flex-1 overflow-y-auto p-6 space-y-4">
          {displayedCards.length === 0 ? (
            <div className="text-center py-12 text-ink-muted text-sm">
              No flashcards in this category.
            </div>
          ) : (
            displayedCards.map((item, idx) => {
              const card = item.card || {};
              const ratingMeta = RATING_INFO[item.rating] || RATING_INFO[3];
              const isNeedsReview = item.rating <= 2;

              return (
                <div
                  key={card.id || card._id || idx}
                  className="rounded-2xl border border-line bg-surface p-5 shadow-sm space-y-3.5 transition-shadow hover:shadow-md"
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-ink-subtle">
                      Card #{idx + 1} • {card.chapterTitle || "General"}
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-full text-micro font-extrabold uppercase tracking-wider flex items-center gap-1"
                      style={{
                        backgroundColor: ratingMeta.bg,
                        color: ratingMeta.color,
                        border: `1px solid ${ratingMeta.color}40`,
                      }}
                    >
                      {isNeedsReview ? <FiAlertCircle size={11} /> : <FiCheckCircle size={11} />}
                      Rated: {ratingMeta.label} ({ratingMeta.days})
                    </span>
                  </div>

                  {/* Front: Prompt / Term */}
                  <div>
                    <p className="text-micro font-bold uppercase tracking-wider text-ink-subtle mb-1">
                      Term / Concept (Front)
                    </p>
                    <h3 className="text-base font-bold font-display text-ink leading-snug">
                      {card.front}
                    </h3>
                  </div>

                  {/* Back: Explanation / Definition */}
                  <div className="p-3.5 rounded-xl bg-surface-sunken border border-line text-sm text-ink leading-relaxed">
                    <p className="text-micro font-bold uppercase tracking-wider text-ink-subtle mb-1">
                      Explanation & Definition (Back)
                    </p>
                    <p>{card.back}</p>
                  </div>

                  {/* Mnemonic Pro-Tip */}
                  {card.mnemonic && (
                    <div className="flashcard-mnemonic-box text-xs">
                      <span className="font-bold text-amber-700 dark:text-amber-400 inline-flex items-center gap-1.5 mb-0.5">
                        <FiZap size={12} /> Memory Mnemonic
                      </span>
                      <p className="text-amber-900 dark:text-amber-200">{card.mnemonic}</p>
                    </div>
                  )}

                  {/* Formula */}
                  {card.formula && (
                    <div className="flashcard-formula-box text-xs text-ink font-mono">
                      <span className="font-bold text-ink-subtle block mb-0.5 text-micro uppercase tracking-wider">
                        Equation / Formula
                      </span>
                      <code>{card.formula}</code>
                    </div>
                  )}

                  {/* Key Exam Takeaway */}
                  {card.keyTakeaway && (
                    <p className="text-xs text-ink-muted flex items-start gap-1.5">
                      <FiTarget size={13} className="text-brand flex-shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-ink">Key Exam Takeaway: </strong>
                        {card.keyTakeaway}
                      </span>
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-line bg-surface flex items-center justify-between">
          <span className="text-xs text-ink-muted">
            Showing {displayedCards.length} of {cardsReviewed.length} cards
          </span>
          <button onClick={onClose} className="btn-3d btn-3d-secondary text-xs px-5 py-2">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN FLASHCARD PRACTICE PAGE ──────────────────────────────────────────────
export default function FlashcardPractice() {
  const navigate = useNavigate();

  // Screen state: "picker" | "active" | "results"
  const [screen, setScreen] = useState("picker");

  // Catalog & options
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapterNo, setSelectedChapterNo] = useState("");
  const [selectedClass, setSelectedClass] = useState("10");
  const [mode, setMode] = useState("practice"); // "practice" | "spaced_review"
  const [cardLimit, setCardLimit] = useState(15);

  // Deck state
  const [sessionId, setSessionId] = useState(null);
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cardStartTimeRef = useRef(Date.now());

  // Results & History
  const [resultsData, setResultsData] = useState(null);
  const [history, setHistory] = useState([]);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Review Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState("all");

  // ── Load Catalog & History on Mount ─────────────────────────────────────────
  useEffect(() => {
    if (!hasAuth()) {
      navigate("/login?next=/practice/flashcards");
      return;
    }

    let isMounted = true;
    async function loadInitial() {
      try {
        setLoading(true);
        const [subjsRes, histRes, statsRes] = await Promise.all([
          fetchFlashcardSubjects(selectedClass),
          getFlashcardHistory(),
          getFlashcardStats().catch(() => ({ dueCount: 0 })),
        ]);

        if (!isMounted) return;

        if (subjsRes.success && subjsRes.subjects.length > 0) {
          setSubjects(subjsRes.subjects);
          setSelectedSubject(subjsRes.subjects[0].subject);
        }
        if (histRes.success) {
          setHistory(histRes.history || []);
        }
        if (statsRes.dueCount) {
          setDueCount(statsRes.dueCount);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadInitial();
    return () => {
      isMounted = false;
    };
  }, [selectedClass, navigate]);

  // ── Load Chapters when Subject Changes ──────────────────────────────────────
  useEffect(() => {
    if (!selectedSubject) return;
    let isMounted = true;
    async function loadChaps() {
      try {
        const res = await fetchFlashcardChapters(selectedSubject, selectedClass);
        if (isMounted && res.success) {
          setChapters(res.chapters || []);
          setSelectedChapterNo(""); // Default to all chapters
        }
      } catch {
        // Soft fail
      }
    }
    loadChaps();
    return () => {
      isMounted = false;
    };
  }, [selectedSubject, selectedClass]);

  // ── Start Study Session ─────────────────────────────────────────────────────
  const handleStartSession = async (customSubject, customChapterNo) => {
    try {
      setLoading(true);
      setError(null);

      const subj = customSubject || selectedSubject;
      const chap = customChapterNo !== undefined ? customChapterNo : selectedChapterNo;

      const res = await startFlashcardSession({
        schoolClass: selectedClass,
        subject: subj,
        chapterNo: chap !== "" ? chap : null,
        mode,
        limit: cardLimit,
      });

      if (!res.cards || res.cards.length === 0) {
        throw new Error("No flashcards found for this selection.");
      }

      setSessionId(res.sessionId);
      setDeck(res.cards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setDirection(1);
      cardStartTimeRef.current = Date.now();
      setScreen("active");
    } catch (err) {
      setError(err.message || "Failed to start flashcard session.");
    } finally {
      setLoading(false);
    }
  };

  // ── Flip Card ───────────────────────────────────────────────────────────────
  const handleFlip = useCallback(() => {
    // If the user was selecting text, don't trigger flip on mouse up
    if (typeof window !== "undefined" && window.getSelection && window.getSelection()?.toString().trim().length > 0) {
      return;
    }
    playCardSound("flip");
    setIsFlipped((prev) => !prev);
  }, []);

  // ── Navigation (Previous / Next) ────────────────────────────────────────────
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
      cardStartTimeRef.current = Date.now();
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < deck.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      cardStartTimeRef.current = Date.now();
    }
  }, [currentIndex, deck.length]);

  // ── Rating Submission (SM-2) ────────────────────────────────────────────────
  const handleRateCard = useCallback(
    async (rating) => {
      if (!deck[currentIndex] || isSubmitting) return;

      const currentCard = deck[currentIndex];
      const responseMs = Date.now() - cardStartTimeRef.current;

      if (rating >= 3) playCardSound("rate-mastered");
      else playCardSound("rate-again");

      try {
        setIsSubmitting(true);
        const res = await rateFlashcard(sessionId, {
          cardId: currentCard.id,
          rating,
          responseMs,
        });

        const isLastCard = currentIndex >= deck.length - 1;

        if (isLastCard || res.session?.isCompleted) {
          // Complete session and fetch final result
          const finalResult = await getFlashcardResult(sessionId);
          setResultsData(finalResult.session);
          setScreen("results");
          // Refresh past history
          getFlashcardHistory().then((h) => {
            if (h.success) setHistory(h.history);
          });
        } else {
          // Advance to next card
          setDirection(1);
          setCurrentIndex((prev) => prev + 1);
          setIsFlipped(false);
          cardStartTimeRef.current = Date.now();
        }
      } catch (err) {
        console.error("Error rating flashcard:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [deck, currentIndex, isSubmitting, sessionId]
  );

  // ── Keyboard Shortcuts (Space, 1-4, Arrows) ─────────────────────────────────
  useEffect(() => {
    if (screen !== "active") return;

    const handleKeyDown = (e) => {
      // Don't capture inside inputs
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;

      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        handleRateCard(Number(e.key));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, handleFlip, handlePrev, handleNext, handleRateCard]);

  // Current Card and Theme
  const currentCard = deck[currentIndex];
  const theme = currentCard ? getSubjectTheme(currentCard.subject) : getSubjectTheme(selectedSubject);

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Helmet>
        <title>Flashcards Studio | Kanthast School</title>
        <meta
          name="description"
          content="Master Class X CBSE NCERT concepts, formulas and definitions with 3D tactile flashcards and SM-2 spaced repetition."
        />
      </Helmet>

      <div className={`bg-canvas transition-all duration-300 ${
        screen === "active"
          ? "w-full max-w-6xl mx-auto px-3 sm:px-5 md:px-6 py-2 sm:py-3.5 min-h-[calc(100dvh-var(--navbar-h,4rem))] flex flex-col justify-between"
          : "max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8 min-h-screen"
      }`}>
        <div className="w-full h-full flex flex-col flex-1">
          {/* Top Breadcrumb & Navigation (Picker & Results screens) */}
          {screen !== "active" && (
            <div className="flex items-center justify-between mb-6">
              <Link
                to="/practice"
                className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink transition-colors"
              >
                <FiArrowLeft size={16} /> Back to Practice Studio
              </Link>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════
              SCREEN 1: DECK PICKER & HUB SETUP
             ═════════════════════════════════════════════════════════════════════ */}
          {screen === "picker" && (
            <Motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-7"
            >
              {/* Asymmetric Kanthast Editorial Header */}
              <div className="grid lg:grid-cols-12 gap-6 items-end">
                <div className="lg:col-span-8">
                  <div className="flex items-center gap-2.5 flex-wrap mb-3">
                    <Eyebrow icon={FiLayers}>Spaced Repetition · SM-2</Eyebrow>
                    <span className="text-micro font-bold uppercase tracking-[0.08em] px-2.5 py-0.5 rounded-full bg-surface border border-line text-ink-muted">
                      Class X Active
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-ink tracking-tight leading-[1.08]">
                    Lock in <Accent after=".">recall</Accent>
                  </h1>
                  <p className="mt-2.5 text-sm sm:text-base text-ink-muted max-w-xl leading-relaxed">
                    Master formulas, definitions, and high-yield NCERT concepts with tactile 3D cards and adaptive SM-2 intervals.
                  </p>
                </div>

                <div className="lg:col-span-4">
                  <div className="ps-card p-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-micro font-bold uppercase tracking-wider text-ink-subtle">Target Class</p>
                      <p className="text-xs text-ink-muted truncate">All grades welcome</p>
                    </div>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="px-3 py-1.5 rounded-control border border-line bg-surface-sunken text-ink text-xs font-bold focus:outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="10">Class X (Available)</option>
                      <option value="9">Class IX (Coming soon)</option>
                      <option value="8">Class VIII (Coming soon)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Due Repetition Notice */}
              {dueCount > 0 && (
                <div className="ps-card p-4 flex items-center justify-between gap-3 flex-wrap border-positive/30 bg-positive-soft/40">
                  <div className="flex items-center gap-3">
                    <div className="ps-icon-well is-positive !w-10 !h-10">
                      <FiClock size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink">
                        {dueCount} card{dueCount > 1 ? "s" : ""} scheduled for spaced review today
                      </p>
                      <p className="text-xs text-ink-muted">
                        Reviewing right now reinforces memory right before decay.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMode("spaced_review");
                      handleStartSession();
                    }}
                    className="ps-pressable px-4 py-2 rounded-control bg-positive text-white text-xs font-bold"
                  >
                    Review Due Cards
                  </button>
                </div>
              )}

              {/* Subject Selection Grid */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle mb-3">
                  01 · Choose Subject
                </h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {subjects.map((s) => {
                    const isSelected = selectedSubject === s.subject;
                    return (
                      <button
                        key={s.subject}
                        onClick={() => setSelectedSubject(s.subject)}
                        className={`ps-card ps-card-interactive text-left p-5 flex items-start gap-3.5 ${
                          isSelected ? "ps-card-selected" : ""
                        }`}
                      >
                        <div className="ps-icon-well is-positive">
                          <FiBookOpen size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-extrabold font-display text-ink text-base leading-tight">
                            {s.subject}
                          </h3>
                          <p className="text-xs text-ink-muted mt-1 tabular-nums">
                            {s.cardCount} cards · {s.chapterCount} chapters
                          </p>
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-brand text-brand-fg flex items-center justify-center flex-shrink-0">
                            <FiCheck size={11} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chapter & Mode Filter Controls */}
              <div className="ps-card p-5 sm:p-7 space-y-6">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold font-display text-ink mb-3">
                    02 · Deck Settings
                  </h2>
                  <select
                    value={selectedChapterNo}
                    onChange={(e) => setSelectedChapterNo(e.target.value)}
                    className="w-full p-3 rounded-xl border border-line bg-surface-sunken text-ink font-semibold text-sm focus:outline-none focus:border-brand"
                  >
                    <option value="">All Chapters ({subjects.find((s) => s.subject === selectedSubject)?.cardCount || 0} cards)</option>
                    {chapters.map((ch) => (
                      <option key={ch.chapterNo} value={ch.chapterNo}>
                        Ch {ch.chapterNo}: {ch.chapterTitle} ({ch.cardCount} cards)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Mode */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-subtle mb-2">
                      Review Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMode("practice")}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                          mode === "practice"
                            ? "bg-brand text-brand-fg border-brand"
                            : "bg-surface-sunken text-ink-muted border-line hover:border-line-strong"
                        }`}
                      >
                        Standard Practice
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("spaced_review")}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                          mode === "spaced_review"
                            ? "bg-brand text-brand-fg border-brand"
                            : "bg-surface-sunken text-ink-muted border-line hover:border-line-strong"
                        }`}
                      >
                        SM-2 Spaced Review
                      </button>
                    </div>
                  </div>

                  {/* Deck Count */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-subtle mb-2">
                      Deck Size
                    </label>
                    <div className="flex gap-2">
                      {[10, 15, 20].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setCardLimit(num)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            cardLimit === num
                              ? "bg-brand text-brand-fg border-brand"
                              : "bg-surface-sunken text-ink-muted border-line hover:border-line-strong"
                          }`}
                        >
                          {num} Cards
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-critical-soft text-critical text-xs font-semibold">
                    {error}
                  </div>
                )}

                {/* Launch Button */}
                <button
                  onClick={() => handleStartSession()}
                  disabled={loading || !selectedSubject}
                  className="w-full btn-3d btn-3d-primary py-3.5 text-base font-extrabold tracking-wide"
                >
                  {loading ? "Preparing 3D Deck..." : "Start Flashcard Deck"}
                </button>
              </div>

              {/* Past Flashcard Sessions */}
              {history.length > 0 && (
                <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                  <h3 className="text-base font-bold font-display text-ink mb-4">
                    Recent Flashcard Sessions
                  </h3>
                  <div className="divide-y divide-line">
                    {history.slice(0, 5).map((s) => (
                      <div key={s._id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                            s.masteryScore >= 70 ? "bg-positive-soft text-positive" : "bg-caution-soft text-caution"
                          }`}>
                            {s.masteryScore}%
                          </div>
                          <div>
                            <p className="text-sm font-bold text-ink">{s.subject}</p>
                            <p className="text-xs text-ink-muted">
                              {s.chapterTitle || "General"} • {s.cardsTotal} cards
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            const res = await getFlashcardResult(s._id);
                            if (res.success) {
                              setResultsData(res.session);
                              setIsModalOpen(true);
                            }
                          }}
                          className="btn-3d btn-3d-secondary text-xs px-3.5 py-1.5"
                        >
                          Review Deck
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════
              SCREEN 2: ACTIVE 3D FLASHCARD DECK & FLANK NAVIGATION
             ═════════════════════════════════════════════════════════════════════ */}
          {screen === "active" && currentCard && (
            <div className="w-full flex-1 flex flex-col justify-between py-1 sm:py-2">
              {/* Progress & Breadcrumbs Header */}
              <div className="w-full max-w-4xl mx-auto space-y-1.5 mb-1.5 sm:mb-2.5">
                <div className="flex items-center justify-between text-xs sm:text-sm text-ink-muted">
                  <div className="flex items-center gap-1.5 font-bold" style={{ color: theme.color }}>
                    <FiBookOpen size={15} />
                    <span>{currentCard.subject}</span>
                    <span className="text-ink-subtle">•</span>
                    <span className="text-ink font-semibold">{currentCard.chapterTitle}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold tabular-nums px-2.5 py-0.5 rounded-full bg-surface border border-line shadow-xs text-xs">
                      Card {currentIndex + 1} of {deck.length}
                    </span>
                    <button
                      onClick={() => setScreen("picker")}
                      className="text-xs font-bold text-critical hover:underline px-1"
                    >
                      Quit Session
                    </button>
                  </div>
                </div>

                {/* Top Progress Line */}
                <div className="practice-progress-bar h-1.5 rounded-full overflow-hidden">
                  <div
                    className="practice-progress-fill"
                    style={{
                      width: `${((currentIndex + 1) / deck.length) * 100}%`,
                      backgroundColor: theme.color,
                    }}
                  />
                </div>
              </div>

              {/* ── Flank Centered Layout: Left Arrow [Card Stage] Right Arrow ──── */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-5 w-full flex-1 my-auto py-1">
                {/* Left Flank Button */}
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="flank-arrow-btn"
                  title="Previous Card (←)"
                  aria-label="Previous card"
                >
                  <FiChevronLeft size={24} />
                </button>

                {/* 3D Flashcard Stage */}
                <div className="flashcard-stage flex-1 max-w-[880px] w-full">
                  <AnimatePresence mode="wait" custom={direction}>
                    <Motion.div
                      key={currentIndex}
                      custom={direction}
                      variants={cardSlideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="w-full h-full"
                    >
                      <div
                        onClick={handleFlip}
                        className={`flashcard-flipper cursor-pointer ${isFlipped ? "is-flipped" : ""}`}
                        role="button"
                        tabIndex={0}
                        aria-label={isFlipped ? "Flashcard answer face. Click to flip." : "Flashcard question face. Click to flip."}
                      >
                        {/* ── FRONT FACE (Question / Term / Formula) ──────── */}
                        <div className="flashcard-face flashcard-front p-5 sm:p-7 md:p-8 justify-between">
                          {/* Front Top meta */}
                          <div className="flex items-center justify-between">
                            <span
                              className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: theme.softBg,
                                color: theme.text,
                                border: `1px solid ${theme.badgeBorder}`,
                              }}
                            >
                              {currentCard.topicTitle || currentCard.chapterTitle}
                            </span>
                            <span className="text-xs font-bold text-ink-subtle uppercase tracking-wider">
                              Difficulty: {currentCard.difficulty === 1 ? "Easy" : currentCard.difficulty === 2 ? "Medium" : "Hard"}
                            </span>
                          </div>

                          {/* Front Main Stem */}
                          <div className="my-auto py-4 sm:py-6 text-center space-y-3 max-w-2xl mx-auto">
                            {currentCard.frontHint && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-sunken border border-line text-xs font-semibold text-ink-subtle">
                                <FiInfo size={12} className="text-brand" /> Hint: {currentCard.frontHint}
                              </span>
                            )}
                            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[2.25rem] font-extrabold font-display text-ink leading-snug">
                              {currentCard.front}
                            </h2>
                          </div>

                          {/* Front Bottom Action Bar */}
                          <div className="flex items-center justify-between pt-3 border-t border-line text-ink-muted">
                            <div className="flip-prompt-pill">
                              <FiRotateCw size={13} className="animate-spin-slow" />
                              <span>Click or Space to reveal</span>
                            </div>
                            <span className="text-xs font-semibold text-ink-subtle hidden sm:inline">
                              Space to flip • 1-4 to rate
                            </span>
                          </div>
                        </div>

                        {/* ── BACK FACE (Answer / Derivation / Mnemonics) ─── */}
                        <div className="flashcard-face flashcard-back p-5 sm:p-7 md:p-8 justify-between">
                          {/* Back Top meta */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                              <FiCheck size={13} /> Answer & High-Yield Analysis
                            </span>
                            <span className="text-xs font-bold text-ink-subtle uppercase tracking-wider hidden sm:inline">
                              Click or Space to Flip Back
                            </span>
                          </div>

                          {/* Back Main Content with Smooth Mouse Wheel Scroll */}
                          <div
                            className="flashcard-scroll-body flex-1 min-h-0 my-auto py-2 sm:py-3 space-y-3 pr-2"
                          >
                            <p className="text-base sm:text-lg md:text-xl font-medium text-ink leading-relaxed">
                              {currentCard.back}
                            </p>

                            {/* Equation / Formula Highlight */}
                            {currentCard.formula && (
                              <div className="flashcard-formula-box text-xs sm:text-sm text-ink font-mono p-3 rounded-xl">
                                <span className="font-bold text-ink-subtle block mb-0.5 text-micro uppercase tracking-wider">
                                  Key Formula:
                                </span>
                                <code>{currentCard.formula}</code>
                              </div>
                            )}

                            {/* Mnemonic Pro-Tip */}
                            {currentCard.mnemonic && (
                              <div className="flashcard-mnemonic-box text-xs sm:text-sm p-3 sm:p-3.5 rounded-xl">
                                <span className="font-bold text-amber-700 dark:text-amber-400 inline-flex items-center gap-1.5 mb-0.5 text-xs uppercase tracking-wider">
                                  <FiZap size={12} /> Memory Mnemonic
                                </span>
                                <p className="text-amber-950 dark:text-amber-100 leading-snug">
                                  {currentCard.mnemonic}
                                </p>
                              </div>
                            )}

                            {/* Key Exam Takeaway */}
                            {currentCard.keyTakeaway && (
                              <p className="text-xs sm:text-sm text-ink-muted flex items-start gap-1.5">
                                <FiTarget size={14} className="text-brand flex-shrink-0 mt-0.5" />
                                <span>
                                  <strong className="text-ink">Key Exam Takeaway: </strong>
                                  {currentCard.keyTakeaway}
                                </span>
                              </p>
                            )}
                          </div>

                          {/* Back Bottom Bar */}
                          <div className="flex items-center justify-between pt-2.5 border-t border-line text-ink-muted flex-shrink-0">
                            <div className="flip-prompt-pill">
                              <FiRotateCw size={13} />
                              <span>Click or Space to flip</span>
                            </div>
                            <span className="text-xs font-bold text-ink-subtle">
                              Rate recall below (1 - 4)
                            </span>
                          </div>
                        </div>
                      </div>
                    </Motion.div>
                  </AnimatePresence>
                </div>

                {/* Right Flank Button */}
                <button
                  onClick={handleNext}
                  disabled={currentIndex === deck.length - 1}
                  className="flank-arrow-btn"
                  title="Next Card (→)"
                  aria-label="Next card"
                >
                  <FiChevronRight size={24} />
                </button>
              </div>

              {/* ── Minimalist Recall Rating Dock (Compact & Space-Saving) ──── */}
              <div className="w-full max-w-2xl sm:max-w-3xl mx-auto pt-1 pb-1 sm:pb-2">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-ink-muted flex-shrink-0">
                    <FiZap size={14} className="text-amber-500" />
                    <span>Recall:</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 flex-1">
                    {/* Rating 1: Again */}
                    <button
                      onClick={() => handleRateCard(1)}
                      disabled={isSubmitting}
                      className="btn-rating-compact btn-rating-again-compact"
                      title="Again (< 1 day) • Hotkey 1"
                    >
                      <span>Again</span>
                      <span className="rating-compact-badge">1</span>
                      <span className="rating-compact-interval hidden md:inline">&lt;1d</span>
                    </button>

                    {/* Rating 2: Hard */}
                    <button
                      onClick={() => handleRateCard(2)}
                      disabled={isSubmitting}
                      className="btn-rating-compact btn-rating-hard-compact"
                      title="Hard (+1 day) • Hotkey 2"
                    >
                      <span>Hard</span>
                      <span className="rating-compact-badge">2</span>
                      <span className="rating-compact-interval hidden md:inline">+1d</span>
                    </button>

                    {/* Rating 3: Good */}
                    <button
                      onClick={() => handleRateCard(3)}
                      disabled={isSubmitting}
                      className="btn-rating-compact btn-rating-good-compact"
                      title="Good (+3 days) • Hotkey 3"
                    >
                      <span>Good</span>
                      <span className="rating-compact-badge">3</span>
                      <span className="rating-compact-interval hidden md:inline">+3d</span>
                    </button>

                    {/* Rating 4: Easy */}
                    <button
                      onClick={() => handleRateCard(4)}
                      disabled={isSubmitting}
                      className="btn-rating-compact btn-rating-easy-compact"
                      title="Easy (+7 days) • Hotkey 4"
                    >
                      <span>Easy</span>
                      <span className="rating-compact-badge">4</span>
                      <span className="rating-compact-interval hidden md:inline">+7d</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════
              SCREEN 3: RESULTS SCREEN & INTERACTIVE REVIEW MODAL
             ═════════════════════════════════════════════════════════════════════ */}
          {screen === "results" && resultsData && (
            <Motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8"
            >
              {/* Mastery Score Card */}
              <div className="rounded-3xl border border-line bg-surface p-8 shadow-e2 text-center relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    background:
                      resultsData.masteryScore >= 70
                        ? "radial-gradient(circle, #10b981 0%, transparent 70%)"
                        : "radial-gradient(circle, #f59e0b 0%, transparent 70%)",
                  }}
                />

                <MasteryRing score={resultsData.masteryScore} size={160} />

                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-ink mt-4 mb-2">
                  {resultsData.masteryScore >= 80
                    ? "Outstanding Recall!"
                    : resultsData.masteryScore >= 50
                    ? "Good Progress!"
                    : "Keep Practicing!"}
                </h2>
                <p className="text-sm text-ink-muted max-w-md mx-auto">
                  {resultsData.masteryScore >= 70
                    ? "Your spaced repetition interval has increased. These concepts are cementing in long-term memory."
                    : "Cards marked 'Again' or 'Hard' are scheduled for review soon to reinforce neural pathways."}
                </p>

                {/* Clickable Stat Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
                  {/* Mastered (Good + Easy) */}
                  <div
                    onClick={() => {
                      setModalInitialTab("mastered");
                      setIsModalOpen(true);
                    }}
                    className="clickable-stat-card rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-center cursor-pointer"
                    title="Click to view mastered cards"
                  >
                    <p className="text-micro font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Mastered
                    </p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {(resultsData.goodCount || 0) + (resultsData.easyCount || 0)}
                    </p>
                    <span className="text-micro text-emerald-700/80 font-medium">Click to review</span>
                  </div>

                  {/* Needs Review (Again + Hard) */}
                  <div
                    onClick={() => {
                      setModalInitialTab("mistakes");
                      setIsModalOpen(true);
                    }}
                    className="clickable-stat-card rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-center cursor-pointer"
                    title="Click to view cards needing review"
                  >
                    <p className="text-micro font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                      To Repeat
                    </p>
                    <p className="text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
                      {(resultsData.againCount || 0) + (resultsData.hardCount || 0)}
                    </p>
                    <span className="text-micro text-rose-700/80 font-medium">Click to review</span>
                  </div>

                  {/* Total Cards */}
                  <div
                    onClick={() => {
                      setModalInitialTab("all");
                      setIsModalOpen(true);
                    }}
                    className="clickable-stat-card rounded-2xl border border-line bg-surface-sunken p-4 text-center cursor-pointer"
                    title="Click to view all cards"
                  >
                    <p className="text-micro font-bold uppercase tracking-wider text-ink-subtle">
                      Total Cards
                    </p>
                    <p className="text-2xl font-black text-ink tabular-nums">
                      {resultsData.cardsTotal || resultsData.cardsReviewed?.length || 0}
                    </p>
                    <span className="text-micro text-ink-subtle font-medium">View all</span>
                  </div>

                  {/* Spaced Interval */}
                  <div className="rounded-2xl border border-line bg-surface-sunken p-4 text-center">
                    <p className="text-micro font-bold uppercase tracking-wider text-ink-subtle">
                      Next Review
                    </p>
                    <p className="text-2xl font-black text-brand tabular-nums">
                      {resultsData.againCount > 0 ? "Today" : "3-7 Days"}
                    </p>
                    <span className="text-micro text-ink-subtle font-medium">SM-2 Spaced</span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
                  {((resultsData.againCount || 0) + (resultsData.hardCount || 0)) > 0 && (
                    <button
                      onClick={() => {
                        const difficultCards = (resultsData.cardsReviewed || [])
                          .filter((cr) => cr.rating <= 2)
                          .map((cr) => cr.card);
                        if (difficultCards.length > 0) {
                          setDeck(difficultCards);
                          setCurrentIndex(0);
                          setIsFlipped(false);
                          setScreen("active");
                        }
                      }}
                      className="btn-3d btn-3d-primary px-6 py-3 text-sm font-bold flex items-center gap-2"
                    >
                      <FiRefreshCw size={16} />
                      Review Difficult Cards ({(resultsData.againCount || 0) + (resultsData.hardCount || 0)})
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsModalOpen(true);
                      setModalInitialTab("all");
                    }}
                    className="btn-3d btn-3d-secondary px-6 py-3 text-sm font-bold flex items-center gap-2"
                  >
                    <FiList size={16} />
                    Inspect All Cards
                  </button>

                  <button
                    onClick={() => setScreen("picker")}
                    className="btn-3d btn-3d-secondary px-6 py-3 text-sm font-bold flex items-center gap-2"
                  >
                    <FiArrowLeft size={16} />
                    Study Another Deck
                  </button>
                </div>
              </div>
            </Motion.div>
          )}

          {/* Interactive Modal for Reviewing Cards */}
          <FlashcardReviewModal
            key={isModalOpen ? modalInitialTab : "closed"}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            cardsReviewed={resultsData?.cardsReviewed || []}
            initialTab={modalInitialTab}
            subject={resultsData?.subject || selectedSubject}
          />
        </div>
      </div>
    </>
  );
}
