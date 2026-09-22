import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Image1 from "../assets/images/Image-1.png";
import Image2 from "../assets/images/Image-2.png";
import Image3 from "../assets/images/Image-3.png";
import Image4 from "../assets/images/Image-4.png";
import Image5 from "../assets/images/Image-5.png";
import { getMedicineUsmleContent, getProfile } from "../utils/authApi";
import {
  FaPlay, FaCheck, FaChartBar, FaBolt,
  FaChevronLeft, FaChevronRight,
} from "react-icons/fa";
import { useAppSettings } from "../utils/settings";
import { getLastWatched, formatRemaining } from "../utils/progress";
import {
  buildSchoolModules,
  getSchoolClassLabel,
  getSelectedSchoolClass,
  hasPaidForSchoolClass,
  isSchoolTrack,
} from "../utils/schoolTrack";

const IMAGES = [Image1, Image2, Image3, Image4, Image5];

const QUOTES = [
  "The good physician treats the disease; the great physician treats the patient who has the disease.",
  "Wherever the art of medicine is loved, there is also a love of humanity.",
  "Medicine is learned by the bedside and not in the classroom.",
  "To study medicine is to study humanity.",
  "The physician who knows only medicine knows not even medicine.",
  "Diagnosis is not the end, but the beginning of practice.",
  "The most important tool in medicine is a listening ear.",
  "Treat the patient, not the investigation.",
  "Every patient is a story — find its theme.",
  "When you hear hoofbeats, think horses — but know the zebras.",
  "History-taking is 80% of the diagnosis.",
  "Healing is a matter of time, but sometimes also a matter of opportunity.",
  "First, do no harm.",
  "Rare diseases are rare; common diseases present uncommonly.",
  "The art of medicine consists in amusing the patient while nature cures the disease.",
  "One of the first duties of a physician is to educate people not to take medicine.",
  "Empathy is the most evidence-based intervention in medicine.",
  "Humility is the foundation of all medical wisdom.",
  "Science advances, but the patient remains a human being.",
  "Communication is a clinical skill, not a soft skill.",
  "Active recall beats passive review every single time.",
  "Spaced repetition is your competitive edge over every rote learner.",
  "Test yourself often — retrieval practice is the superior study strategy.",
  "Interleaving subjects strengthens the connections between them.",
  "Struggle is where learning lives — embrace the hard questions.",
  "Teach what you just learned to cement it permanently.",
  "One wrong answer, analyzed deeply, is worth ten right ones skimmed.",
  "Focus on mechanisms — the details follow naturally.",
  "Understand the pathophysiology and every drug class becomes obvious.",
  "Mnemonics are scaffolding — build understanding, then remove the scaffold.",
  "Link every drug to mechanism, indication, and side effect immediately.",
  "Write summaries by hand — the pen cements memory that typing cannot.",
  "A well-drawn diagram replaces three paragraphs of notes.",
  "Sleep is not lost study time — it is when memories consolidate.",
  "Your brain rewires during rest, not just during study sessions.",
  "Review today what you learned yesterday — that gap is where retention lives.",
  "Clarity of concept precedes speed of recall.",
  "Read guidelines, not just textbooks — medicine evolves every year.",
  "Never memorize what you can derive from first principles.",
  "Volume of questions done separates good students from great ones.",
  "NEET PG rewards applied understanding, not raw memory.",
  "INI CET tests clinical reasoning first, facts second.",
  "USMLE Step 1 is a physiology exam wearing a factual disguise.",
  "Every question stem hides the diagnosis — read it twice.",
  "The distractor catches the person who half-understood.",
  "Eliminate, don't just select — distractors reveal the examiner's thinking.",
  "Time management in an exam is a skill; practice it deliberately.",
  "High-yield topics are high-yield because they are clinically important.",
  "Build stamina for long question papers the way athletes build endurance.",
  "Exam day performance is the output of every ordinary study day.",
  "Grand rounds now; exam hall later — they are the same skill.",
  "Know the step-one answer and the clinical extension of every concept.",
  "Mock exams are free previews of the real test — use them honestly.",
  "Analyse every mistake: pattern, concept gap, or time pressure?",
  "Review your wrong answers more than your right ones.",
  "Consistency beats intensity when intensity is temporary.",
  "Discipline is choosing what you want most over what you want now.",
  "Small daily wins create unstoppable long-term momentum.",
  "You don't rise to goals — you fall to your systems.",
  "The expert in anything was once a complete beginner.",
  "Progress, not perfection, is the standard.",
  "Motivation gets you started; habit keeps you going.",
  "Hard work beats talent when talent does not work hard.",
  "You are what you repeatedly do — excellence is a habit.",
  "The secret of getting ahead is simply getting started.",
  "Every hour of discipline today is an asset on exam day.",
  "Atomic habits compound into irreversible excellence.",
  "What you do in the dark will show up in the light.",
  "Champions are built in the sessions no one sees.",
  "Track your progress — what gets measured gets managed.",
  "Celebrate small wins; they fuel the long journey.",
  "Comparison is the thief of joy — compete with yesterday's self.",
  "Curiosity is the engine that keeps the medical mind alive.",
  "Burn to learn, not just to pass — the patient will know the difference.",
  "A single focused hour is worth three distracted ones.",
  "Your environment shapes your habits — design your study space with intent.",
  "Remove friction from good habits; add friction to bad ones.",
  "Rest is not a reward — it is a prerequisite for performance.",
  "The Pomodoro is not laziness — it is neuroscience in practice.",
  "Burnout is the occupational hazard of those who care the most.",
  "Self-care is not selfish — it is a prerequisite for caring for others.",
  "You cannot pour from an empty cup.",
  "A 10-minute walk resets focus better than a second coffee.",
  "Sleep, eat, move — the three pillars beneath every great mind.",
  "Mentors compress decades of learning into months — seek them out.",
  "The courage to say 'I don't know' is the beginning of real wisdom.",
  "Uncertainty is not weakness; it is the honest foundation of science.",
  "Teach others to learn faster yourself.",
  "Find your peak focus window and guard it fiercely.",
  "The long game always beats the short sprint in medicine.",
  "Build deep knowledge in one area, then let it illuminate the rest.",
  "Medicine is a calling; treat it with the reverence it deserves.",
  "The future of medicine belongs to those who never stop being students.",
  "Every system of the body tells a story — learn to read them all.",
  "One more question. One more concept. One more step forward.",
  "The best preparation for tomorrow is doing your best today.",
  "Knowledge is the antidote to fear.",
  "Great doctors are perpetual students.",
  "Stay humble — medicine humbles the most confident among us.",
  "Begin. The rest is just effort.",
];

