// pages/PracticeStudio.jsx
// Practice Studio hub — Kanthast editorial atelier uniting MCQ Practice, Flashcards, and Viva Coach.
import { createElement, useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  FiZap, FiLayers, FiMic, FiArrowRight, FiTrendingUp,
  FiClock, FiCheckCircle, FiStar, FiActivity, FiPlay, FiCompass
} from "react-icons/fi";
import { Eyebrow, Accent } from "../components/ui/Brandmarks";
import {
  getMcqHistory,
  getMcqStats,
  getFlashcardHistory,
  getFlashcardStats,
  getVivaHistory,
  getVivaStats,
} from "../utils/practiceApi";
import "../styles/practice-studio.css";

const hasAuth = () =>
  Boolean(localStorage.getItem("kanthastSchoolToken") && localStorage.getItem("kanthastSchoolUser"));

const getUser = () => {
  try { return JSON.parse(localStorage.getItem("kanthastSchoolUser") || "null"); }
  catch { return null; }
};

const MODULE_META = {
  mcq: {
    index: "01",
    tag: "Recall",
    label: "MCQ Practice",
    icon: FiZap,
    wellTone: "",
    to: "/practice/mcq",
  },
  flashcards: {
    index: "02",
    tag: "Spaced Memory",
    label: "Flashcards",
    icon: FiLayers,
    wellTone: "is-positive",
    to: "/practice/flashcards",
  },
  viva: {
    index: "03",
    tag: "Speak & Learn",
    label: "Voice Practice",
    icon: FiMic,
    wellTone: "is-caution",
    to: "/practice/voice",
  },
};

function formatShortDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatRelative(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

// ── Editorial Stat Cell ───────────────────────────────────────────────────────
function StudioStat({ label, value, suffix, note, icon, wellTone = "" }) {
  return (
    <div className="ps-card p-4 sm:p-5 flex items-start gap-3.5">
      <div className={`ps-icon-well ${wellTone}`}>
        {createElement(icon, { size: 19 })}
      </div>
      <div className="min-w-0 flex-1">
        <dt className="text-micro font-bold uppercase tracking-[0.1em] text-ink-subtle truncate">
          {label}
        </dt>
        <dd className="mt-1 flex items-baseline gap-1.5 font-display font-extrabold text-2xl leading-none tracking-tight text-ink tabular-nums">
          <span>{value}</span>
          {suffix && <span className="text-xs font-semibold text-ink-subtle tracking-normal">{suffix}</span>}
        </dd>
        {note && <p className="mt-1.5 text-micro text-ink-muted truncate">{note}</p>}
      </div>
    </div>
  );
}

// ── Editorial Module Card ─────────────────────────────────────────────────────
function AtelierModuleCard({ meta, tagline, statusPill, latestLine, cta = "Open module" }) {
  const Icon = meta.icon;
  return (
    <Link to={meta.to} className="block group h-full">
      <div className="ps-card ps-card-interactive p-5 sm:p-6 flex flex-col h-full">
        {/* Top editorial row */}
        <div className="flex items-start justify-between gap-3">
          <div className={`ps-icon-well ${meta.wellTone}`}>
            <Icon size={20} />
          </div>
          <div className="flex items-center gap-2">
            {statusPill ? (
              <span className="text-micro font-bold px-2.5 py-0.5 rounded-full bg-brand-soft text-brand">
                {statusPill}
              </span>
            ) : (
              <span className="text-micro font-bold uppercase tracking-[0.1em] text-ink-subtle tabular-nums">
                {meta.index} · {meta.tag}
              </span>
            )}
          </div>
        </div>

        {/* Typographic Core */}
        <div className="mt-4 flex-1">
          <h3 className="text-lg font-extrabold font-display text-ink tracking-tight">
            {meta.label}
          </h3>
          <p className="mt-1.5 text-sm text-ink-muted leading-relaxed">
            {tagline}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-line flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink-subtle truncate">
              {latestLine || cta}
            </p>
          </div>
          <span className="ps-go-pill" aria-hidden="true">
            <FiArrowRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Unified History Row ───────────────────────────────────────────────────────
function LedgerRow({ item }) {
  const meta = MODULE_META[item.module];
  const Icon = meta.icon;
  const pct = item.score ?? 0;
  const isGood = pct >= 70;

  return (
    <Link
      to={item.linkTo || meta.to}
      className="flex items-center gap-3.5 py-3.5 px-5 hover:bg-surface-sunken/60 transition-colors group"
    >
      <div className={`ps-icon-well ${meta.wellTone} !w-10 !h-10`}>
        <Icon size={16} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-micro font-bold uppercase tracking-wider text-ink-subtle">
            {meta.label}
          </span>
          <span className="text-ink-subtle">·</span>
          <p className="text-sm font-bold text-ink truncate">{item.title}</p>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-ink-muted truncate">
          {item.rating > 0 && (
            <span className="inline-flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <FiStar
                  key={n}
                  size={11}
                  className={n <= item.rating ? "fill-amber-400 text-amber-400" : "text-line-strong"}
                />
              ))}
            </span>
          )}
          <span>{item.subtitle}</span>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-extrabold tabular-nums ${isGood ? "text-positive" : "text-caution"}`}>
          {pct}%
        </p>
        <p className="text-micro text-ink-subtle tabular-nums">
          {formatRelative(item.date) || formatShortDate(item.date)}
        </p>
      </div>

      <FiArrowRight
        size={14}
        className="text-ink-subtle opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hidden sm:block"
      />
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PracticeStudio() {
  const user = getUser();
  const navigate = useNavigate();
  const firstName = user?.firstName || user?.name?.trim().split(/\s+/)[0] || "";

  const [mcqHistory, setMcqHistory] = useState([]);
  const [mcqStats, setMcqStats] = useState([]);
  const [flashcardHistory, setFlashcardHistory] = useState([]);
  const [flashcardStats, setFlashcardStats] = useState(null);
  const [vivaHistory, setVivaHistory] = useState([]);
  const [vivaStats, setVivaStats] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasAuth()) {
      navigate("/login", { replace: true });
      return;
    }

    Promise.all([
      getMcqHistory().catch(() => ({ sessions: [] })),
      getMcqStats().catch(() => ({ stats: [] })),
      getFlashcardHistory().catch(() => ({ history: [] })),
      getFlashcardStats().catch(() => null),
      getVivaHistory().catch(() => ({ sessions: [] })),
      getVivaStats().catch(() => null),
    ])
      .then(([mh, ms, fh, fs, vh, vs]) => {
        setMcqHistory(mh.sessions || []);
        setMcqStats(ms.stats || []);
        setFlashcardHistory(fh.history || []);
        if (fs && fs.success) setFlashcardStats(fs);
        setVivaHistory(vh.sessions || []);
        if (vs && vs.success) setVivaStats(vs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [navigate]);

  const unifiedHistory = useMemo(() => {
    const items = [];

    for (const s of mcqHistory) {
      items.push({
        id: `mcq-${s._id}`,
        module: "mcq",
        title: `${s.subject}${s.chapterNo ? ` · Ch ${s.chapterNo}` : ""}`,
        subtitle: `${s.correctCount ?? 0}/${s.totalQuestions ?? 0} correct`,
        score: Math.round(s.score ?? 0),
        date: s.completedAt || s.createdAt,
        linkTo: "/practice/mcq",
      });
    }

    for (const f of flashcardHistory) {
      if (f.status && f.status !== "completed") continue;
      items.push({
        id: `fc-${f._id}`,
        module: "flashcards",
        title: `${f.subject}${f.chapterTitle ? ` · ${f.chapterTitle}` : f.chapterNo ? ` · Ch ${f.chapterNo}` : ""}`,
        subtitle: `${f.cardsTotal ?? 0} cards · ${(f.goodCount ?? 0) + (f.easyCount ?? 0)} mastered`,
        score: Math.round(f.masteryScore ?? 0),
        date: f.completedAt || f.createdAt,
        linkTo: "/practice/flashcards",
      });
    }

    for (const v of vivaHistory) {
      items.push({
        id: `viva-${v._id}`,
        module: "viva",
        title: `${v.subject}${v.chapterTitle ? ` · ${v.chapterTitle}` : v.chapterNo ? ` · Ch ${v.chapterNo}` : ""}`,
        subtitle: `${v.ratingLabel || "Rated"} · ${v.strongCount ?? 0}/${v.totalQuestions ?? 0} strong`,
        score: Math.round(v.overallScore ?? 0),
        rating: v.rating || 0,
        date: v.completedAt || v.createdAt,
        linkTo: `/practice/voice?review=${v._id}`,
      });
    }

    return items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [mcqHistory, flashcardHistory, vivaHistory]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === "all") return unifiedHistory;
    return unifiedHistory.filter((item) => item.module === historyFilter);
  }, [unifiedHistory, historyFilter]);

  const mostRecent = unifiedHistory[0] || null;
  const latestMcq = mcqHistory[0];
  const latestFlashcard = flashcardHistory.find((f) => !f.status || f.status === "completed");
  const latestViva = vivaHistory[0];

  const totalAttemptedMcqs = mcqStats.reduce((acc, s) => acc + (s.questionsAttempted || 0), 0);
  const avgMcqMastery = mcqStats.length
    ? Math.round(mcqStats.reduce((acc, s) => acc + s.mastery, 0) / mcqStats.length)
    : 0;

  const totalSessionsAll =
    mcqHistory.length +
    flashcardHistory.filter((f) => !f.status || f.status === "completed").length +
    vivaHistory.length;

  const subjectMasteryRows = useMemo(() => {
    const map = new Map();
    for (const s of mcqStats) {
      map.set(s.subject, {
        subject: s.subject,
        mcqMastery: s.mastery,
        questionsDone: s.questionsAttempted || 0,
        flashcardMastery: null,
      });
    }
    for (const fs of flashcardStats?.subjects || []) {
      const existing = map.get(fs.subject) || {
        subject: fs.subject,
        mcqMastery: null,
        questionsDone: 0,
        flashcardMastery: null,
      };
      existing.flashcardMastery = fs.avgMastery;
      existing.cardsDone = fs.cardsReviewed;
      map.set(fs.subject, existing);
    }
    return Array.from(map.values()).map((row) => {
      const scores = [row.mcqMastery, row.flashcardMastery].filter((v) => typeof v === "number");
      const combined = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      return { ...row, combined };
    });
  }, [mcqStats, flashcardStats]);

  return (
    <>
      <Helmet>
        <title>Practice Studio | Kanthast School</title>
        <meta name="description" content="Sharpen your skills with MCQ practice, flashcards and Voice Practice." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-7 md:py-11 space-y-8">
        {/* ── Editorial Asymmetric Hero (matches Dashboard.jsx) ───────────── */}
        <Motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-stretch"
        >
          {/* Left: Typographic Greeting */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="flex items-center gap-2.5 flex-wrap mb-3">
              <Eyebrow icon={FiZap}>Practice Studio</Eyebrow>
              <span className="text-micro font-bold uppercase tracking-[0.08em] px-2.5 py-0.5 rounded-full bg-surface border border-line text-ink-muted">
                Class X CBSE Live
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold font-display text-ink tracking-tight leading-[1.06]">
              {firstName ? (
                <>
                  Ready to practise, <Accent after=".">{firstName}</Accent>
                </>
              ) : (
                <>
                  Sharpen your <Accent after=".">recall</Accent>
                </>
              )}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-ink-muted max-w-xl leading-relaxed">
              Three focused modes — rapid-fire MCQs, spaced-repetition flashcards, and spoken Voice Practice with Elena.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-xs text-ink-subtle">
              <FiCompass size={14} className="text-brand flex-shrink-0" />
              <span>Active recall followed by spaced review turns syllabus chapters into confident board answers.</span>
            </p>
          </div>

          {/* Right: Focal Card (Most Recent Activity OR Recommended Start) */}
          <div className="lg:col-span-5">
            {mostRecent ? (
              <div className="ps-card h-full p-5 sm:p-6 flex flex-col justify-between bg-surface-raised">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-micro font-bold uppercase tracking-[0.1em] text-brand">
                      Last Practiced
                    </span>
                    <span className="text-micro font-medium text-ink-subtle tabular-nums">
                      {formatRelative(mostRecent.date)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-lg font-extrabold font-display text-ink leading-snug truncate">
                      {mostRecent.title}
                    </h2>
                    <span className={`text-lg font-extrabold font-display tabular-nums shrink-0 ${mostRecent.score >= 70 ? "text-positive" : "text-caution"}`}>
                      {mostRecent.score}%
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1">
                    {MODULE_META[mostRecent.module].label} · {mostRecent.subtitle}
                  </p>
                </div>

                <div className="mt-5 space-y-3.5">
                  <div className="practice-progress-bar">
                    <div
                      className="practice-progress-fill"
                      style={{ width: `${Math.max(mostRecent.score, 4)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Link
                      to={MODULE_META[mostRecent.module].to}
                      className="ps-pressable flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-control bg-brand text-brand-fg text-xs font-bold shadow-e1 hover:bg-brand-hover"
                    >
                      <FiPlay size={12} /> Practice Again
                    </Link>
                    {mostRecent.module === "viva" && (
                      <Link
                        to={mostRecent.linkTo}
                        className="ps-pressable inline-flex items-center justify-center px-4 py-2.5 rounded-control border border-line bg-surface text-ink text-xs font-bold hover:border-line-strong"
                      >
                        Transcript
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="ps-card h-full p-5 sm:p-6 flex flex-col justify-between bg-surface-raised">
                <div>
                  <span className="text-micro font-bold uppercase tracking-[0.1em] text-brand inline-block mb-2.5">
                    Recommended Start
                  </span>
                  <h2 className="text-lg font-extrabold font-display text-ink leading-snug">
                    Voice Practice with Elena
                  </h2>
                  <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">
                    Explain Class X NCERT concepts aloud in a 60/40 voice studio and get instant checkpoint feedback.
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-2.5">
                  <Link
                    to="/practice/voice"
                    className="ps-pressable flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-control bg-brand text-brand-fg text-xs font-bold shadow-e1 hover:bg-brand-hover"
                  >
                    <FiMic size={13} /> Start Speaking
                  </Link>
                  <Link
                    to="/practice/mcq"
                    className="ps-pressable inline-flex items-center justify-center px-4 py-2.5 rounded-control border border-line bg-surface text-ink text-xs font-bold hover:border-line-strong"
                  >
                    Quick MCQ
                  </Link>
                </div>
              </div>
            )}
          </div>
        </Motion.section>

        {/* Due SM-2 Review Bar */}
        {flashcardStats && flashcardStats.dueCount > 0 && (
          <div className="ps-card p-4 flex items-center justify-between gap-3 flex-wrap border-positive/30 bg-positive-soft/40">
            <div className="flex items-center gap-3">
              <div className="ps-icon-well is-positive !w-10 !h-10">
                <FiLayers size={17} />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">
                  {flashcardStats.dueCount} Flashcard{flashcardStats.dueCount > 1 ? "s" : ""} due for SM-2 spaced review today
                </p>
                <p className="text-xs text-ink-muted">
                  Reviewing right now reinforces recall before memory decays.
                </p>
              </div>
            </div>
            <Link
              to="/practice/flashcards"
              className="ps-pressable px-4 py-2 rounded-control bg-positive text-white text-xs font-bold"
            >
              Review Due Cards
            </Link>
          </div>
        )}

        {/* ── Unified Studio Metrics ─────────────────────────────────────── */}
        {!loading && totalSessionsAll > 0 && (
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <StudioStat
              label="Sessions Done"
              value={totalSessionsAll}
              note="Across all 3 modes"
              icon={FiActivity}
            />
            <StudioStat
              label="MCQ Accuracy"
              value={totalAttemptedMcqs > 0 ? `${avgMcqMastery}%` : "—"}
              note={totalAttemptedMcqs > 0 ? `${totalAttemptedMcqs} questions solved` : "No MCQs yet"}
              icon={FiCheckCircle}
            />
            <StudioStat
              label="Cards Reviewed"
              value={flashcardStats?.totalCardsReviewed || 0}
              note={flashcardStats?.dueCount ? `${flashcardStats.dueCount} due today` : "All caught up"}
              icon={FiLayers}
              wellTone="is-positive"
            />
            <StudioStat
              label="Voice Score"
              value={vivaStats?.totalSessions > 0 ? `${vivaStats.avgScore}%` : "—"}
              note={vivaStats?.totalSessions > 0 ? `${vivaStats.totalSessions} voice sessions` : "Start with Elena"}
              icon={FiMic}
              wellTone="is-caution"
            />
          </dl>
        )}

        {/* ── Three Practice Modules ─────────────────────────────────────── */}
        <section aria-labelledby="ps-modes-heading" className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <Eyebrow icon={FiLayers}>Study Modes</Eyebrow>
              <h2 id="ps-modes-heading" className="text-xl sm:text-2xl font-extrabold font-display text-ink mt-1">
                Choose your <Accent after=".">session</Accent>
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <AtelierModuleCard
              meta={MODULE_META.mcq}
              tagline="Rapid multiple-choice drills with instant explanations and mistake review."
              latestLine={
                latestMcq
                  ? `Last: ${latestMcq.subject} · ${Math.round(latestMcq.score ?? 0)}% (${formatShortDate(latestMcq.completedAt)})`
                  : "Start your first MCQ sprint"
              }
            />
            <AtelierModuleCard
              meta={MODULE_META.flashcards}
              tagline="Tactile 3D recall cards tuned with SuperMemo SM-2 intervals."
              statusPill={flashcardStats?.dueCount ? `${flashcardStats.dueCount} due` : null}
              latestLine={
                latestFlashcard
                  ? `Last: ${latestFlashcard.subject} · ${Math.round(latestFlashcard.masteryScore ?? 0)}% mastery`
                  : "Flip your first deck"
              }
            />
            <AtelierModuleCard
              meta={MODULE_META.viva}
              tagline="Speak your answers aloud with Elena, see live transcription, and get instant feedback."
              latestLine={
                latestViva
                  ? `Last: ${latestViva.subject} · ${latestViva.overallScore}% (${latestViva.ratingLabel || "Rated"})`
                  : "Talk with Elena"
              }
            />
          </div>
        </section>

        {/* ── Unified Activity Ledger + Subject Mastery ──────────────────── */}
        {unifiedHistory.length > 0 && (
          <div className="grid lg:grid-cols-12 gap-6">
            <section className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-lg font-extrabold font-display text-ink flex items-center gap-2">
                  <FiClock size={16} className="text-ink-subtle" /> Activity Ledger
                </h2>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {[
                    { id: "all", label: `All (${unifiedHistory.length})` },
                    { id: "mcq", label: `MCQ (${mcqHistory.length})` },
                    {
                      id: "flashcards",
                      label: `Cards (${flashcardHistory.filter((f) => !f.status || f.status === "completed").length})`,
                    },
                    { id: "viva", label: `Voice (${vivaHistory.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setHistoryFilter(tab.id)}
                      className={`ps-pressable px-3 py-1 rounded-full text-micro font-bold border whitespace-nowrap ${
                        historyFilter === tab.id
                          ? "bg-brand text-brand-fg border-brand"
                          : "bg-surface text-ink-muted border-line hover:border-line-strong"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ps-card divide-y divide-line overflow-hidden">
                {filteredHistory.length === 0 ? (
                  <div className="p-8 text-center text-xs text-ink-muted">
                    No sessions recorded in this mode yet.
                  </div>
                ) : (
                  filteredHistory.slice(0, 8).map((item) => <LedgerRow key={item.id} item={item} />)
                )}
              </div>
            </section>

            <section className="lg:col-span-5 space-y-3">
              <h2 className="text-lg font-extrabold font-display text-ink flex items-center gap-2">
                <FiTrendingUp size={16} className="text-ink-subtle" /> Subject Mastery
              </h2>
              <div className="ps-card divide-y divide-line overflow-hidden">
                {subjectMasteryRows.length === 0 ? (
                  <div className="p-8 text-center text-xs text-ink-muted">
                    Complete an MCQ or Flashcard set to track subject mastery.
                  </div>
                ) : (
                  subjectMasteryRows.map((s) => (
                    <div key={s.subject} className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-ink">{s.subject}</p>
                        <span
                          className={`text-sm font-extrabold tabular-nums ${
                            s.combined >= 70 ? "text-positive" : s.combined >= 45 ? "text-caution" : "text-critical"
                          }`}
                        >
                          {s.combined}%
                        </span>
                      </div>
                      <div className="practice-progress-bar">
                        <div className="practice-progress-fill" style={{ width: `${s.combined}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-micro text-ink-subtle tabular-nums">
                        <span>
                          {typeof s.mcqMastery === "number" ? `MCQ ${s.mcqMastery}% (${s.questionsDone} Qs)` : "MCQ —"}
                        </span>
                        <span>
                          {typeof s.flashcardMastery === "number"
                            ? `Cards ${s.flashcardMastery}% (${s.cardsDone || 0})`
                            : "Cards —"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        <p className="text-center text-xs text-ink-subtle pt-2">
          Curriculum coverage: Class X CBSE NCERT across Science, Mathematics, and Social Science. Students of all classes are welcome.
        </p>
      </div>
    </>
  );
}
