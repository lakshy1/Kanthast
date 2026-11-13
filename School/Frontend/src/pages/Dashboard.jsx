import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlay } from "react-icons/fa";
import { getProfile } from "../utils/authApi";
import { useAppSettings } from "../utils/settings";
import { getLastWatched, formatRemaining } from "../utils/progress";
import {
  buildSchoolModules,
  getSchoolClassLabel,
  getSelectedSchoolClass,
  hasPaidForSchoolClass,
} from "../utils/schoolCatalogData";

// Subject cards are typographic on purpose. They previously carried crops of
// an AI illustration (Card-Thumb-1..5.png) that contained "[cite: 1]" text
// artifacts, and School cards used per-subject hex gradients that ignored the
// theme. Name, counts and progress are the card; nothing else is needed.

// Lessons are generated per class; every lesson in the plan counts.
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

// ─── Page ──────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const settings = useAppSettings();
  const selectedSchoolClass = getSelectedSchoolClass();
  const selectedSchoolClassLabel = getSchoolClassLabel(selectedSchoolClass);
  const [profileVersion, setProfileVersion] = useState(0);
  // Lecture to offer as "Continue watching" (null once it is completed).
  const [resumeTarget] = useState(() => getLastWatched());
  const resume = useMemo(() => resumeProgress(resumeTarget), [resumeTarget]);
  const watched = useMemo(readWatched, []);

  // Re-read after the profile refresh below rewrites it.
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("kanthastSchoolUser") || "null"); }
    catch { return null; }
  }, [profileVersion]); // eslint-disable-line react-hooks/exhaustive-deps
  const firstName = user?.firstName || user?.name?.trim().split(/\s+/)[0] || "";

  const dailyQuote = "Small visual wins every day turn hard chapters into confident answers.";

  useEffect(() => {
    const token = localStorage.getItem("kanthastSchoolToken");
    if (!token) return;

    let mounted = true;
    getProfile(token)
      .then((data) => {
        if (!mounted || !data.user) return;
        localStorage.setItem("kanthastSchoolUser", JSON.stringify(data.user));
        setProfileVersion((version) => version + 1);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  // The class catalog is built in the browser; only a paid class shows subjects here.
  const subjects = useMemo(
    () => (hasPaidForSchoolClass() ? buildSchoolSubjectsFromModules(buildSchoolModules(selectedSchoolClass)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedSchoolClass, profileVersion]
  );

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
                {hasPaidForSchoolClass()
                  ? `${selectedSchoolClassLabel} learning dashboard. Keep the next chapter moving.`
                  : "Choose and activate a class plan to start your School dashboard."}
              </p>
            </div>

            {/* Stats — one row, three at most. */}
            <dl className={`grid grid-cols-3 ${compact ? "gap-2" : "gap-3"} w-full lg:w-auto lg:min-w-[440px]`}>
              <StatCard title="Lessons" value={publishedCount} />
              <StatCard title="Watched" value={watchedCount} />
              <StatCard title="Day streak" value={streak} />
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
            </div>
          </div>

          {subjects.length === 0 ? (
            <div className="card p-8 text-center text-ink-muted">
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
            </div>
          ) : (
            <ul className={`grid sm:grid-cols-2 lg:grid-cols-3 ${compact ? "gap-3" : "gap-4"}`}>
              {subjects.map((subject) => (
                <li key={subject.subjectId || subject.name} className="flex">
                  <SubjectCard
                    subject={subject}
                    watched={watched}
                    compact={compact}
                    showProgressPercent={showProgressPercent}
                    onClick={() => navigate(`/library?subject=${encodeURIComponent(subject.name)}`)}
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

function SubjectCard({ subject, watched, compact, showProgressPercent, onClick }) {
  const published = subject.publishedIds.length;
  const done = subject.publishedIds.filter((id) => watched[id]).length;
  const percent = published > 0 ? Math.round((done / published) * 100) : 0;
  const unit = "lesson";
  const meta = `${plural(subject.chapterCount, "chapter")} · ${plural(subject.lectureIds.length, "lesson")}`;
  const status = published > 0
    ? `${done} of ${plural(published, "lesson")} watched`
    : "Lessons in production";

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