function getDailyIndex() {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  return Math.floor((today - start) / 86400000) % QUOTES.length;
}

function buildSubjects(content) {
  return (content?.subjects || []).map((subject) => ({
    name: subject?.name?.trim() || "Unnamed Subject",
    subjectId: subject._id,
    chapters: (subject.chapters || []).map((chapter) => ({
      name: chapter.name || "Unnamed Chapter",
      chapterId: chapter._id,
      videoIds: (chapter.videos || []).map((v) => v._id).filter(Boolean),
    })),
  }));
}

function buildSchoolSubjectsFromModules(modules) {
  return Object.entries(modules).map(([subjectName, subject]) => ({
    name: subjectName,
    subjectId: subjectName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    chapters: subject.sections.map((section) => ({
      name: section.title,
      chapterId: section.id,
      videoIds: section.lectures.map((lecture) => lecture.videoId).filter(Boolean),
    })),
  }));
}

function getStreak() {
  try { return JSON.parse(localStorage.getItem("kanthastStreak") || "{}").count || 0; }
  catch { return 0; }
}

// ─── Circular SVG progress ─────────────────────────────────────────────────

function CircleProgress({ percent, size = 54, showLabel = true }) {
  const sw = 4;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (percent / 100) * circ;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={sw} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="#22d3ee" strokeWidth={sw}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold" style={{ fontSize: 11 }}>{percent}%</span>
        </div>
      )}
    </div>
  );
}

// Rebuild the /video query string the resume pointer was saved from.
function buildResumeHref(target) {
  const params = new URLSearchParams();
  if (target.module) params.set("module", target.module);
  if (target.section) params.set("section", target.section);
  if (target.title) params.set("title", target.title);
  if (target.duration) params.set("duration", target.duration);
  if (target.subjectId) params.set("subjectId", target.subjectId);
  if (target.chapterId) params.set("chapterId", target.chapterId);
  if (target.videoId) params.set("videoId", target.videoId);
  return `/video?${params.toString()}`;
}

