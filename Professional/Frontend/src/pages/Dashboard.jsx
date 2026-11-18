import { createElement, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlay, FaArrowRight, FaFire, FaCircleCheck, FaLayerGroup, FaLightbulb, FaClock, FaFlask, FaShieldVirus, FaPills, FaBacterium, FaBrain, FaBookMedical, FaCirclePlay } from "react-icons/fa6";
import { getMedicineUsmleContent, getProfile } from "../utils/authApi";
import { useAppSettings } from "../utils/settings";
import { getLastWatched, formatRemaining } from "../utils/progress";
// Subject cards are typographic on purpose. They previously carried crops of
// an AI illustration (Card-Thumb-1..5.png) that contained "[cite: 1]" text
// artifacts, and the cards used per-subject hex gradients that ignored the
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
      published: (subject.chapters || []).flatMap((chapter) =>
        (chapter.videos || [])
          .filter((v) => v.videoLink && v._id)
          .map((v) => ({
            videoId: v._id,
            title: v.name?.trim() || "Untitled lecture",
            duration: v.duration || "",
            subjectId: subject._id,
            chapterId: chapter._id,
            subject: subject?.name?.trim() || "",
            chapter: chapter?.name?.trim() || "",
          }))
      ),
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

// ─── Helpers for the page ──────────────────────────────────────────────────

const SUBJECT_ICONS = [
  [/bio ?chem/i, FaFlask],
  [/immun/i, FaShieldVirus],
  [/pharma/i, FaPills],
  [/micro/i, FaBacterium],
  [/neuro|anatom/i, FaBrain],
];
const iconFor = (name) => SUBJECT_ICONS.find(([re]) => re.test(name))?.[1] || FaBookMedical;

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Burning the midnight oil" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const lectureHref = (l) => {
  const params = new URLSearchParams({ module: l.subject, section: l.chapter, title: l.title, duration: l.duration });
  params.set("subjectId", l.subjectId);
  params.set("chapterId", l.chapterId);
  params.set("videoId", l.videoId);
  return `/video?${params.toString()}`;
};

