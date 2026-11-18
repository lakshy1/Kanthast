import { createElement, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlay, FaArrowRight, FaFire, FaCircleCheck, FaLayerGroup, FaLightbulb, FaClock, FaFlask, FaSquareRootVariable, FaEarthAsia, FaBookOpen, FaLanguage, FaScroll, FaLaptopCode, FaGraduationCap, FaPenNib, FaCirclePlay } from "react-icons/fa6";
import { Eyebrow, Accent } from "../components/ui/Brandmarks";
import { SCRIPT_COUNTS } from "../data/schoolCatalog";
import { getProfile } from "../utils/authApi";
import { useAppSettings } from "../utils/settings";
import { getLastWatched, formatRemaining } from "../utils/progress";
import {
  getSchoolCourseContent,
  getSchoolClassLabel,
  getSelectedSchoolClass,
  hasPaidForSchoolClass,
} from "../utils/schoolCatalogData";

// Subject cards are typographic on purpose. They previously carried crops of
// an AI illustration (Card-Thumb-1..5.png) that contained "[cite: 1]" text
// artifacts, and School cards used per-subject hex gradients that ignored the
// theme. Name, counts and progress are the card; nothing else is needed.


// A streak only counts if the last watched day is today or yesterday;
// VideoPage writes the count but never decays it, so a lapsed streak would
// otherwise keep showing its old value.
function getStreak() {
  try {
    const streak = JSON.parse(localStorage.getItem("kanthastSchoolStreak") || "{}");
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
    return JSON.parse(localStorage.getItem("kanthastSchoolWatched") || "{}") || {};
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
  [/math/i, FaSquareRootVariable],
  [/social/i, FaEarthAsia],
  [/science/i, FaFlask],
  [/english/i, FaBookOpen],
  [/hindi/i, FaLanguage],
  [/sanskrit/i, FaScroll],
  [/information|computer|\bit\b/i, FaLaptopCode],
];
const iconFor = (name) => SUBJECT_ICONS.find(([re]) => re.test(name))?.[1] || FaGraduationCap;

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Up late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

// Subjects with their chapters and lessons for the selected class. Only lessons with a
// video count as watchable; the rest are scripted and in production.
function buildSchoolSubjects(classValue) {
  return (getSchoolCourseContent(classValue).subjects || []).map((subject) => {
    const lessons = subject.chapters.flatMap((chapter) =>
      chapter.videos.map((v) => ({
        videoId: v._id,
        title: v.name,
        duration: v.duration || "",
        hasVideo: Boolean(v.videoLink),
        subjectId: subject._id,
        chapterId: chapter._id,
        subject: subject.name,
        chapter: chapter.name,
      }))
    );
    const real = SCRIPT_COUNTS[classValue]?.[subject.name];
    return {
      name: subject.name,
      subjectId: subject._id,
      chapters: subject.chapters,
      lessons,
      videos: lessons.filter((l) => l.hasVideo),
      scriptedChapters: real?.chapters ?? null,
      scriptedLessons: real?.lessons ?? null,
    };
  });
}

const lessonHref = (l) => {
  const params = new URLSearchParams({ module: l.subject, section: l.chapter, title: l.title, duration: l.duration });
  params.set("subjectId", l.subjectId);
  params.set("chapterId", l.chapterId);
  params.set("videoId", l.videoId);
  return `/video?${params.toString()}`;
};

// ─── Page ──────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const settings = useAppSettings();
  const classValue = getSelectedSchoolClass();
  const classLabel = getSchoolClassLabel(classValue);
  const [profileVersion, setProfileVersion] = useState(0);
  const [resumeTarget] = useState(() => getLastWatched());
  const resume = useMemo(() => resumeProgress(resumeTarget), [resumeTarget]);
  const watched = useMemo(readWatched, []);

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("kanthastSchoolUser") || "null"); }
    catch { return null; }
  }, [profileVersion]); // eslint-disable-line react-hooks/exhaustive-deps
  const firstName = user?.firstName || user?.name?.trim().split(/\s+/)[0] || "";

  useEffect(() => {
    const token = localStorage.getItem("kanthastSchoolToken");
    if (!token) return;
    let mounted = true;
    getProfile(token)
      .then((data) => {
        if (!mounted || !data.user) return;
        localStorage.setItem("kanthastSchoolUser", JSON.stringify(data.user));
        setProfileVersion((v) => v + 1);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const paid = hasPaidForSchoolClass();
  const subjects = useMemo(
    () => (paid ? buildSchoolSubjects(classValue) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [classValue, profileVersion, paid]
  );

  const stats = useMemo(() => {
    const lessons = subjects.flatMap((s) => s.lessons);
    const videos = subjects.flatMap((s) => s.videos);
    const real = Object.values(SCRIPT_COUNTS[classValue] || {});
    return {
      lessons: real.reduce((n, x) => n + x.lessons, 0),
      chapters: real.reduce((n, x) => n + x.chapters, 0),
      videos,
      watchedCount: videos.filter((l) => watched[l.videoId]).length,
      nextVideo: videos.find((l) => !watched[l.videoId]) || null,
      firstLesson: lessons[0] || null,
    };
  }, [subjects, watched, classValue]);

  const streak = getStreak();
  const compact = settings.compactLayout;
  const showPercent = settings.showProgressPercent;

  let upNext;
  if (!paid) {
    upNext = { kind: "plan", label: "Get started", title: "Choose your class plan", meta: "Pick Class VIII, IX or X to unlock its subjects, chapters and lessons.", cta: "Choose a class", href: "/subscription" };
  } else if (resumeTarget) {
    upNext = {
      kind: "resume", label: "Continue watching", title: resumeTarget.title || "Your last lesson",
      meta: [resumeTarget.module, resumeTarget.section].filter(Boolean).join(" · "),
      extra: resume?.remaining ? formatRemaining(resume.remaining) : "", percent: resume?.percent ?? null,
      cta: "Resume", href: buildResumeHref(resumeTarget), play: true,
    };
  } else if (stats.nextVideo) {
    upNext = {
      kind: "start", label: stats.watchedCount ? "Up next" : "Start here", title: stats.nextVideo.title,
      meta: [stats.nextVideo.subject, stats.nextVideo.chapter].filter(Boolean).join(" · "),
      extra: stats.nextVideo.duration ? `${stats.nextVideo.duration} min` : "",
      cta: stats.watchedCount ? "Play next" : "Start lesson", href: lessonHref(stats.nextVideo), play: true,
    };
  } else if (stats.firstLesson) {
    upNext = {
      kind: "explore", label: `${classLabel} syllabus`, title: `${stats.firstLesson.subject}: ${stats.firstLesson.chapter}`,
      meta: `All ${stats.lessons} lessons for ${classLabel} are scripted. The animated videos are being made now.`,
      cta: "Explore chapters", href: `/library?subject=${encodeURIComponent(stats.firstLesson.subject)}`,
    };
  }

  const subline = !paid
    ? "Pick your class to set up your dashboard."
    : resumeTarget
      ? "Pick up right where you stopped."
      : stats.videos.length
        ? `${stats.videos.length} lessons are ready to watch in ${classLabel}.`
        : `Your ${classLabel} dashboard. Lessons appear here as their videos are released.`;

  return (
    <div className={`db is-school ${compact ? "db-compact" : ""}`}>
      <section className="db-hero" aria-labelledby="db-title">
        <div className="db-hello">
          <div className="db-eyebrows">
            <Eyebrow icon={FaCirclePlay}>Your Dashboard</Eyebrow>
            {paid && classLabel ? <span className="db-class-pill">{classLabel}</span> : null}
          </div>
          <h1 id="db-title" className="db-title">
            {greeting()}
            {firstName ? <>, <Accent>{firstName}</Accent></> : <span className="bh-accent">.</span>}
          </h1>
          <p className="db-sub">{subline}</p>
          <p className="db-quote">
            <span className="db-quote-icon" aria-hidden="true"><FaLightbulb /></span>
            <span>Small visual wins every day turn hard chapters into confident answers.</span>
          </p>
        </div>

        <div className="db-next">
          {upNext ? (
            <div className={`db-next-card is-${upNext.kind}`}>
              <span className="db-next-glow" aria-hidden="true" />
              <span className="db-pill">{upNext.play ? <FaPlay aria-hidden="true" /> : <FaPenNib aria-hidden="true" />}{upNext.label}</span>
              <h2 className="db-next-title">{upNext.title}</h2>
              <p className="db-next-meta">
                {upNext.meta}
                {upNext.extra ? <span className="db-next-extra"><FaClock aria-hidden="true" />{upNext.extra}</span> : null}
              </p>
              {upNext.percent != null ? (
                <div className="db-bar" role="progressbar" aria-valuenow={upNext.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Lesson progress">
                  <span style={{ width: `${upNext.percent}%` }} />
                </div>
              ) : null}
              <button type="button" className="db-btn" onClick={() => navigate(upNext.href)}>
                {upNext.play ? <FaPlay aria-hidden="true" className="text-[0.75em]" /> : null}
                {upNext.cta}
                <FaArrowRight aria-hidden="true" className="text-[0.8em]" />
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {paid ? (
        <dl className="db-stats">
          <Stat icon={FaLayerGroup} label="Lessons scripted" value={stats.lessons} suffix={`in ${stats.chapters} chapters`} note={`Every chapter of ${classLabel}, written scene by scene.`} />
          <Stat
            icon={FaCirclePlay}
            label="Videos released"
            value={stats.videos.length}
            suffix={`of ${stats.lessons}`}
            note={stats.videos.length ? `${stats.watchedCount} watched so far.` : "Animation is in production."}
            progress={stats.lessons ? stats.videos.length / stats.lessons : 0}
          />
          <Stat icon={FaFire} tone="warm" label="Day streak" value={streak} suffix={streak === 1 ? "day" : "days"} note={streak ? "Come back tomorrow to keep it going." : "Watch a lesson to start one."} />
        </dl>
      ) : null}

      {stats.videos.length > 0 ? (
        <section className="db-section" aria-labelledby="db-ready">
          <div className="db-head">
            <div>
              <Eyebrow>Ready Now</Eyebrow>
              <h2 id="db-ready" className="db-h2">Ready to <Accent>Watch</Accent></h2>
            </div>
            <button type="button" className="db-link" onClick={() => navigate("/library")}>Open library <FaArrowRight aria-hidden="true" /></button>
          </div>
          <ul className="db-lectures">
            {stats.videos.slice(0, 6).map((l) => {
              const done = Boolean(watched[l.videoId]);
              return (
                <li key={l.videoId}>
                  <button type="button" className="db-lecture" onClick={() => navigate(lessonHref(l))}>
                    <span className={`db-lecture-play ${done ? "is-done" : ""}`} aria-hidden="true">{done ? <FaCircleCheck /> : <FaPlay />}</span>
                    <span className="db-lecture-text">
                      <span className="db-lecture-title">{l.title}</span>
                      <span className="db-lecture-meta">{l.subject} · {l.chapter}</span>
                    </span>
                    <span className="db-lecture-side">
                      {l.duration ? <span className="db-lecture-time"><FaClock aria-hidden="true" />{l.duration}</span> : null}
                      <span className={`db-tag ${done ? "is-done" : ""}`}>{done ? "Watched" : "New"}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="db-section" aria-labelledby="db-subjects">
        <div className="db-head">
          <div>
            <Eyebrow icon={FaLayerGroup}>{paid ? `${classLabel} Syllabus` : "Syllabus"}</Eyebrow>
            <h2 id="db-subjects" className="db-h2">Your <Accent>Subjects</Accent></h2>
          </div>
          {paid ? <p className="db-head-note">Open a subject to see its chapters and lessons. Videos are released chapter by chapter.</p> : null}
        </div>

        {!paid ? (
          <div className="db-empty">
            <h3>Activate a class to see your subjects</h3>
            <p>Your dashboard shows the class you have chosen. Pick Class VIII, IX or X to unlock its subjects, chapters and progress.</p>
            <button type="button" className="db-btn" onClick={() => navigate("/subscription")}>Choose a class</button>
          </div>
        ) : (
          <ul className="db-subjects">
            {subjects.map((subject) => (
              <li key={subject.subjectId} className="flex">
                <SubjectCard subject={subject} watched={watched} showPercent={showPercent} onClick={() => navigate(`/library?subject=${encodeURIComponent(subject.name)}`)} />
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
        {progress != null ? <div className="db-bar db-bar-thin" aria-hidden="true"><span style={{ width: `${Math.max(Math.round(progress * 100), progress ? 2 : 0)}%` }} /></div> : null}
        <p className="db-stat-note">{note}</p>
      </div>
    </div>
  );
}

function SubjectCard({ subject, watched, showPercent, onClick }) {
  const ready = subject.videos.length;
  const done = subject.videos.filter((l) => watched[l.videoId]).length;
  const percent = ready ? Math.round((done / ready) * 100) : 0;
  const meta = subject.scriptedLessons != null
    ? `${plural(subject.scriptedChapters, "chapter")} · ${plural(subject.scriptedLessons, "lesson")} scripted`
    : plural(subject.chapters.length, "chapter");
  const status = ready ? `${done} of ${ready} watched` : "Videos coming soon";

  return (
    <button type="button" onClick={onClick} aria-label={`${subject.name}: ${meta}. ${status}.`} className={`db-subject ${ready ? "is-live" : ""}`}>
      <span className="db-subject-top">
        <span className="db-subject-icon" aria-hidden="true">{createElement(iconFor(subject.name))}</span>
        {ready ? <span className="db-tag is-live">{ready} ready</span> : <span className="db-tag is-soon">Scripted</span>}
      </span>
      <span className="db-subject-name">{subject.name}</span>
      <span className="db-subject-meta">{meta}</span>
      <span className="db-subject-foot">
        {ready ? (
          <>
            <span className="db-subject-progress"><span>{status}</span>{showPercent ? <span className="font-semibold">{percent}%</span> : null}</span>
            <span className="db-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${subject.name} progress`}><span style={{ width: `${Math.max(percent, 2)}%` }} /></span>
          </>
        ) : (
          <span className="db-subject-soon">All lessons are scripted. Videos are in production; browse the chapters now.</span>
        )}
        <span className="db-subject-go" aria-hidden="true"><FaArrowRight /></span>
      </span>
    </button>
  );
}