// ─── Chapter card ──────────────────────────────────────────────────────────

function ChapterCard({ chapter, watched, index, compact, showProgressPercent, onClick }) {
  const chTotal = chapter.videoIds.length;
  const chWatched = chapter.videoIds.filter((id) => watched[id]).length;
  const chProgress = chTotal > 0 ? Math.round((chWatched / chTotal) * 100) : 0;

  return (
    // A real <button>: this is the dashboard's primary navigation and was
    // previously an <article onClick>, unreachable by keyboard entirely.
    <button
      type="button"
      onClick={onClick}
      aria-label={`${chapter.name} — ${
        chTotal > 0 ? `${chWatched} of ${chTotal} videos watched` : "no videos yet"
      }`}
      className={`relative flex-shrink-0 text-left ${compact ? "w-60 h-48" : "w-64 h-52"} rounded-card overflow-hidden border border-line shadow-e3 group cursor-pointer hover:border-brand hover:shadow-e4 transition-all duration-base ease-brand`}
    >
      <img
        src={IMAGES[index % IMAGES.length]}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-slow ease-brand"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent" />

      <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-white text-base font-bold leading-tight line-clamp-2">{chapter.name}</h3>
          <p className="text-white/70 text-xs mt-1">
            {chTotal > 0 ? `${chWatched}/${chTotal} videos` : "No videos yet"}
          </p>
        </div>
        {chTotal > 0 && showProgressPercent && (
          <div className="flex-shrink-0 bg-black/30 backdrop-blur-sm rounded-full p-0.5">
            <CircleProgress percent={chProgress} showLabel={showProgressPercent} />
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Carousel ──────────────────────────────────────────────────────────────

function ChapterCarousel({ chapters, watched, compact, showProgressPercent, onChapterClick }) {
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function check() {
      setCanLeft(el.scrollLeft > 4);
      setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }
    const t = setTimeout(check, 60);
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => { clearTimeout(t); el.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [chapters.length]);

  function scroll(dir) {
    scrollRef.current?.scrollBy({ left: dir * 290, behavior: "smooth" });
  }

  return (
    <div className="relative">
      {canLeft && (
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
        >
          <FaChevronLeft size={12} />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {chapters.map((chapter, i) => (
          <ChapterCard
            key={chapter.chapterId || chapter.name}
            chapter={chapter}
            watched={watched}
            index={i}
            compact={compact}
            showProgressPercent={showProgressPercent}
            onClick={onChapterClick ? () => onChapterClick(chapter) : undefined}
          />
        ))}
      </div>

      {canRight && (
        <button
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
        >
          <FaChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("kanthastUser") || "null");
  const settings = useAppSettings();
  const schoolMode = isSchoolTrack();
  const selectedSchoolClass = getSelectedSchoolClass();
  const selectedSchoolClassLabel = getSchoolClassLabel(selectedSchoolClass);
  const [subjects, setSubjects] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [profileVersion, setProfileVersion] = useState(0);
  // Lecture to offer as "Continue watching" (null once it is completed).
  const [resumeTarget] = useState(() => getLastWatched());

  const watched = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("kanthastWatched") || "{}"); }
    catch { return {}; }
  }, []);

  const dailyQuoteIndex = useMemo(getDailyIndex, []);
  const dailyQuote = schoolMode
    ? "Small visual wins every day turn hard chapters into confident answers."
    : QUOTES[dailyQuoteIndex];

  useEffect(() => {
    const token = localStorage.getItem("kanthastToken");
    if (!token) return;

    let mounted = true;
    getProfile(token)
      .then((data) => {
        if (!mounted || !data.user) return;
        localStorage.setItem("kanthastUser", JSON.stringify(data.user));
        setProfileVersion((version) => version + 1);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (schoolMode) {
          setSubjects(hasPaidForSchoolClass() ? buildSchoolSubjectsFromModules(buildSchoolModules(selectedSchoolClass)) : []);
          return;
        }
        const data = await getMedicineUsmleContent();
        if (!mounted) return;
        setSubjects(buildSubjects(data.content));
      } catch {
        if (!mounted) return;
        setSubjects([]);
      } finally {
        if (mounted) setContentLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [schoolMode, selectedSchoolClass, profileVersion]);

  const { totalVideos, watchedVideos } = useMemo(() => {
    const allIds = subjects.flatMap((s) => s.chapters.flatMap((ch) => ch.videoIds));
    return { totalVideos: allIds.length, watchedVideos: allIds.filter((id) => watched[id]).length };
  }, [subjects, watched]);

  const overallProgress = totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : 0;
  const streak = getStreak();
  const compact = settings.compactLayout;
  const showProgressPercent = settings.showProgressPercent;

  return (
    <div className={`min-h-screen bg-[radial-gradient(circle_at_top_left,_#e6f5ff,_#f8fafc_45%,_#eef2ff)] ${compact ? "px-3 md:px-4 py-6 md:py-8" : "px-4 md:px-6 py-8 md:py-10"}`}>
      <div className="max-w-7xl mx-auto">

        {/* ── Top card ── */}
        <div className={`rounded-3xl bg-white border border-slate-200 ${compact ? "p-5 md:p-6" : "p-6 md:p-8"} shadow-[0_20px_60px_rgba(2,6,23,0.06)]`}>

          {/* Welcome row */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
              </h1>
              <p className="text-slate-500 mt-1.5 text-sm">
                {schoolMode
                  ? hasPaidForSchoolClass()
                    ? `${selectedSchoolClassLabel} learning dashboard. Keep the next chapter moving.`
                    : "Choose and activate a class plan to start your School dashboard."
                  : "Build discipline daily. Your consistency compounds every session."}
              </p>
            </div>

            {/* Stat cards */}
            <div className={`grid grid-cols-2 md:grid-cols-4 ${compact ? "gap-2" : "gap-3"} w-full lg:w-auto lg:min-w-[480px]`}>
              {contentLoading ? (
                Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
              ) : (
                <>
                  <StatCard
                    title={schoolMode ? "Total Lessons" : "Total Videos"}
                    value={totalVideos}
                    icon={<FaPlay size={11} />}
                  />
                  <StatCard
                    title="Watched"
                    value={watchedVideos}
                    icon={<FaCheck size={11} />}
                  />
                  <StatCard
                    title="Progress"
                    value={`${overallProgress}%`}
                    icon={<FaChartBar size={11} />}
                    primary
                  />
                  <StatCard
                    title="Streak"
                    value={`${streak}d`}
                    icon={<FaBolt size={11} />}
                  />
                </>
              )}
            </div>
          </div>

          {/* ── Continue watching ──
              The highest-value action in a course product, and previously
              absent: students had to navigate to Lists and remember where they
              stopped. It now outranks the daily quote, which the audit found
              was the largest element above the fold despite being static. */}
          {resumeTarget ? (
            <div className="mt-8 rounded-card border border-line bg-surface-sunken p-5 md:p-6 shadow-e2">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
                    Continue watching
                  </span>
                  <h2 className="mt-2 truncate text-xl font-bold text-ink md:text-2xl">
                    {resumeTarget.title || "Your last lecture"}
                  </h2>
                  <p className="mt-1 text-sm text-ink-subtle">
                    {[resumeTarget.module, resumeTarget.section]
                      .filter(Boolean)
                      .join(" — ")}
                    {resumeTarget.remainingSeconds
                      ? ` · ${formatRemaining(resumeTarget.remainingSeconds)}`
                      : ""}
                  </p>

                  <div
                    className="mt-3 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-line"
                    role="progressbar"
                    aria-valuenow={resumeTarget.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Lecture progress"
                  >
                    <div
                      className="h-full rounded-full bg-brand transition-[width] duration-slow ease-brand"
                      style={{ width: `${resumeTarget.percent}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(buildResumeHref(resumeTarget))}
                  className="btn-primary shrink-0"
                >
                  <FaPlay size={12} aria-hidden="true" />
                  Resume
                </button>
              </div>
            </div>
          ) : null}

          {/* Daily quote — demoted to a quiet footer line. */}
          <p className="mt-6 border-t border-line pt-5 text-sm italic text-ink-subtle">
            &ldquo;{dailyQuote}&rdquo;
          </p>
        </div>

        {/* ── Subject sections ── */}
        <div className="mt-10 space-y-12">
          {contentLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 w-52 bg-slate-200 rounded-lg mb-2" />
                <div className="h-3 w-72 bg-slate-100 rounded mb-5" />
                <div className="flex gap-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex-shrink-0 w-64 h-52 rounded-2xl bg-slate-200" />
                  ))}
                </div>
              </div>
            ))
          ) : subjects.length === 0 ? (
            <div className="card p-8 text-center text-ink-muted">
              {schoolMode ? (
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Activate a class to see your dashboard</h2>
                  <p className="mx-auto mt-2 max-w-xl">
                    The School dashboard shows only the class the student has paid for. Choose a class plan to unlock
                    subjects, chapters, and progress tracking.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/subscription")}
                    className="btn-primary mt-5"
                  >
                    Choose Class and Subscribe
                  </button>
                </div>
              ) : (
                // Was a bare string in a grey box — no icon, no next step.
                <div>
                  <span
                    aria-hidden="true"
                    className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-xl text-brand"
                  >
                    <FaPlay size={16} />
                  </span>
                  <h2 className="mt-4 text-xl font-bold text-ink">
                    Your subjects are on the way
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
                    Course content hasn&apos;t been published to your account yet.
                    Browse the catalog to see what&apos;s coming, or check back shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/courses")}
                    className="btn-secondary mt-5"
                  >
                    Browse courses
                  </button>
                </div>
              )}
            </div>
          ) : (
            subjects.map((subject) => {
              const subjectTotal = subject.chapters.reduce((s, ch) => s + ch.videoIds.length, 0);
              const subjectWatched = subject.chapters.reduce(
                (s, ch) => s + ch.videoIds.filter((id) => watched[id]).length, 0
              );
              const subjectProgress = subjectTotal > 0 ? Math.round((subjectWatched / subjectTotal) * 100) : 0;

              return (
                <section key={subject.subjectId || subject.name}>
                  {/* Subject header */}
                  <div className="mb-5">

                    {/* Row 1: name + badge on left, percentage on right */}
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3 flex-wrap min-w-0">
                        <button
                          onClick={() => navigate(`/lists?subject=${encodeURIComponent(subject.name)}`)}
                          className="text-3xl md:text-4xl font-black text-slate-900 hover:text-cyan-600 transition-colors duration-150 text-left"
                        >
                          {subject.name}
                        </button>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {subjectWatched}/{subjectTotal} watched
                        </span>
                      </div>
                      <span className="text-2xl md:text-3xl font-black tabular-nums text-slate-800 shrink-0">
                        {subjectProgress}%
                      </span>
                    </div>

                    {/* Row 2: full-width progress bar */}
                    <div className="relative h-3 md:h-3.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 transition-all duration-700"
                        style={{
                          width: `${subjectProgress}%`,
                          boxShadow: subjectProgress > 0 ? "0 2px 12px rgba(14,165,233,0.45)" : "none",
                        }}
                      />
                    </div>

                    {/* Row 3: watched / total label */}
                    <p className="mt-2 text-xs text-ink-subtle tabular-nums">
                      {subjectWatched} of {subjectTotal} lectures completed
                    </p>
                  </div>

                  {/* Carousel — clicking a card opens that chapter in Lists */}
                  <ChapterCarousel
                    chapters={subject.chapters}
                    watched={watched}
                    compact={compact}
                    showProgressPercent={showProgressPercent}
                    onChapterClick={(chapter) =>
                      navigate(`/lists?subject=${encodeURIComponent(subject.name)}&chapter=${chapter.chapterId}`)
                    }
                  />
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────

// `primary` marks the one stat that should read first. The audit found four
// different accent hues across four cards, so none of them carried emphasis.
function StatCard({ title, value, icon, primary = false }) {
  return (
    <div
      className={`rounded-control border px-3 py-2.5 flex items-center gap-2.5 shadow-e1 ${
        primary
          ? "border-brand/30 bg-brand-soft"
          : "border-line bg-surface"
      }`}
    >
      <div
        aria-hidden="true"
        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
          primary ? "bg-brand text-brand-fg" : "bg-surface-sunken text-ink-subtle"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-base font-black text-ink tabular-nums leading-none">{value}</p>
        <p className="text-xs text-ink-subtle mt-0.5 truncate">{title}</p>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 flex items-center gap-2.5 shadow-sm animate-pulse">
      <div className="w-7 h-7 rounded-lg bg-slate-200 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="h-4 w-8 bg-slate-200 rounded mb-1.5" />
        <div className="h-2.5 w-16 bg-slate-100 rounded" />
      </div>
    </div>
  );
}