function Accent({ children }) {
  return (
    <span className="kx-u kx-accent">
      {children}
      <svg viewBox="0 0 200 18" preserveAspectRatio="none" aria-hidden="true"><path d="M3 13 C 50 5, 120 3, 197 9" /></svg>
    </span>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const settings = useAppSettings();
  const [subjects, setSubjects] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [profileVersion, setProfileVersion] = useState(0);
  const [resumeTarget] = useState(() => getLastWatched());
  const resume = useMemo(() => resumeProgress(resumeTarget), [resumeTarget]);
  const watched = useMemo(readWatched, []);

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("kanthastUser") || "null"); }
    catch { return null; }
  }, [profileVersion]); // eslint-disable-line react-hooks/exhaustive-deps
  const firstName = user?.firstName || user?.name?.trim().split(/\s+/)[0] || "";
  const dailyQuote = QUOTES[useMemo(getDailyIndex, [])];

  useEffect(() => {
    const token = localStorage.getItem("kanthastToken");
    if (!token) return;
    let mounted = true;
    getProfile(token)
      .then((data) => {
        if (!mounted || !data.user) return;
        localStorage.setItem("kanthastUser", JSON.stringify(data.user));
        setProfileVersion((v) => v + 1);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setContentError(false);
      try {
        const data = await getMedicineUsmleContent();
        if (mounted) setSubjects(buildSubjects(data.content));
      } catch {
        if (!mounted) return;
        setSubjects([]);
        setContentError(true);
      } finally {
        if (mounted) setContentLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [profileVersion, reloadKey]);

  const retry = () => { setContentLoading(true); setReloadKey((k) => k + 1); };

  const stats = useMemo(() => {
    const published = subjects.flatMap((s) => s.published);
    return {
      published,
      planned: subjects.reduce((n, s) => n + s.lectureIds.length, 0),
      watchedCount: published.filter((l) => watched[l.videoId]).length,
      nextUp: published.find((l) => !watched[l.videoId]) || null,
    };
  }, [subjects, watched]);

  const streak = getStreak();
  const compact = settings.compactLayout;
  const showPercent = settings.showProgressPercent;
  const sortedSubjects = useMemo(
    () => [...subjects].sort((a, b) => (b.published.length > 0) - (a.published.length > 0)),
    [subjects]
  );

  // The one thing to do next: resume > first unwatched published lecture > all caught up.
  let upNext;
  if (resumeTarget) {
    upNext = {
      kind: "resume",
      label: "Continue watching",
      title: resumeTarget.title || "Your last lecture",
      meta: [resumeTarget.module, resumeTarget.section].filter(Boolean).join(" · "),
      extra: resume?.remaining ? formatRemaining(resume.remaining) : "",
      percent: resume?.percent ?? null,
      cta: "Resume",
      href: buildResumeHref(resumeTarget),
    };
  } else if (stats.nextUp) {
    upNext = {
      kind: "start",
      label: stats.watchedCount ? "Up next" : "Start here",
      title: stats.nextUp.title,
      meta: [stats.nextUp.subject, stats.nextUp.chapter].filter(Boolean).join(" · "),
      extra: stats.nextUp.duration ? `${stats.nextUp.duration} min` : "",
      percent: null,
      cta: stats.watchedCount ? "Play next" : "Start lecture",
      href: lectureHref(stats.nextUp),
    };
  } else if (!contentLoading && !contentError && stats.published.length > 0) {
    upNext = { kind: "done", label: "All caught up", title: "You've watched every published lecture.", meta: "New lectures are released subject by subject.", cta: "Open library", href: "/library" };
  }

  const subline = resumeTarget
    ? "Pick up right where you stopped."
    : stats.watchedCount
      ? "Nice work so far. Here is what to watch next."
      : stats.published.length
        ? `${stats.published.length} lectures are ready to watch. Start with the first one.`
        : "Your lectures will appear here as they are released.";

  return (
    <div className={`db ${compact ? "db-compact" : ""}`}>
      {/* ── Header: greeting + the next lecture ── */}
      <section className="db-hero" aria-labelledby="db-title">
        <div className="db-hello">
          <p className="kx-eyebrow">
            <FaCirclePlay aria-hidden="true" />
            Your Dashboard
          </p>
          <h1 id="db-title" className="db-title">
            {greeting()}{firstName ? ", " : ""}
            {firstName ? <Accent>{firstName}</Accent> : null}
            <span className="kx-accent">.</span>
          </h1>
          <p className="db-sub">{subline}</p>
          <p className="db-quote">
            <span className="db-quote-icon" aria-hidden="true"><FaLightbulb /></span>
            <span>&ldquo;{dailyQuote}&rdquo;</span>
          </p>
        </div>

        <div className="db-next" aria-live="polite">
          {contentLoading && !resumeTarget ? (
            <div className="db-next-card is-loading" aria-hidden="true">
              <span className="db-skel w-24" /><span className="db-skel h-7 w-4/5 mt-4" /><span className="db-skel w-1/2 mt-3" /><span className="db-skel h-12 w-40 mt-8 rounded-full" />
            </div>
          ) : upNext ? (
            <div className={`db-next-card is-${upNext.kind}`}>
              <span className="db-next-glow" aria-hidden="true" />
              <span className="db-pill">{upNext.kind === "done" ? <FaCircleCheck aria-hidden="true" /> : <FaPlay aria-hidden="true" />}{upNext.label}</span>
              <h2 className="db-next-title">{upNext.title}</h2>
              <p className="db-next-meta">
                {upNext.meta}
                {upNext.extra ? <span className="db-next-extra"><FaClock aria-hidden="true" />{upNext.extra}</span> : null}
              </p>
              {upNext.percent != null ? (
                <div className="db-bar" role="progressbar" aria-valuenow={upNext.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Lecture progress">
                  <span style={{ width: `${upNext.percent}%` }} />
                </div>
              ) : null}
              <button type="button" className="db-btn" onClick={() => navigate(upNext.href)}>
                {upNext.kind === "done" ? null : <FaPlay aria-hidden="true" className="text-[0.75em]" />}
                {upNext.cta}
                <FaArrowRight aria-hidden="true" className="text-[0.8em]" />
              </button>
            </div>
          ) : contentError ? (
            <div className="db-next-card">
              <span className="db-pill">Offline?</span>
              <h2 className="db-next-title">We couldn&apos;t load your lectures.</h2>
              <p className="db-next-meta">Check your connection and try again.</p>
              <button type="button" className="db-btn" onClick={retry}>Retry</button>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── Progress at a glance ── */}
      <dl className="db-stats">
        <Stat
          icon={FaCircleCheck}
          label="Lectures watched"
          value={contentLoading ? "–" : stats.watchedCount}
          suffix={contentLoading || contentError ? "" : `of ${stats.published.length}`}
          note={stats.watchedCount ? "Every one counts." : "Your first one is a click away."}
          progress={stats.published.length ? stats.watchedCount / stats.published.length : 0}
        />
        <Stat
          icon={FaFire}
          tone="warm"
          label="Day streak"
          value={streak}
          suffix={streak === 1 ? "day" : "days"}
          note={streak ? "Come back tomorrow to keep it going." : "Watch a lecture today to start one."}
        />
        <Stat
          icon={FaLayerGroup}
          label="Lectures released"
          value={contentLoading ? "–" : stats.published.length}
          suffix={contentLoading || contentError ? "" : `of ${stats.planned}`}
          note="New lectures are added subject by subject."
          progress={stats.planned ? stats.published.length / stats.planned : 0}
        />
      </dl>

      {/* ── Ready to watch ── */}
      {stats.published.length > 0 ? (
        <section className="db-section" aria-labelledby="db-ready">
          <div className="db-head">
            <div>
              <p className="kx-eyebrow"><FaPlay aria-hidden="true" />Ready Now</p>
              <h2 id="db-ready" className="db-h2">Ready to <Accent>Watch</Accent><span className="kx-accent">.</span></h2>
            </div>
            <button type="button" className="db-link" onClick={() => navigate("/library")}>
              Open library <FaArrowRight aria-hidden="true" />
            </button>
          </div>
          <ul className="db-lectures">
            {stats.published.slice(0, 6).map((l, i) => {
              const done = Boolean(watched[l.videoId]);
              const inProgress = !done && resumeTarget?.videoId === l.videoId;
              return (
                <li key={l.videoId}>
                  <button type="button" className="db-lecture" onClick={() => navigate(lectureHref(l))}>
                    <span className={`db-lecture-play ${done ? "is-done" : ""}`} aria-hidden="true">
                      {done ? <FaCircleCheck /> : <FaPlay />}
                    </span>
                    <span className="db-lecture-text">
                      <span className="db-lecture-title">{l.title}</span>
                      <span className="db-lecture-meta">{l.subject} · {l.chapter}</span>
                    </span>
                    <span className="db-lecture-side">
                      {l.duration ? <span className="db-lecture-time"><FaClock aria-hidden="true" />{l.duration}</span> : null}
                      <span className={`db-tag ${done ? "is-done" : inProgress ? "is-progress" : i === 0 && !stats.watchedCount && !resumeTarget ? "is-new" : ""}`}>
                        {done ? "Watched" : inProgress ? "In progress" : i === 0 && !stats.watchedCount && !resumeTarget ? "Start here" : "New"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* ── Subjects ── */}
      <section className="db-section" aria-labelledby="db-subjects">
        <div className="db-head">
          <div>
            <p className="kx-eyebrow"><FaLayerGroup aria-hidden="true" />Syllabus</p>
            <h2 id="db-subjects" className="db-h2">Your <Accent>Subjects</Accent><span className="kx-accent">.</span></h2>
          </div>
          <p className="db-head-note">Lectures are released subject by subject. Progress counts published lectures only.</p>
        </div>

        {contentLoading ? (
          <ul className="db-subjects">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="db-subject is-loading" aria-hidden="true">
                <span className="db-skel h-14 w-14 rounded-full" /><span className="db-skel h-5 w-32 mt-5" /><span className="db-skel w-44 mt-3" />
              </li>
            ))}
          </ul>
        ) : contentError ? (
          <div className="db-empty" role="alert">
            <h3>We couldn&apos;t load your subjects</h3>
            <p>Check your connection and try again. Your progress is saved on this device and isn&apos;t affected.</p>
            <button type="button" className="db-btn" onClick={retry}>Retry</button>
          </div>
        ) : subjects.length === 0 ? (
          <div className="db-empty">
            <h3>Your subjects are on the way</h3>
            <p>Course content hasn&apos;t been published yet. Browse the catalog to see what&apos;s coming.</p>
            <button type="button" className="db-btn" onClick={() => navigate("/courses")}>Browse courses</button>
          </div>
        ) : (
          <ul className="db-subjects">
            {sortedSubjects.map((subject) => (
              <li key={subject.subjectId || subject.name} className="flex">
                <SubjectCard
                  subject={subject}
                  watched={watched}
                  showPercent={showPercent}
                  onClick={() => navigate(`/library?subject=${encodeURIComponent(subject.name)}`)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ─── Pieces ────────────────────────────────────────────────────────────────

function Stat({ icon, tone, label, value, suffix, note, progress }) {
  return (
    <div className={`db-stat ${tone ? `is-${tone}` : ""}`}>
      <span className="db-stat-icon" aria-hidden="true">{createElement(icon)}</span>
      <div className="db-stat-body">
        <dt className="db-stat-label">{label}</dt>
        <dd className="db-stat-value">
          <span className="tabular-nums">{value}</span>
          {suffix ? <span className="db-stat-suffix">{suffix}</span> : null}
        </dd>
        {progress != null ? (
          <div className="db-bar db-bar-thin" aria-hidden="true"><span style={{ width: `${Math.round(progress * 100)}%` }} /></div>
        ) : null}
        <p className="db-stat-note">{note}</p>
      </div>
    </div>
  );
}

function SubjectCard({ subject, watched, showPercent, onClick }) {
  const published = subject.published.length;
  const done = subject.published.filter((l) => watched[l.videoId]).length;
  const percent = published ? Math.round((done / published) * 100) : 0;
  const meta = `${plural(subject.chapterCount, "chapter")} · ${plural(subject.lectureIds.length, "lecture")}`;
  const status = published ? `${done} of ${published} watched` : "Coming soon";

  return (
    <button type="button" onClick={onClick} aria-label={`${subject.name}: ${meta}. ${status}.`} className={`db-subject ${published ? "is-live" : "is-soon"}`}>
      <span className="db-subject-top">
        <span className="db-subject-icon" aria-hidden="true">{createElement(iconFor(subject.name))}</span>
        {published ? <span className="db-tag is-live">{published} ready</span> : <span className="db-tag is-soon">Coming soon</span>}
      </span>
      <span className="db-subject-name">{subject.name}</span>
      <span className="db-subject-meta">{meta}</span>
      <span className="db-subject-foot">
        {published ? (
          <>
            <span className="db-subject-progress">
              <span>{status}</span>
              {showPercent ? <span className="font-semibold text-ink">{percent}%</span> : null}
            </span>
            <span className="db-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${subject.name} progress`}>
              <span style={{ width: `${Math.max(percent, 2)}%` }} />
            </span>
          </>
        ) : (
          <span className="db-subject-soon">Lectures are in production. Browse the chapter list now.</span>
        )}
        <span className="db-subject-go" aria-hidden="true"><FaArrowRight /></span>
      </span>
    </button>
  );
}
