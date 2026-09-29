import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlay } from "react-icons/fa";
import { getMedicineUsmleContent, getProfile } from "../utils/authApi";
import { useAppSettings } from "../utils/settings";
import { getLastWatched, formatRemaining } from "../utils/progress";
import {
  buildSchoolModules,
  getSchoolClassLabel,
  getSelectedSchoolClass,
  hasPaidForSchoolClass,
  isSchoolTrack,
} from "../utils/schoolTrack";

// Subject cards are typographic on purpose. They previously carried crops of
// an AI illustration (Card-Thumb-1..5.png) that contained "[cite: 1]" text
// artifacts, and School cards used per-subject hex gradients that ignored the
// theme. Name, counts and progress are the card; nothing else is needed.

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

// `lectureIds` is every catalog entry; `publishedIds` only those with a
// playable video. The catalog is mostly planned lectures with no video yet,
// so progress and the headline count are measured against published ones.
function buildSubjects(content) {
  return (content?.subjects || []).map((subject) => {
    const videos = (subject.chapters || []).flatMap((chapter) => chapter.videos || []);
    return {
      name: subject?.name?.trim() || "Unnamed subject",
      subjectId: subject._id,
      chapterCount: (subject.chapters || []).length,
      lectureIds: videos.map((v) => v._id).filter(Boolean),
      publishedIds: videos.filter((v) => v.videoLink).map((v) => v._id).filter(Boolean),
    };
  });
}

// School lessons are generated per class; every lesson in the plan counts.
function buildSchoolSubjectsFromModules(modules) {
  return Object.entries(modules).map(([subjectName, subject]) => {
    const ids = subject.sections
      .flatMap((section) => section.lectures.map((lecture) => lecture.videoId))
      .filter(Boolean);
    return {
      name: subjectName,
      subjectId: subjectName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      chapterCount: subject.sections.length,
      lectureIds: ids,
      publishedIds: ids,
    };
  });
}

// A streak only counts if the last watched day is today or yesterday;
// VideoPage writes the count but never decays it, so a lapsed streak would
// otherwise keep showing its old value.
function getStreak() {
  try {
    const streak = JSON.parse(localStorage.getItem("kanthastStreak") || "{}");
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (streak.lastDate !== today && streak.lastDate !== yesterday) return 0;
    return streak.count || 0;
  } catch {
    return 0;
  }
}

function readWatched() {
  try {
    return JSON.parse(localStorage.getItem("kanthastWatched") || "{}") || {};
  } catch {
    return {};
  }
}

// Rebuild the /video query string the resume pointer was saved from.
function buildResumeHref(target) {
  const params = new URLSearchParams();
  if (target.module) params.set("module", target.module);
  if (target.section) params.set("section", target.section);
  if (target.title) params.set("title", target.title);
  const durationLabel = target.durationLabel || (typeof target.duration === "string" ? target.duration : "");
  if (durationLabel) params.set("duration", durationLabel);
  if (target.subjectId) params.set("subjectId", target.subjectId);
  if (target.chapterId) params.set("chapterId", target.chapterId);
  if (target.videoId) params.set("videoId", target.videoId);
  return `/video?${params.toString()}`;
}

// Pointers saved before VideoPage renamed its meta to durationLabel carry the
// display duration ("10:51") in `duration`; normalise both forms.
function toSeconds(value) {
  if (Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value.trim()) return 0;
  return value.split(":").reduce((total, part) => total * 60 + (Number(part) || 0), 0);
}

