// pages/VivaPractice.jsx — Conversational 60/40 Voice Viva Studio with Elena (AI Examiner)
import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  FiMic, FiMicOff, FiVolume2, FiVolumeX, FiSend, FiCheckCircle,
  FiAlertCircle, FiArrowLeft, FiBookOpen, FiClock, FiInfo, FiX,
  FiList, FiZap, FiRotateCw, FiStar, FiMessageSquare, FiSquare,
  FiCheck, FiChevronDown, FiShield, FiSmile, FiArrowRight
} from "react-icons/fi";
import { Eyebrow, Accent } from "../components/ui/Brandmarks";
import {
  fetchVivaSubjects,
  fetchVivaChapters,
  startVivaSession,
  submitVivaAnswer,
  completeVivaSession,
  getVivaResult,
  getVivaHistory,
} from "../utils/practiceApi";
import "../styles/practice-studio.css";

const hasAuth = () =>
  Boolean(localStorage.getItem("kanthastSchoolToken") && localStorage.getItem("kanthastSchoolUser"));

const getStudentName = () => {
  try {
    const u = JSON.parse(localStorage.getItem("kanthastSchoolUser") || "null");
    const raw = u?.firstName || u?.name || u?.fullName || "Student";
    return String(raw).trim().split(/\s+/)[0] || "Student";
  } catch {
    return "Student";
  }
};

const SUBJECT_THEMES = {
  Science: { color: "#059669", softBg: "rgba(5, 150, 105, 0.1)", text: "#059669" },
  Mathematics: { color: "#1d4ed8", softBg: "rgba(29, 78, 216, 0.1)", text: "#1d4ed8" },
  "Social Science": { color: "#d97706", softBg: "rgba(217, 119, 6, 0.1)", text: "#d97706" },
};

const getSubjectTheme = (subj) =>
  SUBJECT_THEMES[subj] || { color: "#7c3aed", softBg: "rgba(124, 58, 237, 0.1)", text: "#7c3aed" };

// Filler-word regex: thinking sounds like "aaaa", "hmmm", "um", "uh", "er"
const STANDALONE_FILLER_RE = /\b(a{2,}|u+h+|u+m+|e+r+m?|h+m+|m+h+m+)\b/gi;

function stripFillers(text) {
  return String(text || "")
    .replace(STANDALONE_FILLER_RE, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isPureFiller(text) {
  return stripFillers(text).length === 0;
}

// ── Robust Chunked Speech Synthesis for Elena (fixes Chrome 15s cutoff & GC) ──
function chunkSpeechText(text, maxLen = 155) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const sentences = clean.match(/[^.!?]+[.!?]*\s*/g) || [clean];
  const chunks = [];
  let buf = "";
  for (const s of sentences) {
    if ((buf + s).length <= maxLen) {
      buf += s;
    } else {
      if (buf.trim()) chunks.push(buf.trim());
      if (s.length <= maxLen) {
        buf = s;
      } else {
        const words = s.split(" ");
        let wBuf = "";
        for (const w of words) {
          if ((wBuf + " " + w).length <= maxLen) {
            wBuf = wBuf ? `${wBuf} ${w}` : w;
          } else {
            if (wBuf) chunks.push(wBuf);
            wBuf = w;
          }
        }
        buf = wBuf;
      }
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks;
}

function pickElenaVoice() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  const preferred = [
    "Google UK English Female",
    "Samantha",
    "Microsoft Sonia",
    "Microsoft Zira",
    "Karen",
    "Victoria",
    "Google US English",
  ];
  for (const name of preferred) {
    const match = voices.find((v) => v.name.includes(name));
    if (match) return match;
  }
  return voices.find((v) => v.lang?.startsWith("en")) || voices[0] || null;
}

// ── Star Rating Helper ────────────────────────────────────────────────────────
function StarRating({ rating = 0, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <FiStar
          key={n}
          size={size}
          className={n <= rating ? "text-amber-400 fill-amber-400" : "text-line-strong"}
        />
      ))}
    </span>
  );
}