function resumeProgress(target) {
  const total = toSeconds(target?.duration);
  const position = Number(target?.seconds) || 0;
  if (!total) return null;
  return {
    percent: Math.min(100, Math.max(0, Math.round((position / total) * 100))),
    remaining: Math.max(0, total - position),
  };
}

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// ─── Page ──────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const settings = useAppSettings();
  const schoolMode = isSchoolTrack();
  const selectedSchoolClass = getSelectedSchoolClass();
  const selectedSchoolClassLabel = getSchoolClassLabel(selectedSchoolClass);
  const [subjects, setSubjects] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [profileVersion, setProfileVersion] = useState(0);
  // Lecture to offer as "Continue watching" (null once it is completed).
  const [resumeTarget] = useState(() => getLastWatched());
  const resume = useMemo(() => resumeProgress(resumeTarget), [resumeTarget]);
  const watched = useMemo(readWatched, []);

  // Re-read after the profile refresh below rewrites it.
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("kanthastUser") || "null"); }
    catch { return null; }
  }, [profileVersion]); // eslint-disable-line react-hooks/exhaustive-deps
  const firstName = user?.firstName || user?.name?.trim().split(/\s+/)[0] || "";

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
      setContentError(false);
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
        // A failed fetch is not an empty catalog: say so and offer a retry
        // instead of the "subjects are on the way" empty state.
        setSubjects([]);
        setContentError(true);
      } finally {
        if (mounted) setContentLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [schoolMode, selectedSchoolClass, profileVersion, reloadKey]);

  function retry() {
    setContentLoading(true);
    setReloadKey((key) => key + 1);
  }

  const { publishedCount, watchedCount } = useMemo(() => {
    const allIds = subjects.flatMap((s) => s.lectureIds);
    return {
      publishedCount: subjects.reduce((n, s) => n + s.publishedIds.length, 0),
      watchedCount: allIds.filter((id) => watched[id]).length,
    };
  }, [subjects, watched]);

  const streak = getStreak();
  const compact = settings.compactLayout;
  const showProgressPercent = settings.showProgressPercent;
  const statsUnknown = contentError;

  return (
    <div className={`min-h-screen bg-surface-sunken ${compact ? "px-3 md:px-4 py-6 md:py-8" : "px-4 md:px-6 py-8 md:py-10"}`}>
      <div className="page-frame">

        {/* ── Top card ── */}
        <div className={`rounded-sheet border border-line bg-surface shadow-e2 ${compact ? "p-5 md:p-6" : "p-6 md:p-8"}`}>

          {/* Welcome row */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="min-w-0">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-ink">
                Welcome back{firstName ? `, ${firstName}` : ""}
              </h1>
              <p className="text-ink-muted mt-1.5 text-sm">
                {schoolMode
                  ? hasPaidForSchoolClass()
                    ? `${selectedSchoolClassLabel} learning dashboard. Keep the next chapter moving.`
                    : "Choose and activate a class plan to start your School dashboard."
                  : "Build discipline daily. Your consistency compounds every session."}
              </p>
            </div>

            {/* Stats — one row, three at most. */}
            <dl className={`grid grid-cols-3 ${compact ? "gap-2" : "gap-3"} w-full lg:w-auto lg:min-w-[440px]`}>
              {contentLoading ? (
                Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
              ) : (
                <>
                  <StatCard
                    title={schoolMode ? "Lessons" : "Published lectures"}
                    value={statsUnknown ? "–" : publishedCount}
                  />
                  <StatCard title="Watched" value={statsUnknown ? "–" : watchedCount} />
                  <StatCard title="Day streak" value={streak} />
                </>
              )}
            </dl>
          </div>

          {/* ── Continue watching ──
              The highest-value action in a course product: resume where the
              student stopped instead of making them find it in Lists. */}
          {resumeTarget ? (
            <div className="mt-8 rounded-card border border-line bg-surface-sunken p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
                    Continue watching
                  </span>
                  <h2 className="mt-2 line-clamp-2 text-xl font-bold tracking-tight text-ink md:text-2xl">
                    {resumeTarget.title || "Your last lecture"}
                  </h2>
                  <p className="mt-1 text-sm text-ink-subtle tabular-nums">
                    {[resumeTarget.module, resumeTarget.section]
                      .filter(Boolean)
                      .join(" — ")}
                    {resume?.remaining
                      ? ` · ${formatRemaining(resume.remaining)}`
                      : ""}
                  </p>

                  {resume ? (
                    <div
                      className="mt-3 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-line"
                      role="progressbar"
                      aria-valuenow={resume.percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Lecture progress"
                    >
                      <div
                        className="h-full rounded-full bg-brand transition-[width] duration-slow ease-brand"
                        style={{ width: `${resume.percent}%` }}
                      />
                    </div>
                  ) : null}
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

          {/* Daily quote — a quiet footer line. */}
          <p className="mt-6 border-t border-line pt-5 text-sm italic text-ink-subtle">
            &ldquo;{dailyQuote}&rdquo;
          </p>
        </div>

        {/* ── Subjects ── */}
        <section className="mt-10" aria-labelledby="dash-subjects">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="dash-subjects" className="text-2xl md:text-3xl font-bold tracking-tight text-ink">
                Your subjects
              </h2>
              {!schoolMode && !contentLoading && !contentError && subjects.length > 0 ? (
                <p className="mt-1 text-sm text-ink-muted">
                  Lectures are being released subject by subject. Progress counts published lectures only.
                </p>
              ) : null}
            </div>
          </div>

          {contentLoading ? (
            <div className={`grid sm:grid-cols-2 lg:grid-cols-3 ${compact ? "gap-3" : "gap-4"}`}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card p-5 animate-pulse" aria-hidden="true">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-control bg-surface-sunken" />
                    <div className="flex-1">
                      <div className="h-4 w-32 rounded bg-surface-sunken" />
                      <div className="mt-2 h-3 w-44 rounded bg-surface-sunken" />
                    </div>
                  </div>
                  <div className="mt-8 h-1.5 rounded-full bg-surface-sunken" />
                </div>
              ))}
            </div>
          ) : contentError ? (
            <div className="card p-8 text-center" role="alert">
              <h3 className="text-lg font-bold text-ink">We couldn&apos;t load your subjects</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
                Check your connection and try again. Your progress is saved on this device and isn&apos;t affected.
              </p>
              <button type="button" onClick={retry} className="btn-secondary mt-5">
                Retry
              </button>
            </div>
          ) : subjects.length === 0 ? (
            <div className="card p-8 text-center text-ink-muted">
              {schoolMode ? (
                <div>
                  <h3 className="text-xl font-bold text-ink">Activate a class to see your dashboard</h3>
                  <p className="mx-auto mt-2 max-w-xl text-sm">
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
                <div>
                  <h3 className="text-xl font-bold text-ink">Your subjects are on the way</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm">
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
            <ul className={`grid sm:grid-cols-2 lg:grid-cols-3 ${compact ? "gap-3" : "gap-4"}`}>
              {subjects.map((subject) => (
                <li key={subject.subjectId || subject.name} className="flex">
                  <SubjectCard
                    subject={subject}
                    watched={watched}
                    compact={compact}
                    schoolMode={schoolMode}
                    showProgressPercent={showProgressPercent}
                    onClick={() => navigate(`/lists?subject=${encodeURIComponent(subject.name)}`)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

// ─── Subject card ──────────────────────────────────────────────────────────

function SubjectCard({ subject, watched, compact, schoolMode, showProgressPercent, onClick }) {
  const published = subject.publishedIds.length;
  const done = subject.publishedIds.filter((id) => watched[id]).length;
  const percent = published > 0 ? Math.round((done / published) * 100) : 0;
  const unit = schoolMode ? "lesson" : "lecture";
  const meta = schoolMode
    ? `${plural(subject.chapterCount, "chapter")} · ${plural(subject.lectureIds.length, "lesson")}`
    : `${plural(subject.chapterCount, "chapter")} · ${plural(subject.lectureIds.length, "lecture")} planned`;
  const status = published > 0
    ? `${done} of ${plural(published, schoolMode ? "lesson" : "published lecture")} watched`
    : "Lectures in production";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${subject.name}: ${meta}. ${status}.`}
      className={`card group flex w-full flex-col text-left transition-colors duration-fast ease-brand hover:border-brand ${compact ? "p-4" : "p-5"}`}
    >
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-control bg-brand-soft text-xl font-black text-brand"
        >
          {subject.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold tracking-tight text-ink group-hover:text-brand transition-colors duration-fast ease-brand">
            {subject.name}
          </h3>
          <p className="mt-0.5 text-sm text-ink-muted tabular-nums">{meta}</p>
        </div>
      </div>

      <div className={`mt-auto ${compact ? "pt-4" : "pt-6"}`}>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className={published > 0 ? "text-ink-muted tabular-nums" : "text-ink-subtle"}>{status}</span>
          {published > 0 && showProgressPercent ? (
            <span className="font-semibold text-ink tabular-nums">{percent}%</span>
          ) : null}
        </div>
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
          role={published > 0 ? "progressbar" : undefined}
          aria-hidden={published > 0 ? undefined : "true"}
          aria-valuenow={published > 0 ? percent : undefined}
          aria-valuemin={published > 0 ? 0 : undefined}
          aria-valuemax={published > 0 ? 100 : undefined}
          aria-label={published > 0 ? `${subject.name} ${unit} progress` : undefined}
        >
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-slow ease-brand"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </button>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────

function StatCard({ title, value }) {
  return (
    <div className="flex flex-col-reverse justify-end rounded-control border border-line bg-surface-sunken px-3 py-2.5">
      <dt className="mt-1 text-xs text-ink-muted leading-tight">{title}</dt>
      <dd className="text-xl md:text-2xl font-black text-ink tabular-nums leading-none">{value}</dd>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-control border border-line bg-surface-sunken px-3 py-2.5 animate-pulse" aria-hidden="true">
      <div className="h-5 w-8 rounded bg-line" />
      <div className="mt-1.5 h-2.5 w-16 rounded bg-line" />
    </div>
  );
}