// ── Viva Review & Transcript Modal ────────────────────────────────────────────
function VivaReviewModal({ isOpen, onClose, items, conversationLog = [], initialTab = "all", subject, rating, ratingLabel }) {
  const [filterTab, setFilterTab] = useState(initialTab);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const needsPolish = items.filter((it) => !it.evaluation || it.evaluation.score < 70);
  const strong = items.filter((it) => it.evaluation && it.evaluation.score >= 70);
  const displayed =
    filterTab === "needs_polish" ? needsPolish :
    filterTab === "strong" ? strong :
    items;

  return (
    <div className="review-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-line bg-surface">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <FiMic size={18} />
              </span>
              <h2 className="text-xl font-bold font-display text-ink">Session Review &amp; Transcript</h2>
              {rating > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-bold text-ink">
                  <StarRating rating={rating} size={12} />
                  {ratingLabel}
                </span>
              )}
            </div>
            <p className="text-xs text-ink-muted">
              {subject ? `${subject} • ` : ""}Inspect Elena's conversation transcript, rubric checkpoints, and 30-second model answers.
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
            onClick={() => setFilterTab("needs_polish")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterTab === "needs_polish"
                ? "bg-critical text-white shadow-sm"
                : "bg-surface text-ink-muted border border-line hover:border-line-strong"
            }`}
          >
            <FiAlertCircle size={13} />
            Needs Polish ({needsPolish.length})
          </button>
          <button
            onClick={() => setFilterTab("strong")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterTab === "strong"
                ? "bg-positive text-white shadow-sm"
                : "bg-surface text-ink-muted border border-line hover:border-line-strong"
            }`}
          >
            <FiCheckCircle size={13} />
            Strong ({strong.length})
          </button>
          <button
            onClick={() => setFilterTab("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterTab === "all"
                ? "bg-brand text-brand-fg shadow-sm"
                : "bg-surface text-ink-muted border border-line hover:border-line-strong"
            }`}
          >
            <FiList size={13} />
            All Questions ({items.length})
          </button>
          {conversationLog.length > 0 && (
            <button
              onClick={() => setFilterTab("transcript")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                filterTab === "transcript"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "bg-surface text-ink-muted border border-line hover:border-line-strong"
              }`}
            >
              <FiMessageSquare size={13} />
              Voice Transcript ({conversationLog.length})
            </button>
          )}
        </div>

        {/* Body */}
        <div className="review-modal-scroll flex-1 overflow-y-auto p-6 space-y-4">
          {filterTab === "transcript" ? (
            <div className="space-y-3">
              {conversationLog.map((msg, i) => {
                const isElena = msg.speaker === "elena";
                return (
                  <div key={i} className={`flex ${isElena ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isElena
                          ? "bg-violet-500/10 border border-violet-500/20 text-ink rounded-tl-sm"
                          : "bg-brand text-brand-fg rounded-tr-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="text-micro font-extrabold uppercase tracking-wider opacity-80">
                          {isElena ? "Elena (Examiner)" : "You"}
                        </span>
                        {typeof msg.score === "number" && (
                          <span className="text-micro font-extrabold px-2 py-0.5 rounded-full bg-black/15">
                            {msg.score}%
                          </span>
                        )}
                      </div>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-12 text-ink-muted text-sm">
              No questions in this category.
            </div>
          ) : (
            displayed.map((item, idx) => {
              const ev = item.evaluation;
              const score = ev?.score ?? 0;
              const isStrong = score >= 70;
              return (
                <div
                  key={item.questionIndex ?? idx}
                  className="rounded-2xl border border-line bg-surface p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-ink-subtle">
                      Q{(item.questionIndex ?? idx) + 1} • {item.chapterTitle}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-micro font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                        isStrong
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {isStrong ? <FiCheckCircle size={11} /> : <FiAlertCircle size={11} />}
                      Score: {score}%
                    </span>
                  </div>

                  <h3 className="text-base font-bold font-display text-ink leading-snug">
                    {item.question}
                  </h3>

                  {ev && (
                    <div className="p-3.5 rounded-xl bg-surface-sunken border border-line text-sm space-y-1.5">
                      <p className="text-micro font-bold uppercase tracking-wider text-ink-subtle">
                        Your Spoken Answer
                      </p>
                      <p className="text-ink italic">"{ev.transcript}"</p>
                      <p className="text-xs text-ink-muted pt-1 border-t border-line/60">
                        <strong className="text-ink">Elena's Feedback:</strong> {ev.feedback}
                      </p>
                    </div>
                  )}

                  {ev && (ev.matchedPoints?.length > 0 || ev.missedPoints?.length > 0) && (
                    <div className="grid sm:grid-cols-2 gap-2 text-xs">
                      {ev.matchedPoints?.map((pt, i) => (
                        <div key={`m-${i}`} className="flex items-start gap-1.5 p-2 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                          <FiCheckCircle size={13} className="mt-0.5 flex-shrink-0" />
                          <span>{pt}</span>
                        </div>
                      ))}
                      {ev.missedPoints?.map((pt, i) => (
                        <div key={`x-${i}`} className="flex items-start gap-1.5 p-2 rounded-lg bg-rose-500/10 text-rose-800 dark:text-rose-300">
                          <FiAlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                          <span>Missed: {pt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3.5 rounded-xl bg-brand-soft/40 border border-brand/20 text-sm text-ink leading-relaxed">
                    <p className="text-micro font-bold uppercase tracking-wider text-brand mb-1">
                      Model 30-Second Spoken Answer
                    </p>
                    <p>{item.modelAnswer}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-line bg-surface flex items-center justify-between">
          <span className="text-xs text-ink-muted">
            {filterTab === "transcript"
              ? `${conversationLog.length} conversational turns`
              : `Showing ${displayed.length} of ${items.length} questions`}
          </span>
          <button onClick={onClose} className="btn-3d btn-3d-secondary text-xs px-5 py-2">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main VivaPractice Component ───────────────────────────────────────────────
export default function VivaPractice() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const studentName = getStudentName();

  // Screens: "picker" | "viva" | "results"
  const [screen, setScreen] = useState("picker");

  // Setup config
  const [selectedClass, setSelectedClass] = useState("10");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("Science");
  const [chapters, setChapters] = useState([]);
  const [selectedChapterNo, setSelectedChapterNo] = useState("");
  const [mode, setMode] = useState("standard");
  const [questionCount, setQuestionCount] = useState(5);

  // Active Session State
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Conversational Voice Engine States:
  // "elena_speaking" | "listening_consent" | "listening_answer" | "evaluating" | "closing"
  const [voicePhase, setVoicePhase] = useState("elena_speaking");
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [typedInput, setTypedInput] = useState("");
  const [silenceCountdown, setSilenceCountdown] = useState(null); // 3, 2, 1 or null
  const [eqLevels, setEqLevels] = useState([8, 12, 18, 10, 14, 20, 12, 8]);
  const [chatMessages, setChatMessages] = useState([]);

  // Results, History & Modal
  const [resultsData, setResultsData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState("all");
  const [modalItems, setModalItems] = useState([]);
  const [modalLog, setModalLog] = useState([]);
  const [modalSubject, setModalSubject] = useState("");
  const [modalRating, setModalRating] = useState(0);
  const [modalRatingLabel, setModalRatingLabel] = useState("");

  // Refs for stable async callbacks inside SpeechRecognition / TTS
  const phaseRef = useRef(voicePhase);
  const sessionIdRef = useRef(sessionId);
  const questionsRef = useRef(questions);
  const indexRef = useRef(currentIndex);
  const chatRef = useRef(chatMessages);
  const micMutedRef = useRef(isMicMuted);
  const audioMutedRef = useRef(isAudioMuted);
  const transcriptRef = useRef("");
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const speechTokenRef = useRef(0);
  const questionStartTimeRef = useRef(Date.now());
  const chatScrollRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRafRef = useRef(null);
  const mediaStreamRef = useRef(null);

  phaseRef.current = voicePhase;
  sessionIdRef.current = sessionId;
  questionsRef.current = questions;
  indexRef.current = currentIndex;
  chatRef.current = chatMessages;
  micMutedRef.current = isMicMuted;
  audioMutedRef.current = isAudioMuted;

  // Auto-scroll chat transcript
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, liveTranscript]);

  // Load catalog & history
  useEffect(() => {
    if (!hasAuth()) {
      navigate("/login?next=/practice/viva");
      return;
    }
    let mounted = true;
    async function loadInitial() {
      try {
        setLoading(true);
        const [subjRes, histRes] = await Promise.all([
          fetchVivaSubjects(selectedClass),
          getVivaHistory().catch(() => ({ sessions: [] })),
        ]);
        if (!mounted) return;
        if (subjRes.success && subjRes.subjects?.length > 0) {
          setSubjects(subjRes.subjects);
          setSelectedSubject(subjRes.subjects[0].subject);
        }
        if (histRes.success) {
          setHistory(histRes.sessions || []);
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadInitial();
    return () => { mounted = false; };
  }, [navigate, selectedClass]);

  // Open Viva Review modal automatically when navigated via ?review=<sessionId>
  useEffect(() => {
    const reviewId = searchParams.get("review");
    if (!reviewId || !hasAuth()) return;
    getVivaResult(reviewId)
      .then((res) => {
        if (res?.success) {
          setModalItems(res.items || []);
          setModalLog(res.conversationLog || []);
          setModalSubject(res.session?.subject || "");
          setModalRating(res.session?.rating || 0);
          setModalRatingLabel(res.session?.ratingLabel || "");
          setModalInitialTab(res.conversationLog?.length > 0 ? "transcript" : "all");
          setIsModalOpen(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        setSearchParams({}, { replace: true });
      });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!selectedSubject) return;
    fetchVivaChapters(selectedSubject, selectedClass)
      .then((res) => {
        if (res.success) {
          setChapters(res.chapters || []);
          setSelectedChapterNo("");
        }
      })
      .catch(() => {});
  }, [selectedSubject, selectedClass]);

  // ── Cleanup Audio, Mic, Timers ──────────────────────────────────────────────
  const clearSilenceTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setSilenceCountdown(null);
  }, []);

  const stopRecognition = useCallback(() => {
    clearSilenceTimers();
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      try {
        rec.onend = null;
        rec.onresult = null;
        rec.stop();
      } catch {
        /* ignore speech recognition stop errors */
      }
    }
  }, [clearSilenceTimers]);

  const stopAudioMeter = useCallback(() => {
    if (analyserRafRef.current) {
      cancelAnimationFrame(analyserRafRef.current);
      analyserRafRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch { /* ignore audio context close error */ }
      audioCtxRef.current = null;
    }
    setEqLevels([6, 8, 10, 8, 10, 8, 6, 8]);
  }, []);

  const stopElenaSpeech = useCallback(() => {
    speechTokenRef.current += 1;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    window.__elenaUtterance = null;
  }, []);

  useEffect(() => {
    return () => {
      stopElenaSpeech();
      stopRecognition();
      stopAudioMeter();
    };
  }, [stopElenaSpeech, stopRecognition, stopAudioMeter]);

  // ── Append Message to Chat Log ──────────────────────────────────────────────
  const pushChat = useCallback((speaker, text, kind = "system", score = null) => {
    const entry = {
      speaker,
      text,
      kind,
      score,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => {
      const next = [...prev, entry];
      chatRef.current = next;
      return next;
    });
  }, []);

  // ── Speak as Elena (Chunked TTS + Safe Fallback) ────────────────────────────
  const speakAsElena = useCallback((text, onFinished) => {
    stopElenaSpeech();
    const myToken = speechTokenRef.current;

    if (audioMutedRef.current || typeof window === "undefined" || !("speechSynthesis" in window)) {
      const readingMs = Math.min(2600, Math.max(900, text.length * 22));
      setTimeout(() => {
        if (speechTokenRef.current === myToken && onFinished) onFinished();
      }, readingMs);
      return;
    }

    const chunks = chunkSpeechText(text);
    if (chunks.length === 0) {
      if (onFinished) onFinished();
      return;
    }

    const voice = pickElenaVoice();
    let idx = 0;

    const playNext = () => {
      if (speechTokenRef.current !== myToken) return;
      if (idx >= chunks.length) {
        window.__elenaUtterance = null;
        if (onFinished) onFinished();
        return;
      }

      const utter = new SpeechSynthesisUtterance(chunks[idx]);
      if (voice) utter.voice = voice;
      utter.lang = voice?.lang || "en-IN";
      utter.rate = 0.98;
      utter.pitch = 1.04;
      window.__elenaUtterance = utter;

      utter.onend = () => {
        if (speechTokenRef.current !== myToken) return;
        idx += 1;
        setTimeout(playNext, 30);
      };
      utter.onerror = () => {
        if (speechTokenRef.current !== myToken) return;
        idx += 1;
        setTimeout(playNext, 30);
      };

      window.speechSynthesis.speak(utter);
    };

    window.speechSynthesis.cancel();
    playNext();
  }, [stopElenaSpeech]);

  // ── Start Live Audio Equalizer (AnalyserNode) ───────────────────────────────
  const startAudioMeter = useCallback(async () => {
    if (mediaStreamRef.current || !navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 32;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!mediaStreamRef.current) return;
        analyser.getByteFrequencyData(data);
        const bars = [];
        for (let i = 0; i < 8; i++) {
          const v = data[i] || 0;
          bars.push(Math.max(6, Math.min(34, Math.round((v / 255) * 32) + 6)));
        }
        setEqLevels(bars);
        analyserRafRef.current = requestAnimationFrame(tick);
      };
      analyserRafRef.current = requestAnimationFrame(tick);
    } catch {
      // Fallback: animated bars driven by speech state
    }
  }, []);

  // Forward declarations for cyclic conversational turns
  const askQuestionAtRef = useRef(null);
  const handleTurnSubmittedRef = useRef(null);

  // ── Start Continuous Listening with 3-Second Silence + Filler Protection ────
  const startListening = useCallback((targetPhase) => {
    stopRecognition();
    if (micMutedRef.current) return;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    startAudioMeter();
    transcriptRef.current = "";
    setLiveTranscript("");

    const launchRec = () => {
      if (phaseRef.current !== targetPhase || micMutedRef.current) return;

      const rec = new SpeechRec();
      rec.lang = "en-IN";
      rec.continuous = true;
      rec.interimResults = true;

      let committedFinal = transcriptRef.current;

      const armSilenceTimer = (currentText) => {
        clearSilenceTimers();
        const cleaned = stripFillers(currentText);
        // Only arm the 3-second auto-capture countdown once there is real non-filler speech
        const minLen = targetPhase === "listening_consent" ? 2 : 4;
        if (cleaned.length < minLen) return;

        let remaining = 3;
        setSilenceCountdown(remaining);
        countdownIntervalRef.current = setInterval(() => {
          remaining -= 1;
          if (remaining > 0) {
            setSilenceCountdown(remaining);
          } else {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
        }, 1000);

        silenceTimerRef.current = setTimeout(() => {
          clearSilenceTimers();
          const finalClean = stripFillers(transcriptRef.current);
          if (finalClean && handleTurnSubmittedRef.current) {
            handleTurnSubmittedRef.current(finalClean, "voice");
          }
        }, 3200);
      };

      rec.onresult = (event) => {
        let newFinal = "";
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            newFinal += res[0].transcript + " ";
          } else {
            interim += res[0].transcript;
          }
        }

        if (newFinal.trim()) {
          committedFinal = [committedFinal, newFinal.trim()].filter(Boolean).join(" ");
        }

        const fullRaw = [committedFinal, interim.trim()].filter(Boolean).join(" ");
        transcriptRef.current = fullRaw;
        setLiveTranscript(fullRaw);

        // If candidate is making thinking sounds ("aaaa", "hmmm", "um"), reset silence timer
        // so they aren't cut off while thinking!
        if (isPureFiller(interim) && isPureFiller(newFinal)) {
          clearSilenceTimers();
          // Re-arm only after thinking sound stops
          armSilenceTimer(fullRaw);
        } else {
          armSilenceTimer(fullRaw);
        }
      };

      rec.onerror = () => {
        // Ignore transient no-speech errors
      };

      rec.onend = () => {
        // Auto-restart if still in listening phase (bridges Chrome's internal timeout)
        if (phaseRef.current === targetPhase && !micMutedRef.current && recognitionRef.current === rec) {
          setTimeout(launchRec, 120);
        }
      };

      recognitionRef.current = rec;
      try {
        rec.start();
      } catch {
        /* ignore already-started recognition errors */
      }
    };

    launchRec();
  }, [clearSilenceTimers, startAudioMeter, stopRecognition]);

  // ── Ask Question at Index ───────────────────────────────────────────────────
  const askQuestionAt = useCallback((idx) => {
    const q = questionsRef.current[idx];
    if (!q) return;

    setCurrentIndex(idx);
    indexRef.current = idx;
    setVoicePhase("elena_speaking");
    phaseRef.current = "elena_speaking";
    questionStartTimeRef.current = Date.now();

    const spokenText = `Question ${idx + 1}: ${q.question}`;
    pushChat("elena", spokenText, "question");

    speakAsElena(spokenText, () => {
      setVoicePhase("listening_answer");
      phaseRef.current = "listening_answer";
      questionStartTimeRef.current = Date.now();
      startListening("listening_answer");
    });
  }, [pushChat, speakAsElena, startListening]);

  askQuestionAtRef.current = askQuestionAt;

  // ── Handle Student Turn (Consent or Answer) ─────────────────────────────────
  const handleTurnSubmitted = useCallback(async (rawText, inputMode = "voice") => {
    const cleaned = stripFillers(rawText);
    if (!cleaned) return;

    stopRecognition();
    setLiveTranscript("");
    setTypedInput("");
    transcriptRef.current = "";

    const stage = phaseRef.current;

    // 1) Greeting Consent Turn ("Are you ready?")
    if (stage === "listening_consent") {
      pushChat("student", cleaned, "answer");
      const isNo = /\b(no|nope|not ready|not now|later|cancel|stop|don'?t|nahi)\b/i.test(cleaned);
      const isYes = /\b(yes|yeah|yep|yup|ready|sure|start|ok|okay|let'?s|go|begin|haan|ji)\b/i.test(cleaned);

      if (isNo && !isYes) {
        setVoicePhase("closing");
        phaseRef.current = "closing";
        const byeText = "Got it, we are closing this session. Whenever you feel ready, start a new Voice Practice anytime.";
        pushChat("elena", byeText, "system");
        completeVivaSession(sessionIdRef.current, {
          conversationLog: chatRef.current,
          status: "declined",
        }).catch(() => {});
        speakAsElena(byeText, () => {
          stopAudioMeter();
          setScreen("picker");
        });
        return;
      }

      // Affirmative (or eager to begin) -> Start Q1!
      askQuestionAtRef.current(0);
      return;
    }

    // 2) Viva Question Answer Turn
    if (stage === "listening_answer") {
      const idx = indexRef.current;
      pushChat("student", cleaned, "answer");
      setVoicePhase("evaluating");
      phaseRef.current = "evaluating";

      try {
        const responseMs = Date.now() - questionStartTimeRef.current;
        const res = await submitVivaAnswer(sessionIdRef.current, {
          questionIndex: idx,
          transcript: cleaned,
          inputMode,
          responseMs,
        });

        if (res.success) {
          const ev = res.evaluation;
          const isRight = ev.score >= 70;
          const isClose = ev.score >= 50 && ev.score < 70;
          const verdictPrefix = isRight
            ? `That's right, ${studentName}!`
            : isClose
            ? `Almost there, ${studentName}.`
            : `Not quite, ${studentName}.`;
          const feedbackMsg = `${verdictPrefix} ${ev.feedback}`;

          pushChat("elena", feedbackMsg, "feedback", ev.score);
          setVoicePhase("elena_speaking");
          phaseRef.current = "elena_speaking";

          speakAsElena(feedbackMsg, () => {
            const total = questionsRef.current.length;
            if (idx < total - 1) {
              const transitionText = "Let's get started with the next question.";
              pushChat("elena", transitionText, "system");
              speakAsElena(transitionText, () => {
                askQuestionAtRef.current(idx + 1);
              });
            } else {
              // Session complete!
              const closingText = `Well done, ${studentName}! We have completed all ${total} questions. Your overall score is ${res.overallScore} percent. Let's review how you did!`;
              pushChat("elena", closingText, "system");
              setVoicePhase("closing");
              phaseRef.current = "closing";

              completeVivaSession(sessionIdRef.current, {
                conversationLog: chatRef.current,
                status: "completed",
              })
                .then(() => getVivaHistory())
                .then((h) => { if (h?.success) setHistory(h.sessions || []); })
                .catch(() => {});

              speakAsElena(closingText, async () => {
                stopAudioMeter();
                const fullRes = await getVivaResult(sessionIdRef.current).catch(() => null);
                if (fullRes?.success) {
                  setResultsData(fullRes);
                  setScreen("results");
                }
              });
            }
          });
        }
      } catch (err) {
        setError(err.message);
        setVoicePhase("listening_answer");
        phaseRef.current = "listening_answer";
        startListening("listening_answer");
      }
    }
  }, [pushChat, speakAsElena, startListening, stopAudioMeter, stopRecognition, studentName]);

  handleTurnSubmittedRef.current = handleTurnSubmitted;

  // ── Start Viva Session ──────────────────────────────────────────────────────
  const handleStartSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await startVivaSession({
        class: selectedClass,
        subject: selectedSubject,
        chapterNo: selectedChapterNo || undefined,
        mode,
        count: questionCount,
      });

      if (res.success && res.questions?.length > 0) {
        setSessionId(res.sessionId);
        sessionIdRef.current = res.sessionId;
        setQuestions(res.questions);
        questionsRef.current = res.questions;
        setCurrentIndex(0);
        indexRef.current = 0;
        setChatMessages([]);
        chatRef.current = [];
        setLiveTranscript("");
        setTypedInput("");
        setScreen("viva");

        const chapterLabel = selectedChapterNo
          ? chapters.find((c) => String(c.chapterNo) === String(selectedChapterNo))?.chapterTitle || `Chapter ${selectedChapterNo}`
          : "all key chapters";

        const greeting = `Hi ${studentName}, hope you are doing well! Let's get started with your ${selectedSubject} voice practice on ${chapterLabel}. Are you ready?`;

        setVoicePhase("elena_speaking");
        phaseRef.current = "elena_speaking";
        pushChat("elena", greeting, "greeting");

        speakAsElena(greeting, () => {
          setVoicePhase("listening_consent");
          phaseRef.current = "listening_consent";
          startListening("listening_consent");
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSessionEarly = async () => {
    stopElenaSpeech();
    stopRecognition();
    stopAudioMeter();
    if (sessionIdRef.current && chatRef.current.length > 0) {
      await completeVivaSession(sessionIdRef.current, {
        conversationLog: chatRef.current,
        status: "completed",
      }).catch(() => {});
      getVivaHistory().then((h) => { if (h?.success) setHistory(h.sessions || []); }).catch(() => {});
    }
    setScreen("picker");
  };

  const handleOpenHistoryReview = async (pastSessionId) => {
    try {
      setLoading(true);
      const res = await getVivaResult(pastSessionId);
      if (res.success) {
        setModalItems(res.items || []);
        setModalLog(res.conversationLog || []);
        setModalSubject(res.session?.subject || "");
        setModalRating(res.session?.rating || 0);
        setModalRatingLabel(res.session?.ratingLabel || "");
        setModalInitialTab(res.conversationLog?.length > 0 ? "transcript" : "all");
        setIsModalOpen(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const theme = getSubjectTheme(currentQuestion?.subject || selectedSubject);
  const isListeningPhase = voicePhase === "listening_consent" || voicePhase === "listening_answer";

  return (
    <>
      <Helmet>
        <title>Voice Practice | Kanthast School</title>
        <meta name="description" content="Conversational Voice Practice with Elena, live transcription, and instant feedback." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div
        className={
          screen === "viva"
            ? "w-full max-w-7xl mx-auto px-3 sm:px-5 md:px-6 py-2 sm:py-3 min-h-[calc(100dvh-var(--navbar-h,4rem))] flex flex-col"
            : "max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8 min-h-screen"
        }
      >
        {/* Top Breadcrumb */}
        <div className={`flex items-center justify-between ${screen === "viva" ? "mb-2.5" : "mb-6"}`}>
          <Link
            to="/practice"
            onClick={() => {
              if (screen === "viva") {
                stopElenaSpeech();
                stopRecognition();
                stopAudioMeter();
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-ink transition-colors"
          >
            <FiArrowLeft size={14} /> Practice Studio
          </Link>

          {screen === "viva" && (
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-ink-subtle tabular-nums">
                {voicePhase === "listening_consent"
                  ? "Ready Check"
                  : `Question ${currentIndex + 1} of ${questions.length}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  const next = !isAudioMuted;
                  setIsAudioMuted(next);
                  audioMutedRef.current = next;
                  if (next) stopElenaSpeech();
                }}
                className="px-2.5 py-1 rounded-full border border-line bg-surface text-xs font-bold text-ink-muted hover:text-ink flex items-center gap-1"
                title={isAudioMuted ? "Unmute Elena Voice" : "Mute Elena Voice"}
              >
                {isAudioMuted ? <FiVolumeX size={13} /> : <FiVolume2 size={13} />}
                <span className="hidden sm:inline">{isAudioMuted ? "Muted" : "Elena Voice On"}</span>
              </button>
              <button
                type="button"
                onClick={handleEndSessionEarly}
                className="px-2.5 py-1 rounded-full border border-critical/30 bg-critical-soft text-critical text-xs font-bold flex items-center gap-1"
              >
                <FiSquare size={11} /> End Session
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-3 p-3 rounded-xl bg-critical-soft border border-critical/30 text-critical text-xs font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-3 underline">Dismiss</button>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            SCREEN 1: SETUP & CONVERSATION HISTORY
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
                  <Eyebrow icon={FiMic}>Voice Practice · Elena</Eyebrow>
                  <span className="text-micro font-bold uppercase tracking-[0.08em] px-2.5 py-0.5 rounded-full bg-surface border border-line text-ink-muted">
                    Class X Active
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-ink tracking-tight leading-[1.08]">
                  Speak with <Accent after=".">Elena</Accent>
                </h1>
                <p className="mt-2.5 text-sm sm:text-base text-ink-muted max-w-xl leading-relaxed">
                  Practice board-style questions aloud in a 60/40 voice room. Elena listens past thinking pauses, checks your answer, and saves the transcript.
                </p>
              </div>

              {/* Class Scope Pill */}
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
                    <option value="11">Class XI (Coming soon)</option>
                    <option value="12">Class XII (Coming soon)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Subject Cards */}
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
                      <div className="ps-icon-well">
                        <FiBookOpen size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-extrabold font-display text-ink text-base leading-tight">
                          {s.subject}
                        </h3>
                        <p className="text-xs text-ink-muted mt-1 tabular-nums">
                          {s.questionCount} prompts · {s.chapterCount} chapters
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

            {/* Chapter & Session Settings */}
            <div className="ps-card p-5 sm:p-7 space-y-6">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold font-display text-ink">
                    02 · Configure Voice Session
                  </h2>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Pick chapter scope, Elena&apos;s coaching style, and session length.
                  </p>
                </div>
                <span className="text-micro font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-soft text-brand tabular-nums">
                  {selectedChapterNo
                    ? `${chapters.find((c) => String(c.chapterNo) === String(selectedChapterNo))?.questionCount || 0} prompts ready`
                    : `${subjects.find((s) => s.subject === selectedSubject)?.questionCount || 0} prompts available`}
                </span>
              </div>

              {/* Chapter Picker: Sleek Styled Select + Quick Pills */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-subtle">
                  Chapter Scope
                </label>
                <div className="relative">
                  <select
                    value={selectedChapterNo}
                    onChange={(e) => setSelectedChapterNo(e.target.value)}
                    className="w-full appearance-none pl-4 pr-10 py-3 rounded-2xl border border-line bg-surface-sunken text-ink font-semibold text-sm transition-colors hover:border-line-strong focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 cursor-pointer"
                  >
                    <option value="">
                      All Chapters ({subjects.find((s) => s.subject === selectedSubject)?.questionCount || 0} prompts)
                    </option>
                    {chapters.map((ch) => (
                      <option key={ch.chapterNo} value={ch.chapterNo}>
                        Ch {ch.chapterNo}: {ch.chapterTitle} ({ch.questionCount} prompts)
                      </option>
                    ))}
                  </select>
                  <FiChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
                  />
                </div>

                {chapters.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedChapterNo("")}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        selectedChapterNo === ""
                          ? "bg-brand text-brand-fg border-brand shadow-sm"
                          : "bg-surface-sunken text-ink-muted border-line hover:border-line-strong hover:text-ink"
                      }`}
                    >
                      All Chapters
                    </button>
                    {chapters.map((ch) => {
                      const active = String(selectedChapterNo) === String(ch.chapterNo);
                      return (
                        <button
                          key={ch.chapterNo}
                          type="button"
                          onClick={() => setSelectedChapterNo(String(ch.chapterNo))}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            active
                              ? "bg-brand text-brand-fg border-brand shadow-sm font-bold"
                              : "bg-surface-sunken text-ink-muted border-line hover:border-line-strong hover:text-ink"
                          }`}
                        >
                          Ch {ch.chapterNo}: {ch.chapterTitle}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Persona & Length 2-Column Grid */}
              <div className="grid md:grid-cols-12 gap-5">
                {/* Elena's Persona */}
                <div className="md:col-span-7 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-subtle">
                    Elena&apos;s Persona
                  </label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      {
                        id: "standard",
                        label: "Supportive Coach",
                        desc: "Warm pacing with gentle nudges on missed NCERT terms.",
                        icon: FiSmile,
                      },
                      {
                        id: "strict",
                        label: "Strict Board",
                        desc: "CBSE external examiner rigor demanding precise phrasing.",
                        icon: FiShield,
                      },
                    ].map((p) => {
                      const PIcon = p.icon;
                      const active = mode === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setMode(p.id)}
                          className={`ps-pressable relative text-left p-3.5 rounded-control border flex items-start gap-3 ${
                            active
                              ? "border-brand bg-brand-soft/35 ring-2 ring-brand/20 shadow-e1"
                              : "border-line bg-surface-sunken/70 hover:border-line-strong hover:bg-surface-sunken"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                              active
                                ? "bg-brand text-brand-fg"
                                : "bg-surface text-ink-muted border border-line"
                            }`}
                          >
                            <PIcon size={17} />
                          </div>
                          <div className="min-w-0 flex-1 pr-4">
                            <p className="text-sm font-bold text-ink leading-tight">{p.label}</p>
                            <p className="text-micro text-ink-muted leading-snug mt-1">{p.desc}</p>
                          </div>
                          {active && (
                            <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-brand text-brand-fg flex items-center justify-center">
                              <FiCheck size={10} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Session Length Segmented Control */}
                <div className="md:col-span-5 space-y-2 flex flex-col">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-subtle">
                    Session Length
                  </label>
                  <div className="flex-1 rounded-2xl border border-line bg-surface-sunken p-1.5 grid grid-cols-3 gap-1.5 items-stretch">
                    {[
                      { n: 3, est: "~2 min" },
                      { n: 5, est: "~4 min" },
                      { n: 8, est: "~6 min" },
                    ].map(({ n, est }) => {
                      const active = questionCount === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setQuestionCount(n)}
                          className={`rounded-xl py-2.5 px-2 flex flex-col items-center justify-center transition-all ${
                            active
                              ? "bg-surface text-ink shadow-e1 border border-line ring-1 ring-brand/20"
                              : "text-ink-muted hover:text-ink"
                          }`}
                        >
                          <span className={`text-sm font-extrabold tabular-nums ${active ? "text-brand" : ""}`}>
                            {n} Qs
                          </span>
                          <span className="text-micro text-ink-subtle mt-0.5">{est}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Footer with Live Summary */}
              <div className="pt-4 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-xs text-ink-muted flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-micro">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Voice + Chat Ready
                  </span>
                  <span className="font-medium">
                    <strong className="text-ink">{selectedSubject}</strong>
                    {" · "}
                    {selectedChapterNo ? `Ch ${selectedChapterNo}` : "All Chapters"}
                    {" · "}
                    {mode === "strict" ? "Strict Board" : "Supportive"}
                    {" · "}
                    {questionCount} Questions
                  </span>
                </div>

                <button
                  onClick={handleStartSession}
                  disabled={loading}
                  className="ps-pressable px-6 py-3 rounded-control bg-brand text-brand-fg text-sm font-bold flex items-center justify-center gap-2 shadow-e2 hover:bg-brand-hover disabled:opacity-60"
                >
                  <FiMic size={16} />
                  <span>{loading ? "Connecting Elena..." : "Start Voice Practice with Elena"}</span>
                  <FiArrowRight size={15} />
                </button>
              </div>
            </div>

            {/* Conversation History with Score & Rating */}
            {history.length > 0 && (
              <div>
                <h2 className="text-base font-bold font-display text-ink mb-3 flex items-center gap-2">
                  <FiClock size={16} className="text-ink-subtle" /> Past Voice Sessions &amp; Ratings
                </h2>
                <div className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
                  {history.slice(0, 10).map((s) => {
                    const isGood = (s.overallScore || 0) >= 70;
                    const dateStr = s.completedAt
                      ? new Date(s.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                      : "—";
                    return (
                      <button
                        key={s._id}
                        onClick={() => handleOpenHistoryReview(s._id)}
                        className="w-full text-left flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-surface-sunken transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-ink truncate">
                            {s.subject} • {s.chapterTitle || (s.chapterNo ? `Ch ${s.chapterNo}` : "All Chapters")}
                          </p>
                          <div className="flex items-center gap-2.5 mt-0.5 text-xs text-ink-subtle">
                            <StarRating rating={s.rating || 0} size={12} />
                            <span>{s.ratingLabel || "Completed"}</span>
                            <span>• {s.strongCount}/{s.totalQuestions} strong</span>
                            <span>• {dateStr}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`text-sm font-extrabold tabular-nums ${isGood ? "text-positive" : "text-caution"}`}>
                            {s.overallScore}%
                          </span>
                          <span className="text-xs font-semibold text-brand">Transcript →</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Motion.div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            SCREEN 2: 60 / 40 SPLIT VOICE VIVA STUDIO
           ═════════════════════════════════════════════════════════════════════ */}
        {screen === "viva" && (
          <div className="viva-split-grid">
            {/* ── LEFT 60%: REAL-TIME VOICE & SPEAKING STAGE ──────────────── */}
            <div className="viva-voice-stage p-4 sm:p-6">
              {/* Stage Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: theme.softBg, color: theme.text }}
                  >
                    {selectedSubject}
                  </span>
                  {currentQuestion && voicePhase !== "listening_consent" && (
                    <span className="text-xs font-semibold text-ink-subtle">
                      Ch {currentQuestion.chapterNo}: {currentQuestion.chapterTitle}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  Elena • {mode === "strict" ? "Strict" : "Coach"}
                </span>
              </div>

              {/* Centerpiece: Elena Voice Orb + Candidate Equalizer */}
              <div className="flex-1 flex flex-col items-center justify-center text-center py-4 space-y-5">
                <div
                  className={`elena-orb-wrap ${
                    voicePhase === "elena_speaking"
                      ? "is-speaking"
                      : isListeningPhase
                      ? "is-listening"
                      : ""
                  }`}
                >
                  <div className="elena-orb-ring elena-orb-ring-1" />
                  <div className="elena-orb-ring elena-orb-ring-2" />
                  <div className="elena-orb-core">
                    {voicePhase === "elena_speaking" ? (
                      <FiVolume2 size={34} />
                    ) : isListeningPhase ? (
                      <FiMic size={34} />
                    ) : (
                      <FiZap size={32} />
                    )}
                  </div>
                </div>

                {/* Live State Label */}
                <div className="space-y-1.5 max-w-lg">
                  <p className="text-sm font-extrabold uppercase tracking-wider text-ink">
                    {voicePhase === "elena_speaking" && "Elena is speaking..."}
                    {voicePhase === "listening_consent" && "Elena is listening — Say \"Yes\" to begin"}
                    {voicePhase === "listening_answer" && (
                      silenceCountdown
                        ? `Pause detected — capturing in ${silenceCountdown}s...`
                        : "Listening to your answer..."
                    )}
                    {voicePhase === "evaluating" && "Elena is evaluating your answer..."}
                    {voicePhase === "closing" && "Wrapping up your session..."}
                  </p>

                  {/* Active Question Display */}
                  {currentQuestion && voicePhase !== "listening_consent" && (
                    <p className="text-base sm:text-lg font-bold font-display text-ink leading-snug px-2">
                      Q{currentIndex + 1}: {currentQuestion.question}
                    </p>
                  )}
                </div>

                {/* Candidate Live Audio Equalizer Bars */}
                <div className="candidate-eq-wrap" aria-hidden="true">
                  {eqLevels.map((h, i) => (
                    <div
                      key={i}
                      className="candidate-eq-bar"
                      style={{
                        height: isListeningPhase && !isMicMuted ? `${h}px` : "6px",
                        opacity: isListeningPhase && !isMicMuted ? 0.95 : 0.25,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Stage Controls */}
              <div className="flex items-center justify-center flex-wrap gap-2.5 pt-3 border-t border-line/70">
                <button
                  type="button"
                  onClick={() => {
                    const next = !isMicMuted;
                    setIsMicMuted(next);
                    micMutedRef.current = next;
                    if (next) {
                      stopRecognition();
                    } else if (isListeningPhase) {
                      startListening(voicePhase);
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    isMicMuted
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {isMicMuted ? <FiMicOff size={14} /> : <FiMic size={14} />}
                  {isMicMuted ? "Mic Muted" : "Mic Live"}
                </button>

                {isListeningPhase && stripFillers(liveTranscript || typedInput).length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleTurnSubmitted(liveTranscript || typedInput, "voice")}
                    className="btn-3d btn-3d-primary text-xs px-4 py-2 flex items-center gap-1.5"
                  >
                    <FiSend size={13} /> Submit Now
                  </button>
                )}

                {voicePhase === "listening_answer" && currentQuestion && (
                  <button
                    type="button"
                    onClick={() => {
                      stopRecognition();
                      setVoicePhase("elena_speaking");
                      phaseRef.current = "elena_speaking";
                      speakAsElena(`Question ${currentIndex + 1}: ${currentQuestion.question}`, () => {
                        setVoicePhase("listening_answer");
                        phaseRef.current = "listening_answer";
                        startListening("listening_answer");
                      });
                    }}
                    className="px-3.5 py-2 rounded-full text-xs font-bold border border-line bg-surface-sunken text-ink-muted hover:text-ink flex items-center gap-1.5"
                  >
                    <FiRotateCw size={13} /> Repeat Q
                  </button>
                )}
              </div>
            </div>

            {/* ── RIGHT 40%: REAL-TIME CHAT TRANSCRIPT ────────────────────── */}
            <div className="viva-chat-panel">
              <div className="px-4 py-3 border-b border-line bg-surface-sunken flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiMessageSquare size={15} className="text-brand" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-ink">
                    Live Transcription
                  </span>
                </div>
                <span className="text-micro font-semibold text-ink-subtle tabular-nums">
                  {chatMessages.length} turns
                </span>
              </div>

              {/* Scrollable Chat Feed */}
              <div
                ref={chatScrollRef}
                className="flashcard-scroll-body flex-1 min-h-0 p-4 space-y-3"
              >
                {chatMessages.map((msg, idx) => {
                  const isElena = msg.speaker === "elena";
                  return (
                    <Motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                      className={`flex ${isElena ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed border ${
                          isElena
                            ? "bg-surface-sunken border-line text-ink rounded-tl-sm"
                            : "bg-brand-soft/65 border-brand/25 text-ink rounded-tr-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-micro font-extrabold uppercase tracking-wider opacity-75">
                            {isElena ? "Elena" : studentName}
                          </span>
                          {typeof msg.score === "number" && (
                            <span
                              className={`text-micro font-extrabold px-2 py-0.5 rounded-full ${
                                msg.score >= 70
                                  ? "bg-emerald-500 text-white"
                                  : "bg-amber-500 text-white"
                              }`}
                            >
                              {msg.score}%
                            </span>
                          )}
                        </div>
                        <p>{msg.text}</p>
                      </div>
                    </Motion.div>
                  );
                })}

                {/* Live Interim Bubble while Student is Speaking */}
                {isListeningPhase && liveTranscript && (
                  <div className="flex justify-end">
                    <div className="max-w-[88%] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-xs sm:text-sm bg-brand/70 text-brand-fg italic border border-brand/30">
                      <span className="text-micro font-extrabold uppercase tracking-wider block opacity-75 mb-0.5">
                        {studentName} (Speaking...)
                      </span>
                      <p>{liveTranscript}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Text Fallback Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!isListeningPhase || !typedInput.trim()) return;
                  handleTurnSubmitted(typedInput, "text");
                }}
                className="p-3 border-t border-line bg-surface-sunken flex items-center gap-2"
              >
                <input
                  type="text"
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  disabled={!isListeningPhase}
                  placeholder={
                    isListeningPhase
                      ? "Or type your response here..."
                      : "Wait for Elena to finish speaking..."
                  }
                  className="flex-1 px-3 py-2 rounded-xl border border-line bg-surface text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brand disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!isListeningPhase || !typedInput.trim()}
                  className="w-9 h-9 rounded-xl bg-brand text-brand-fg flex items-center justify-center disabled:opacity-40"
                  aria-label="Send typed response"
                >
                  <FiSend size={14} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            SCREEN 3: SESSION RESULTS WITH SCORE, RATING & CLICKABLE REVIEW
           ═════════════════════════════════════════════════════════════════════ */}
        {screen === "results" && resultsData && (
          <Motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl mx-auto"
          >
            <div className="rounded-3xl border border-line bg-surface p-6 sm:p-10 shadow-e2 text-center space-y-6">
              {/* Animated SVG Score Ring */}
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                <svg className="w-32 h-32" viewBox="0 0 120 120">
                  <circle className="score-ring-track" cx="60" cy="60" r="52" />
                  <circle
                    className="score-ring-fill"
                    cx="60"
                    cy="60"
                    r="52"
                    stroke={resultsData.session.overallScore >= 70 ? "#10b981" : "#7c3aed"}
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={
                      2 * Math.PI * 52 * (1 - (resultsData.session.overallScore || 0) / 100)
                    }
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl sm:text-3xl font-extrabold font-display text-ink tabular-nums">
                    {resultsData.session.overallScore}%
                  </span>
                  <span className="text-micro font-bold uppercase tracking-wider text-ink-subtle">
                    Voice Score
                  </span>
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 mb-2">
                  <StarRating rating={resultsData.session.rating || 0} size={15} />
                  <span className="text-xs font-extrabold text-ink">
                    {resultsData.session.ratingLabel || "Completed"}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-ink">
                  Session Complete with Elena
                </h1>
                <p className="text-sm text-ink-muted mt-1">
                  {resultsData.session.subject} • Click any card below to inspect your conversation transcript or rubric breakdown.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    setModalItems(resultsData.items || []);
                    setModalLog(resultsData.conversationLog || []);
                    setModalSubject(resultsData.session.subject);
                    setModalRating(resultsData.session.rating || 0);
                    setModalRatingLabel(resultsData.session.ratingLabel || "");
                    setModalInitialTab("strong");
                    setIsModalOpen(true);
                  }}
                  className="clickable-stat-card p-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/15 text-center"
                >
                  <p className="text-2xl sm:text-3xl font-extrabold font-display text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {resultsData.session.strongCount}
                  </p>
                  <p className="text-xs font-bold text-ink mt-0.5">Strong Answers</p>
                  <p className="text-micro text-ink-subtle mt-0.5">Click to view</p>
                </button>

                <button
                  onClick={() => {
                    setModalItems(resultsData.items || []);
                    setModalLog(resultsData.conversationLog || []);
                    setModalSubject(resultsData.session.subject);
                    setModalRating(resultsData.session.rating || 0);
                    setModalRatingLabel(resultsData.session.ratingLabel || "");
                    setModalInitialTab("needs_polish");
                    setIsModalOpen(true);
                  }}
                  className="clickable-stat-card p-4 rounded-2xl border border-rose-500/25 bg-rose-500/10 hover:bg-rose-500/15 text-center"
                >
                  <p className="text-2xl sm:text-3xl font-extrabold font-display text-rose-600 dark:text-rose-400 tabular-nums">
                    {resultsData.session.needsWorkCount}
                  </p>
                  <p className="text-xs font-bold text-ink mt-0.5">Needs Polish</p>
                  <p className="text-micro text-ink-subtle mt-0.5">Click to review</p>
                </button>

                <button
                  onClick={() => {
                    setModalItems(resultsData.items || []);
                    setModalLog(resultsData.conversationLog || []);
                    setModalSubject(resultsData.session.subject);
                    setModalRating(resultsData.session.rating || 0);
                    setModalRatingLabel(resultsData.session.ratingLabel || "");
                    setModalInitialTab("transcript");
                    setIsModalOpen(true);
                  }}
                  className="clickable-stat-card p-4 rounded-2xl border border-violet-500/25 bg-violet-500/10 hover:bg-violet-500/15 text-center"
                >
                  <p className="text-2xl sm:text-3xl font-extrabold font-display text-violet-600 dark:text-violet-400 tabular-nums">
                    {resultsData.conversationLog?.length || resultsData.session.totalQuestions}
                  </p>
                  <p className="text-xs font-bold text-ink mt-0.5">Full Transcript</p>
                  <p className="text-micro text-ink-subtle mt-0.5">Elena + You</p>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setScreen("picker")}
                  className="btn-3d btn-3d-secondary px-5 py-2.5 text-xs flex items-center gap-1.5"
                >
                  <FiRotateCw size={14} /> New Voice Session
                </button>
                <Link to="/practice" className="btn-3d btn-3d-primary px-5 py-2.5 text-xs flex items-center gap-1.5">
                  <FiZap size={14} /> Back to Practice Studio
                </Link>
              </div>
            </div>
          </Motion.div>
        )}
      </div>

      <VivaReviewModal
        key={isModalOpen ? modalInitialTab : "closed"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        items={modalItems}
        conversationLog={modalLog}
        initialTab={modalInitialTab}
        subject={modalSubject}
        rating={modalRating}
        ratingLabel={modalRatingLabel}
      />
    </>
  );
}
